/**
 * ClearPress AI - Enhance Title Edge Function
 *
 * AI-powered title enhancement that generates 3 improved title suggestions.
 * Uses Claude API to create compelling, newsworthy titles.
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

interface EnhanceTitleRequest {
  title: string;
  content_type: ContentType;
  context?: string;
  language?: 'ja' | 'en';
}

interface EnhanceTitleResponse {
  success: boolean;
  suggestions?: string[];
  error?: {
    code: string;
    message: string;
  };
}

// ===== Prompt Templates =====

const CONTENT_TYPE_GUIDELINES: Record<ContentType, { ja: string; en: string }> = {
  press_release: {
    ja: `プレスリリース用タイトル:
- ニュース価値を明確に
- 20〜40文字程度
- 具体的な数字や成果を含む
- 「〜を発表」「〜を開始」などの動詞を含む`,
    en: `Press Release Title:
- Clear news value
- 60-100 characters
- Include specific numbers or achievements
- Include action verbs like "launches", "announces"`,
  },
  blog_post: {
    ja: `ブログ記事用タイトル:
- 読者の興味を引く
- SEOを意識したキーワードを含む
- 30〜60文字程度
- 問いかけや数字を活用`,
    en: `Blog Post Title:
- Engage the reader
- Include SEO-friendly keywords
- 50-80 characters
- Use questions or numbers`,
  },
  social_media: {
    ja: `ソーシャルメディア用タイトル:
- インパクト重視
- 短く簡潔に（20〜30文字）
- 絵文字は使用しない
- アクションを促す`,
    en: `Social Media Title:
- High impact
- Short and concise (40-60 characters)
- No emojis
- Drive action`,
  },
  internal_memo: {
    ja: `社内文書用タイトル:
- 明確で直接的
- 目的がすぐわかる
- フォーマルな表現
- 20〜40文字程度`,
    en: `Internal Memo Title:
- Clear and direct
- Purpose immediately obvious
- Formal tone
- 40-80 characters`,
  },
  faq: {
    ja: `FAQ用タイトル:
- 質問形式も可
- ユーザー視点
- 簡潔で明確
- 検索しやすい`,
    en: `FAQ Title:
- Can be question format
- User perspective
- Concise and clear
- Searchable`,
  },
  executive_statement: {
    ja: `経営者声明用タイトル:
- 権威と信頼感
- フォーマルな表現
- 重要性を伝える
- 30〜50文字程度`,
    en: `Executive Statement Title:
- Authority and trust
- Formal tone
- Convey importance
- 50-100 characters`,
  },
};

function buildPrompt(request: EnhanceTitleRequest): { system: string; user: string } {
  const lang = request.language || 'ja';
  const guidelines = CONTENT_TYPE_GUIDELINES[request.content_type][lang];

  const systemPrompt = lang === 'ja'
    ? `あなたはClearPress AIのタイトル作成エキスパートです。PR・マーケティングコンテンツの効果的なタイトルを作成する専門家です。

重要な原則:
- 日本語の自然な表現を使用
- ビジネスに適した丁寧な表現
- 読者の注目を集める
- 事実に基づいた表現のみ使用`
    : `You are ClearPress AI's title creation expert. You specialize in creating effective titles for PR and marketing content.

Key Principles:
- Use natural language
- Business-appropriate tone
- Capture reader attention
- Only use factual expressions`;

  const userPrompt = lang === 'ja'
    ? `以下のタイトルを改善し、3つの異なるバリエーションを提案してください。

元のタイトル: ${request.title}

コンテンツタイプ: ${request.content_type}
${guidelines}

${request.context ? `追加コンテキスト: ${request.context}` : ''}

以下のJSON形式のみで応答してください（説明は不要）:
{
  "suggestions": [
    "タイトル案1",
    "タイトル案2",
    "タイトル案3"
  ]
}`
    : `Please improve the following title and suggest 3 different variations.

Original Title: ${request.title}

Content Type: ${request.content_type}
${guidelines}

${request.context ? `Additional Context: ${request.context}` : ''}

Respond only with the following JSON format (no explanation):
{
  "suggestions": [
    "Title suggestion 1",
    "Title suggestion 2",
    "Title suggestion 3"
  ]
}`;

  return { system: systemPrompt, user: userPrompt };
}

function parseResponse(response: string): string[] {
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
    if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
      return parsed.suggestions.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0);
    }
  } catch {
    console.error('Failed to parse response as JSON:', response);
  }

  return [];
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

    // 3. Create Supabase client for user auth verification
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
    const body: EnhanceTitleRequest = await req.json();

    if (!body.title) {
      throw { code: 'VALIDATION_ERROR', message: 'title is required' };
    }
    if (!body.content_type) {
      throw { code: 'VALIDATION_ERROR', message: 'content_type is required' };
    }

    // 6. Build the prompt
    const { system, user } = buildPrompt(body);

    // 7. Call Claude API
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
        model: 'claude-3-5-haiku-20241022', // Use Haiku for faster, cheaper title generation
        max_tokens: 512,
        system: system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw { code: 'AI_ERROR', message: 'Failed to enhance title' };
    }

    const claudeData = await claudeResponse.json();
    const generatedText = claudeData.content?.[0]?.text || '';

    // 8. Parse the response
    const suggestions = parseResponse(generatedText);

    if (suggestions.length === 0) {
      // Fallback: return original title
      const response: EnhanceTitleResponse = {
        success: true,
        suggestions: [body.title],
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 9. Build response
    const response: EnhanceTitleResponse = {
      success: true,
      suggestions: suggestions.slice(0, 3), // Ensure max 3 suggestions
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const err = error as { code?: string; message?: string };

    let status = 500;
    if (err.code === 'UNAUTHORIZED') status = 401;
    else if (err.code === 'VALIDATION_ERROR') status = 400;
    else if (err.code === 'METHOD_NOT_ALLOWED') status = 405;
    else if (err.code === 'AI_ERROR') status = 502;
    else if (err.code === 'CONFIG_ERROR') status = 503;

    const response: EnhanceTitleResponse = {
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
