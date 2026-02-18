/**
 * ClearPress AI - Generate Content Edge Function
 *
 * AI-powered content generation for PR materials.
 * Uses Claude API to generate structured content based on briefs and settings.
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

type ToneType = 'formal' | 'professional' | 'friendly' | 'urgent' | 'custom';

interface GenerateContentRequest {
  project_id: string;
  content_type: ContentType;
  brief: string;
  client_style_profile?: {
    tone?: string;
    formality?: 'low' | 'medium' | 'high';
    key_messages?: string[];
    avoid_phrases?: string[];
    boilerplate?: string;
  };
  settings?: {
    tone?: ToneType;
    custom_tone?: string;
    target_length?: number;
    include_isi?: boolean;
    include_boilerplate?: boolean;
    language?: 'ja' | 'en';
  };
}

interface StructuredContent {
  headline?: string;
  subheadline?: string;
  dateline?: string;
  lead?: string;
  body?: string[];
  quotes?: { text: string; attribution: string }[];
  boilerplate?: string;
  isi?: string;
  contact?: string;
  title?: string;
  introduction?: string;
  sections?: { heading: string; content: string }[];
  conclusion?: string;
  cta?: string;
  plain_text?: string;
}

interface ComplianceIssue {
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  position?: { start: number; end: number };
  suggestion?: string;
  rule_reference?: string;
}

interface ComplianceDetails {
  categories: {
    [key: string]: {
      score: number;
      issues: ComplianceIssue[];
    };
  };
}

interface GenerateContentResponse {
  success: boolean;
  content?: StructuredContent;
  compliance_score?: number;
  compliance_details?: ComplianceDetails;
  word_count?: number;
  generation_params?: {
    tone: ToneType;
    model: string;
    temperature: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ===== Prompt Templates =====

const BASE_SYSTEM_PROMPT = `You are ClearPress AI, an expert PR content assistant specialized in creating professional communications for Japanese markets. You have deep expertise in:

1. Japanese business communication (ビジネス日本語)
2. Industry-specific regulatory compliance
3. Cultural nuance and appropriate formality levels
4. PR best practices and media relations

Core Principles:
- Accuracy: Never fabricate facts, quotes, or data
- Compliance: Always adhere to industry regulations
- Cultural Appropriateness: Respect Japanese business customs
- Transparency: Clearly indicate when information needs verification

Output Guidelines:
- Respond in the requested language (Japanese or English)
- Use appropriate honorifics and formality levels
- Structure content according to PR industry standards
- Include required disclaimers and safety information when applicable

You are assisting PR professionals, not replacing their judgment. Flag any concerns about accuracy, compliance, or appropriateness for human review.`;

const CONTENT_TYPE_PROMPTS: Record<ContentType, string> = {
  press_release: `Generate a press release following this structure:

1. HEADLINE (見出し) - Clear, newsworthy, 20-30 characters in Japanese
2. SUBHEADLINE (サブ見出し) - Supporting detail, 30-50 characters
3. DATELINE (日付・発信地) - Format: [都市名]、[YYYY年MM月DD日]
4. LEAD PARAGRAPH (リード文) - Who, What, When, Where, Why in 2-3 sentences
5. BODY PARAGRAPHS (本文) - 3-5 paragraphs with supporting details
6. QUOTE(S) (引用) - At least one spokesperson quote
7. BOILERPLATE (会社概要) - Standard company description
8. CONTACT INFORMATION (お問い合わせ先)
9. IMPORTANT SAFETY INFORMATION (重要な安全性情報) - if pharmaceutical`,

  blog_post: `Generate a blog post following this structure:

1. TITLE (タイトル) - Engaging and searchable, 30-60 characters
2. INTRODUCTION (導入部) - Hook the reader, state value proposition
3. MAIN CONTENT (本文) - 3-5 sections with subheadings
4. CONCLUSION (まとめ) - Summarize key takeaways
5. CALL TO ACTION (CTA) - Clear next step for readers`,

  social_media: `Generate social media content optimized for the platform:

TWITTER/X: Maximum 140 characters for Japanese, include 2-3 hashtags
LINKEDIN: Professional tone, 150-300 characters
FACEBOOK: 100-250 characters, encourage engagement
INSTAGRAM: Caption 150-300 characters, 5-10 hashtags`,

  internal_memo: `Generate an internal memo following this structure:

HEADER:
- TO: [Recipients]
- FROM: [Sender/Department]
- DATE: [Date]
- RE: [Subject]

BODY:
1. PURPOSE (目的) - State the reason immediately
2. BACKGROUND (背景) - Brief context if needed
3. KEY INFORMATION (主要内容) - Use bullet points
4. ACTION REQUIRED (必要なアクション) - Who does what by when
5. CONTACT (お問い合わせ) - Who to contact for questions`,

  faq: `Generate FAQ content:

- 5-10 question-answer pairs
- Questions from user's perspective
- Direct answer in first sentence
- 50-150 characters per answer in Japanese
- Cover common concerns and objections`,

  executive_statement: `Generate an executive statement following this structure:

1. OPENING (冒頭) - Acknowledge the occasion/situation
2. CORE MESSAGE (主要メッセージ) - Clear statement of position
3. CONTEXT/RATIONALE (背景・理由) - Why this matters
4. COMMITMENT/NEXT STEPS (コミットメント) - What the company will do
5. CLOSING (締めくくり) - Forward-looking statement`,
};

const TONE_PROMPTS: Record<ToneType, string> = {
  formal: `TONE: Formal (フォーマル)
- Highest formality level
- Full honorific language (敬語)
- Conservative word choices
- Longer, more complex sentences`,

  professional: `TONE: Professional (プロフェッショナル)
- Business-appropriate formality
- Standard polite language (丁寧語)
- Clear, precise vocabulary
- Balanced sentence structure`,

  friendly: `TONE: Friendly (フレンドリー)
- Warm but professional
- Simpler sentence structures
- More accessible vocabulary
- Engaging, conversational`,

  urgent: `TONE: Urgent (緊急)
- Direct and immediate
- Short, impactful sentences
- Action-oriented language
- Clear calls to action`,

  custom: '', // Will be replaced with custom_tone
};

const PHARMACEUTICAL_COMPLIANCE_PROMPT = `
PHARMACEUTICAL COMPLIANCE REQUIREMENTS:
Based on 薬機法 (Pharmaceutical and Medical Devices Act) and PMDA Guidelines:

1. All claims must be within approved indications
2. No unsubstantiated efficacy claims
3. Include Important Safety Information (ISI)
4. Balance benefits with risks (fair balance)
5. No superiority claims without head-to-head data
6. Include contraindications and warnings

PROHIBITED:
- "最も効果的" (most effective) without proof
- "完全に治る" (completely cures)
- "副作用がない" (no side effects)
- "100%安全" (100% safe)
- Off-label promotion`;

const OUTPUT_FORMAT_PROMPT = `
OUTPUT FORMAT:
Respond with a valid JSON object only, no markdown code blocks:
{
  "structured": {
    // Content structure based on content type
  },
  "plain_text": "Full content as plain text",
  "word_count": 000,
  "compliance_notes": ["Any compliance considerations"]
}`;

// ===== Helper Functions =====

function buildPrompt(
  request: GenerateContentRequest,
  clientName: string,
  industrySlug: string | null
): string {
  const language = request.settings?.language || 'ja';
  const tone = request.settings?.tone || 'professional';

  let prompt = BASE_SYSTEM_PROMPT + '\n\n';

  // Add language instruction
  prompt += `OUTPUT LANGUAGE: ${language === 'ja' ? 'Japanese (日本語)' : 'English'}\n\n`;

  // Add content type template
  prompt += CONTENT_TYPE_PROMPTS[request.content_type] + '\n\n';

  // Add tone
  if (tone === 'custom' && request.settings?.custom_tone) {
    prompt += `TONE: Custom\n${request.settings.custom_tone}\n\n`;
  } else {
    prompt += TONE_PROMPTS[tone] + '\n\n';
  }

  // Add pharmaceutical compliance if applicable
  if (industrySlug === 'pharmaceutical') {
    prompt += PHARMACEUTICAL_COMPLIANCE_PROMPT + '\n\n';
  }

  // Add client style profile
  if (request.client_style_profile) {
    prompt += 'CLIENT STYLE PROFILE:\n';
    if (request.client_style_profile.tone) {
      prompt += `- Preferred Tone: ${request.client_style_profile.tone}\n`;
    }
    if (request.client_style_profile.formality) {
      prompt += `- Formality Level: ${request.client_style_profile.formality}\n`;
    }
    if (request.client_style_profile.key_messages?.length) {
      prompt += `- Key Messages: ${request.client_style_profile.key_messages.join(', ')}\n`;
    }
    if (request.client_style_profile.avoid_phrases?.length) {
      prompt += `- Avoid: ${request.client_style_profile.avoid_phrases.join(', ')}\n`;
    }
    prompt += '\n';
  }

  // Add settings
  if (request.settings?.target_length) {
    prompt += `TARGET LENGTH: approximately ${request.settings.target_length} characters\n`;
  }
  if (request.settings?.include_isi) {
    prompt += 'INCLUDE: Important Safety Information (ISI) section\n';
  }
  if (request.settings?.include_boilerplate) {
    prompt += 'INCLUDE: Company boilerplate\n';
    if (request.client_style_profile?.boilerplate) {
      prompt += `BOILERPLATE TO USE: ${request.client_style_profile.boilerplate}\n`;
    }
  }

  // Add brief
  prompt += `\nCLIENT: ${clientName}\n`;
  prompt += `\nBRIEF:\n${request.brief}\n\n`;

  // Add output format
  prompt += OUTPUT_FORMAT_PROMPT;

  return prompt;
}

function parseClaudeResponse(response: string): {
  structured: StructuredContent;
  plain_text: string;
  word_count: number;
  compliance_notes: string[];
} {
  // Try to extract JSON from the response
  let jsonStr = response;

  // Remove markdown code blocks if present
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
    return {
      structured: parsed.structured || {},
      plain_text: parsed.plain_text || '',
      word_count: parsed.word_count || 0,
      compliance_notes: parsed.compliance_notes || [],
    };
  } catch {
    // If JSON parsing fails, treat entire response as plain text
    return {
      structured: { plain_text: response },
      plain_text: response,
      word_count: response.length,
      compliance_notes: [],
    };
  }
}

function calculateBasicComplianceScore(
  content: string,
  industrySlug: string | null,
  includeIsi: boolean
): { score: number; details: ComplianceDetails } {
  const categories: ComplianceDetails['categories'] = {
    regulatory_claims: { score: 100, issues: [] },
    safety_info: { score: 100, issues: [] },
    fair_balance: { score: 100, issues: [] },
    substantiation: { score: 100, issues: [] },
    formatting: { score: 100, issues: [] },
  };

  // Basic checks for pharmaceutical content
  if (industrySlug === 'pharmaceutical') {
    // Check for prohibited phrases
    const prohibitedPhrases = [
      { phrase: '最も効果的', message: '「最も効果的」は根拠なしに使用できません' },
      { phrase: '完全に治る', message: '「完全に治る」は禁止されています' },
      { phrase: '副作用がない', message: '「副作用がない」は使用できません' },
      { phrase: '100%安全', message: '「100%安全」は使用できません' },
      { phrase: '絶対に効く', message: '「絶対に効く」は禁止されています' },
    ];

    for (const { phrase, message } of prohibitedPhrases) {
      const index = content.indexOf(phrase);
      if (index !== -1) {
        categories.regulatory_claims.issues.push({
          severity: 'error',
          message,
          position: { start: index, end: index + phrase.length },
          rule_reference: '薬機法第66条',
        });
        categories.regulatory_claims.score -= 20;
      }
    }

    // Check for ISI if required
    if (includeIsi) {
      const hasIsi =
        content.includes('安全性情報') ||
        content.includes('重要な安全性') ||
        content.includes('禁忌') ||
        content.includes('警告');

      if (!hasIsi) {
        categories.safety_info.issues.push({
          severity: 'warning',
          message: '重要な安全性情報(ISI)が見つかりません',
          suggestion: '適応症、禁忌、警告を含むISIセクションを追加してください',
        });
        categories.safety_info.score -= 30;
      }
    }
  }

  // Calculate weighted overall score
  const weights = {
    regulatory_claims: 0.3,
    safety_info: 0.25,
    fair_balance: 0.2,
    substantiation: 0.15,
    formatting: 0.1,
  };

  let overallScore = 0;
  for (const [category, weight] of Object.entries(weights)) {
    const categoryScore = Math.max(0, categories[category]?.score || 100);
    overallScore += categoryScore * weight;
  }

  return {
    score: Math.round(overallScore),
    details: { categories },
  };
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

    // 3. Create Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

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
    const body: GenerateContentRequest = await req.json();

    if (!body.project_id) {
      throw { code: 'VALIDATION_ERROR', message: 'project_id is required' };
    }
    if (!body.content_type) {
      throw { code: 'VALIDATION_ERROR', message: 'content_type is required' };
    }
    if (!body.brief) {
      throw { code: 'VALIDATION_ERROR', message: 'brief is required' };
    }

    // 6. Fetch project and client data
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select(
        `
        *,
        client:clients(
          id, name, style_profile,
          industries:client_industries(
            industry:industries(id, slug, name_ja)
          )
        )
      `
      )
      .eq('id', body.project_id)
      .single();

    if (projectError || !project) {
      throw { code: 'NOT_FOUND', message: 'Project not found' };
    }

    const clientName = project.client?.name || 'Client';
    const industrySlug = project.client?.industries?.[0]?.industry?.slug || null;
    const clientStyleProfile = project.client?.style_profile || body.client_style_profile;

    // 7. Build the prompt
    const prompt = buildPrompt(
      { ...body, client_style_profile: clientStyleProfile },
      clientName,
      industrySlug
    );

    // 8. Call Claude API
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw { code: 'CONFIG_ERROR', message: 'ANTHROPIC_API_KEY not configured' };
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw { code: 'AI_ERROR', message: 'Failed to generate content' };
    }

    const claudeData = await claudeResponse.json();
    const generatedText = claudeData.content?.[0]?.text || '';

    // 9. Parse the response
    const parsed = parseClaudeResponse(generatedText);

    // 10. Calculate compliance score
    const { score, details } = calculateBasicComplianceScore(
      parsed.plain_text,
      industrySlug,
      body.settings?.include_isi || false
    );

    // 11. Build response
    const response: GenerateContentResponse = {
      success: true,
      content: parsed.structured,
      compliance_score: score,
      compliance_details: details,
      word_count: parsed.word_count || parsed.plain_text.length,
      generation_params: {
        tone: body.settings?.tone || 'professional',
        model: 'claude-sonnet-4-5-20250929',
        temperature: 0.7,
      },
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
    else if (err.code === 'NOT_FOUND') status = 404;
    else if (err.code === 'VALIDATION_ERROR') status = 400;
    else if (err.code === 'METHOD_NOT_ALLOWED') status = 405;
    else if (err.code === 'AI_ERROR') status = 502;

    const response: GenerateContentResponse = {
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
