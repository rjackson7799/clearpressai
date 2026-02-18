/**
 * ClearPress AI - Check Compliance Edge Function
 *
 * Real-time compliance checking for PR content.
 * Analyzes content against industry-specific regulations (薬機法, PMDA).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ===== Types =====

type ContentType =
  | 'press_release'
  | 'blog_post'
  | 'social_media'
  | 'internal_memo'
  | 'faq'
  | 'executive_statement';

interface CheckComplianceRequest {
  content: string;
  industry_slug: string;
  content_type?: ContentType;
  language?: 'ja' | 'en';
}

interface ComplianceIssue {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  position?: { start: number; end: number };
  suggestion?: string;
  rule_reference?: string;
}

interface CategoryResult {
  score: number;
  issues: ComplianceIssue[];
}

interface CheckComplianceResponse {
  success: boolean;
  score?: number;
  details?: {
    categories: {
      regulatory_claims: CategoryResult;
      safety_info: CategoryResult;
      fair_balance: CategoryResult;
      substantiation: CategoryResult;
      formatting: CategoryResult;
    };
  };
  suggestions?: ComplianceIssue[];
  error?: {
    code: string;
    message: string;
  };
}

// ===== Compliance Weights =====

const CATEGORY_WEIGHTS = {
  regulatory_claims: 0.3,
  safety_info: 0.25,
  fair_balance: 0.2,
  substantiation: 0.15,
  formatting: 0.1,
};

// ===== Compliance Prompt =====

const COMPLIANCE_CHECK_PROMPT = `You are a pharmaceutical communications compliance expert specializing in Japanese regulations.

APPLICABLE REGULATIONS:
1. 薬機法 (Pharmaceutical and Medical Devices Act) - Articles 66-68 on advertising
2. PMDA広告ガイドライン (PMDA Advertising Guidelines)
3. JPMA行動規範 (JPMA Code of Practice)
4. 医療用医薬品製品情報概要 (Product Information Summary Guidelines)

CONTENT TO REVIEW:
{{CONTENT}}

Analyze the content for compliance issues across these 5 categories:

1. REGULATORY CLAIMS (規制上の主張) - Weight: 30%
   - Unsubstantiated claims
   - Exaggerated benefits
   - Off-label promotion
   - Superiority claims without data

2. SAFETY INFORMATION (安全性情報) - Weight: 25%
   - Required warnings present
   - Contraindications mentioned
   - Adverse events disclosed
   - ISI completeness

3. FAIR BALANCE (公平なバランス) - Weight: 20%
   - Benefits vs risks balanced
   - No misleading omissions
   - Comparative claims substantiated

4. SUBSTANTIATION (根拠) - Weight: 15%
   - Claims supported by evidence
   - References accurate
   - Data presented fairly

5. FORMATTING (形式) - Weight: 10%
   - Required elements present
   - Disclosures properly displayed
   - Regulatory requirements met

PROHIBITED PHRASES (must be flagged as errors):
- "最も効果的" (most effective) - unless proven with head-to-head data
- "完全に治る" (completely cures) - absolute cure claims prohibited
- "副作用がない" (no side effects) - impossible claim
- "100%安全" (100% safe) - impossible claim
- "絶対に効く" (definitely works) - unsubstantiated
- "奇跡の" (miraculous) - exaggerated claim

For each issue found, provide:
- type: "error" (must fix) | "warning" (should fix) | "suggestion" (consider)
- message: Clear description of the issue in Japanese
- position: Character position { start: number, end: number } if identifiable
- suggestion: How to fix the issue
- rule_reference: Specific regulation violated (e.g., "薬機法第66条")

OUTPUT FORMAT (JSON only, no markdown):
{
  "categories": {
    "regulatory_claims": {
      "score": 0-100,
      "issues": [{ "type": "...", "message": "...", "position": {...}, "suggestion": "...", "rule_reference": "..." }]
    },
    "safety_info": { "score": 0-100, "issues": [...] },
    "fair_balance": { "score": 0-100, "issues": [...] },
    "substantiation": { "score": 0-100, "issues": [...] },
    "formatting": { "score": 0-100, "issues": [...] }
  },
  "summary": "Brief overall assessment in Japanese"
}`;

const GENERAL_COMPLIANCE_PROMPT = `You are a PR communications compliance reviewer.

CONTENT TO REVIEW:
{{CONTENT}}

Check for general compliance issues:

1. REGULATORY CLAIMS - Are claims substantiated and not misleading?
2. SAFETY INFORMATION - Are any required warnings included?
3. FAIR BALANCE - Is information presented fairly?
4. SUBSTANTIATION - Are claims supported by evidence?
5. FORMATTING - Is the content properly structured?

OUTPUT FORMAT (JSON only, no markdown):
{
  "categories": {
    "regulatory_claims": { "score": 0-100, "issues": [] },
    "safety_info": { "score": 0-100, "issues": [] },
    "fair_balance": { "score": 0-100, "issues": [] },
    "substantiation": { "score": 0-100, "issues": [] },
    "formatting": { "score": 0-100, "issues": [] }
  },
  "summary": "Brief overall assessment"
}`;

// ===== Helper Functions =====

function buildCompliancePrompt(content: string, industrySlug: string): string {
  const template =
    industrySlug === 'pharmaceutical'
      ? COMPLIANCE_CHECK_PROMPT
      : GENERAL_COMPLIANCE_PROMPT;

  return template.replace('{{CONTENT}}', content);
}

function parseComplianceResponse(response: string): {
  categories: CheckComplianceResponse['details']['categories'];
  summary: string;
} {
  // Remove markdown code blocks if present
  let jsonStr = response;
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Try to find JSON object
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Ensure all categories exist with default values
    const defaultCategory: CategoryResult = { score: 100, issues: [] };
    const categories = {
      regulatory_claims: parsed.categories?.regulatory_claims || defaultCategory,
      safety_info: parsed.categories?.safety_info || defaultCategory,
      fair_balance: parsed.categories?.fair_balance || defaultCategory,
      substantiation: parsed.categories?.substantiation || defaultCategory,
      formatting: parsed.categories?.formatting || defaultCategory,
    };

    // Normalize issue types
    for (const category of Object.values(categories)) {
      category.issues = (category.issues || []).map((issue: ComplianceIssue) => ({
        ...issue,
        type: issue.type || 'warning',
      }));
    }

    return {
      categories,
      summary: parsed.summary || '',
    };
  } catch {
    // Return default scores if parsing fails
    return {
      categories: {
        regulatory_claims: { score: 80, issues: [] },
        safety_info: { score: 80, issues: [] },
        fair_balance: { score: 80, issues: [] },
        substantiation: { score: 80, issues: [] },
        formatting: { score: 80, issues: [] },
      },
      summary: 'Unable to analyze content',
    };
  }
}

function calculateWeightedScore(
  categories: CheckComplianceResponse['details']['categories']
): number {
  let totalScore = 0;

  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    const categoryScore = Math.max(
      0,
      Math.min(100, categories[category as keyof typeof categories]?.score || 100)
    );
    totalScore += categoryScore * weight;
  }

  return Math.round(totalScore);
}

function extractAllSuggestions(
  categories: CheckComplianceResponse['details']['categories']
): ComplianceIssue[] {
  const suggestions: ComplianceIssue[] = [];

  for (const category of Object.values(categories)) {
    for (const issue of category.issues || []) {
      suggestions.push(issue);
    }
  }

  // Sort by severity (errors first, then warnings, then suggestions)
  const severityOrder = { error: 0, warning: 1, suggestion: 2 };
  suggestions.sort(
    (a, b) => severityOrder[a.type] - severityOrder[b.type]
  );

  return suggestions;
}

// ===== Quick Local Check (No AI) =====

function quickComplianceCheck(
  content: string,
  industrySlug: string
): CheckComplianceResponse['details']['categories'] {
  const categories: CheckComplianceResponse['details']['categories'] = {
    regulatory_claims: { score: 100, issues: [] },
    safety_info: { score: 100, issues: [] },
    fair_balance: { score: 100, issues: [] },
    substantiation: { score: 100, issues: [] },
    formatting: { score: 100, issues: [] },
  };

  if (industrySlug !== 'pharmaceutical') {
    return categories;
  }

  // Check for prohibited phrases
  const prohibitedPhrases = [
    {
      phrase: '最も効果的',
      message: '「最も効果的」は比較試験データなしに使用できません',
      rule: '薬機法第66条',
    },
    {
      phrase: '完全に治る',
      message: '「完全に治る」は絶対的な治癒を示唆するため禁止されています',
      rule: '薬機法第66条',
    },
    {
      phrase: '副作用がない',
      message: '「副作用がない」は不正確な主張です',
      rule: 'PMDA広告ガイドライン',
    },
    {
      phrase: '100%安全',
      message: '「100%安全」は不可能な主張です',
      rule: '薬機法第66条',
    },
    {
      phrase: '絶対に効く',
      message: '「絶対に効く」は根拠のない主張です',
      rule: '薬機法第66条',
    },
    {
      phrase: '奇跡の',
      message: '「奇跡の」は誇大な表現です',
      rule: 'JPMA行動規範',
    },
    {
      phrase: '画期的な効果',
      message: '「画期的な効果」は根拠が必要です',
      rule: 'PMDA広告ガイドライン',
    },
  ];

  for (const { phrase, message, rule } of prohibitedPhrases) {
    let index = content.indexOf(phrase);
    while (index !== -1) {
      categories.regulatory_claims.issues.push({
        type: 'error',
        message,
        position: { start: index, end: index + phrase.length },
        suggestion: `「${phrase}」を削除または修正してください`,
        rule_reference: rule,
      });
      categories.regulatory_claims.score -= 15;
      index = content.indexOf(phrase, index + 1);
    }
  }

  // Check for warning phrases
  const warningPhrases = [
    {
      phrase: '効果がある',
      message: '「効果がある」は具体的なデータで裏付ける必要があります',
      rule: 'PMDA広告ガイドライン',
    },
    {
      phrase: '安全です',
      message: '「安全です」は条件付きで使用し、リスク情報も含めてください',
      rule: '薬機法第66条',
    },
  ];

  for (const { phrase, message, rule } of warningPhrases) {
    const index = content.indexOf(phrase);
    if (index !== -1) {
      categories.regulatory_claims.issues.push({
        type: 'warning',
        message,
        position: { start: index, end: index + phrase.length },
        suggestion: '具体的なデータや条件を追加してください',
        rule_reference: rule,
      });
      categories.regulatory_claims.score -= 5;
    }
  }

  // Check for missing safety information indicators
  const safetyTerms = ['禁忌', '警告', '副作用', '注意事項', '安全性情報'];
  const hasSafetyInfo = safetyTerms.some((term) => content.includes(term));

  if (!hasSafetyInfo && content.length > 200) {
    categories.safety_info.issues.push({
      type: 'warning',
      message: '安全性情報が含まれていない可能性があります',
      suggestion: '禁忌、警告、副作用などの安全性情報を追加してください',
      rule_reference: '医療用医薬品製品情報概要ガイドライン',
    });
    categories.safety_info.score -= 20;
  }

  // Ensure scores don't go below 0
  for (const category of Object.values(categories)) {
    category.score = Math.max(0, category.score);
  }

  return categories;
}

// ===== Main Handler =====

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validate request method
    if (req.method !== 'POST') {
      throw { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is allowed' };
    }

    // 2. Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw { code: 'UNAUTHORIZED', message: 'Missing authorization header' };
    }

    // 3. Create Supabase client to verify user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );

    // 4. Verify the calling user
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !caller) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid or expired token' };
    }

    // 5. Parse and validate request body
    const body: CheckComplianceRequest = await req.json();

    if (!body.content) {
      throw { code: 'VALIDATION_ERROR', message: 'content is required' };
    }
    if (!body.industry_slug) {
      throw { code: 'VALIDATION_ERROR', message: 'industry_slug is required' };
    }

    // 6. For short content, do quick local check only
    if (body.content.length < 100) {
      const quickCategories = quickComplianceCheck(body.content, body.industry_slug);
      const quickScore = calculateWeightedScore(quickCategories);

      const response: CheckComplianceResponse = {
        success: true,
        score: quickScore,
        details: { categories: quickCategories },
        suggestions: extractAllSuggestions(quickCategories),
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 7. For longer content, use AI for comprehensive check
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    // If no API key, fall back to quick check
    if (!anthropicApiKey) {
      console.warn('ANTHROPIC_API_KEY not set, using quick check only');
      const quickCategories = quickComplianceCheck(body.content, body.industry_slug);
      const quickScore = calculateWeightedScore(quickCategories);

      const response: CheckComplianceResponse = {
        success: true,
        score: quickScore,
        details: { categories: quickCategories },
        suggestions: extractAllSuggestions(quickCategories),
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 8. Build compliance prompt
    const prompt = buildCompliancePrompt(body.content, body.industry_slug);

    // 9. Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      // Fall back to quick check on API error
      const quickCategories = quickComplianceCheck(body.content, body.industry_slug);
      const quickScore = calculateWeightedScore(quickCategories);

      const response: CheckComplianceResponse = {
        success: true,
        score: quickScore,
        details: { categories: quickCategories },
        suggestions: extractAllSuggestions(quickCategories),
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const claudeData = await claudeResponse.json();
    const analysisText = claudeData.content?.[0]?.text || '';

    // 10. Parse the AI response
    const { categories } = parseComplianceResponse(analysisText);

    // 11. Calculate weighted score
    const score = calculateWeightedScore(categories);

    // 12. Extract all suggestions
    const suggestions = extractAllSuggestions(categories);

    // 13. Build response
    const response: CheckComplianceResponse = {
      success: true,
      score,
      details: { categories },
      suggestions,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const err = error as { code?: string; message?: string };

    let status = 500;
    if (err.code === 'UNAUTHORIZED') status = 401;
    else if (err.code === 'FORBIDDEN') status = 403;
    else if (err.code === 'VALIDATION_ERROR') status = 400;
    else if (err.code === 'METHOD_NOT_ALLOWED') status = 405;

    const response: CheckComplianceResponse = {
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'An unexpected error occurred',
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }
});
