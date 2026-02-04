/**
 * ClearPress AI - Generate Content Variants Edge Function
 *
 * AI-powered content generation that produces 3 variants in parallel.
 * Uses Claude API to generate structured content based on comprehensive briefs.
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

interface ContentGenerationBrief {
  project_id: string;
  content_type: ContentType;
  title: string;
  summary: string;
  key_messages: string[];
  call_to_action?: string;
  target_audience: string;
  tone: ToneType;
  custom_tone?: string;
  keywords: string[];
  target_length: number;
  product_name?: string;
  therapeutic_area?: string;
  include_isi: boolean;
  include_boilerplate: boolean;
  regulatory_notes?: string;
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
  html?: string;
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

interface ContentVariant {
  id: string;
  content: StructuredContent;
  compliance_score: number;
  word_count: number;
  generation_params: {
    tone: ToneType;
    model: string;
    temperature: number;
  };
}

interface GenerateVariantsResponse {
  success: boolean;
  variants?: ContentVariant[];
  error?: {
    code: string;
    message: string;
  };
}

// ===== Prompt Templates =====

const BASE_SYSTEM_PROMPT = `You are ClearPress AI, an expert PR content assistant specialized in creating professional communications for Japanese markets. You have deep expertise in:

1. Japanese business communication (ビジネス日本語)
2. Industry-specific regulatory compliance (薬機法, PMDA guidelines)
3. Cultural nuance and appropriate formality levels
4. PR best practices and media relations

Core Principles:
- Accuracy: Never fabricate facts, quotes, or data
- Compliance: Always adhere to industry regulations
- Cultural Appropriateness: Respect Japanese business customs
- Transparency: Clearly indicate when information needs verification

You are assisting PR professionals, not replacing their judgment.`;

const CONTENT_TYPE_PROMPTS: Record<ContentType, string> = {
  press_release: `Generate a press release following this structure:

1. HEADLINE (見出し) - Clear, newsworthy headline
2. SUBHEADLINE (サブ見出し) - Supporting detail
3. DATELINE (日付・発信地) - Format: [都市名]、[YYYY年MM月DD日]
4. LEAD PARAGRAPH (リード文) - Who, What, When, Where, Why in 2-3 sentences
5. BODY PARAGRAPHS (本文) - 3-5 paragraphs with supporting details
6. QUOTE(S) (引用) - At least one spokesperson quote
7. BOILERPLATE (会社概要) - Standard company description
8. CONTACT INFORMATION (お問い合わせ先)
9. IMPORTANT SAFETY INFORMATION (重要な安全性情報) - if pharmaceutical`,

  blog_post: `Generate a blog post following this structure:

1. TITLE (タイトル) - Engaging and searchable
2. INTRODUCTION (導入部) - Hook the reader, state value proposition
3. MAIN CONTENT (本文) - 3-5 sections with subheadings
4. CONCLUSION (まとめ) - Summarize key takeaways
5. CALL TO ACTION (CTA) - Clear next step for readers`,

  social_media: `Generate social media content optimized for the platform:

TWITTER/X: Maximum 140 characters for Japanese, include 2-3 hashtags
LINKEDIN: Professional tone, 150-300 characters
FACEBOOK: 100-250 characters, encourage engagement`,

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
4. ACTION REQUIRED (必要なアクション) - Who does what by when`,

  faq: `Generate FAQ content:

- 5-10 question-answer pairs
- Questions from user's perspective
- Direct answer in first sentence
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
- Conservative word choices`,

  professional: `TONE: Professional (プロフェッショナル)
- Business-appropriate formality
- Standard polite language (丁寧語)
- Clear, precise vocabulary`,

  friendly: `TONE: Friendly (フレンドリー)
- Warm but professional
- Simpler sentence structures
- More accessible vocabulary`,

  urgent: `TONE: Urgent (緊急)
- Direct and immediate
- Short, impactful sentences
- Action-oriented language`,

  custom: '',
};

const PHARMACEUTICAL_COMPLIANCE_PROMPT = `
PHARMACEUTICAL COMPLIANCE REQUIREMENTS:
Based on 薬機法 (Pharmaceutical and Medical Devices Act) and PMDA Guidelines:

1. All claims must be within approved indications
2. No unsubstantiated efficacy claims
3. Include Important Safety Information (ISI)
4. Balance benefits with risks (fair balance)
5. No superiority claims without head-to-head data

PROHIBITED:
- "最も効果的" (most effective) without proof
- "完全に治る" (completely cures)
- "副作用がない" (no side effects)
- "100%安全" (100% safe)`;

const OUTPUT_FORMAT_PROMPT = `
OUTPUT FORMAT:
Respond with a valid JSON object only, no markdown code blocks:
{
  "structured": {
    // Content structure based on content type
  },
  "plain_text": "Full content as plain text",
  "word_count": 000
}`;

// Variation prompts for generating different variants
const VARIATION_PROMPTS = [
  'Create a version that emphasizes the most compelling news angle and key benefits.',
  'Create a version with a more engaging opening and stronger emotional appeal while maintaining professionalism.',
  'Create a version that leads with data and evidence, using a more analytical approach.',
];

// ===== Helper Functions =====

function buildPrompt(
  brief: ContentGenerationBrief,
  clientName: string,
  industrySlug: string | null,
  boilerplate: string | null,
  variationIndex: number
): string {
  let prompt = BASE_SYSTEM_PROMPT + '\n\n';

  // Add language instruction
  prompt += `OUTPUT LANGUAGE: Japanese (日本語)\n\n`;

  // Add content type template
  prompt += CONTENT_TYPE_PROMPTS[brief.content_type] + '\n\n';

  // Add tone
  if (brief.tone === 'custom' && brief.custom_tone) {
    prompt += `TONE: Custom\n${brief.custom_tone}\n\n`;
  } else {
    prompt += TONE_PROMPTS[brief.tone] + '\n\n';
  }

  // Add pharmaceutical compliance if applicable
  if (industrySlug === 'pharmaceutical') {
    prompt += PHARMACEUTICAL_COMPLIANCE_PROMPT + '\n\n';
  }

  // Add brief details
  prompt += `CLIENT: ${clientName}\n`;
  prompt += `TITLE: ${brief.title}\n`;
  prompt += `TARGET AUDIENCE: ${brief.target_audience}\n\n`;

  prompt += `SUMMARY:\n${brief.summary}\n\n`;

  if (brief.key_messages.length > 0) {
    prompt += `KEY MESSAGES TO INCLUDE:\n`;
    brief.key_messages.forEach((msg, i) => {
      prompt += `${i + 1}. ${msg}\n`;
    });
    prompt += '\n';
  }

  if (brief.call_to_action) {
    prompt += `CALL TO ACTION: ${brief.call_to_action}\n\n`;
  }

  if (brief.keywords.length > 0) {
    prompt += `KEYWORDS TO INCORPORATE: ${brief.keywords.join(', ')}\n\n`;
  }

  // Pharma-specific details
  if (brief.product_name) {
    prompt += `PRODUCT NAME: ${brief.product_name}\n`;
  }
  if (brief.therapeutic_area) {
    prompt += `THERAPEUTIC AREA: ${brief.therapeutic_area}\n`;
  }
  if (brief.regulatory_notes) {
    prompt += `REGULATORY CONSIDERATIONS: ${brief.regulatory_notes}\n`;
  }

  // Settings
  prompt += `\nTARGET LENGTH: approximately ${brief.target_length} characters\n`;

  if (brief.include_isi) {
    prompt += 'INCLUDE: Important Safety Information (ISI) section\n';
  }
  if (brief.include_boilerplate && boilerplate) {
    prompt += 'INCLUDE: Company boilerplate\n';
    prompt += `BOILERPLATE TO USE: ${boilerplate}\n`;
  }

  // Add variation instruction
  prompt += `\nVARIATION INSTRUCTION: ${VARIATION_PROMPTS[variationIndex]}\n\n`;

  // Add output format
  prompt += OUTPUT_FORMAT_PROMPT;

  return prompt;
}

function parseClaudeResponse(response: string): {
  structured: StructuredContent;
  plain_text: string;
  word_count: number;
} {
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
    };
  } catch {
    return {
      structured: { plain_text: response },
      plain_text: response,
      word_count: response.length,
    };
  }
}

function calculateBasicComplianceScore(
  content: string,
  industrySlug: string | null,
  includeIsi: boolean
): number {
  let score = 100;

  if (industrySlug === 'pharmaceutical') {
    // Check for prohibited phrases
    const prohibitedPhrases = [
      '最も効果的',
      '完全に治る',
      '副作用がない',
      '100%安全',
      '絶対に効く',
    ];

    for (const phrase of prohibitedPhrases) {
      if (content.includes(phrase)) {
        score -= 20;
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
        score -= 30;
      }
    }
  }

  return Math.max(0, score);
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
    const brief: ContentGenerationBrief = await req.json();

    if (!brief.project_id) {
      throw { code: 'VALIDATION_ERROR', message: 'project_id is required' };
    }
    if (!brief.content_type) {
      throw { code: 'VALIDATION_ERROR', message: 'content_type is required' };
    }
    if (!brief.title) {
      throw { code: 'VALIDATION_ERROR', message: 'title is required' };
    }
    if (!brief.summary) {
      throw { code: 'VALIDATION_ERROR', message: 'summary is required' };
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
      .eq('id', brief.project_id)
      .single();

    if (projectError || !project) {
      throw { code: 'NOT_FOUND', message: 'Project not found' };
    }

    const clientName = project.client?.name || 'Client';
    const industrySlug = project.client?.industries?.[0]?.industry?.slug || null;
    const boilerplate = project.client?.style_profile?.boilerplate || null;

    // 7. Get Claude API key
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw { code: 'CONFIG_ERROR', message: 'ANTHROPIC_API_KEY not configured' };
    }

    // 8. Generate 3 variants in parallel
    const variantPromises = [0, 1, 2].map(async (variantIndex) => {
      const prompt = buildPrompt(
        brief,
        clientName,
        industrySlug,
        boilerplate,
        variantIndex
      );

      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7 + variantIndex * 0.1, // Slightly vary temperature for diversity
        }),
      });

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.error(`Claude API error for variant ${variantIndex}:`, errorText);
        throw new Error('Failed to generate content');
      }

      const claudeData = await claudeResponse.json();
      const generatedText = claudeData.content?.[0]?.text || '';

      // Parse the response
      const parsed = parseClaudeResponse(generatedText);

      // Calculate compliance score
      const complianceScore = calculateBasicComplianceScore(
        parsed.plain_text,
        industrySlug,
        brief.include_isi
      );

      // Build variant
      const variant: ContentVariant = {
        id: generateUUID(),
        content: parsed.structured,
        compliance_score: complianceScore,
        word_count: parsed.word_count || parsed.plain_text.length,
        generation_params: {
          tone: brief.tone,
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.7 + variantIndex * 0.1,
        },
      };

      return variant;
    });

    // Wait for all variants
    const variants = await Promise.all(variantPromises);

    // 9. Build response
    const response: GenerateVariantsResponse = {
      success: true,
      variants,
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

    const response: GenerateVariantsResponse = {
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
