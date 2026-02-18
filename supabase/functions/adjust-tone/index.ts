/**
 * ClearPress AI - Adjust Tone Edge Function
 *
 * AI-powered tone adjustment for existing content.
 * Modifies the writing style while preserving factual accuracy and compliance.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ===== Types =====

type ToneType = 'formal' | 'professional' | 'friendly' | 'urgent' | 'custom';

interface AdjustToneRequest {
  content: string;
  current_tone: ToneType;
  target_tone: ToneType;
  custom_tone?: string;
  intensity: number; // 1-5: 1=subtle adjustment, 5=complete rewrite
  language?: 'ja' | 'en';
  preserve_compliance?: boolean;
}

interface AdjustToneResponse {
  success: boolean;
  adjusted_content?: string;
  word_count?: number;
  changes_summary?: string;
  error?: {
    code: string;
    message: string;
  };
}

// ===== Prompt Templates =====

const TONE_DESCRIPTIONS: Record<ToneType, { ja: string; en: string }> = {
  formal: {
    ja: 'フォーマル: 最高レベルの丁寧さ、敬語を使用、保守的な言葉選び、より複雑な文章構造',
    en: 'Formal: Highest level of politeness, honorific language, conservative word choices, longer complex sentences',
  },
  professional: {
    ja: 'プロフェッショナル: ビジネスにふさわしい丁寧さ、丁寧語を使用、明確で正確な語彙、バランスの取れた文章構造',
    en: 'Professional: Business-appropriate politeness, polite language, clear precise vocabulary, balanced sentence structure',
  },
  friendly: {
    ja: 'フレンドリー: 親しみやすくもプロフェッショナル、シンプルな文章構造、親しみやすい語彙、会話的なトーン',
    en: 'Friendly: Warm but professional, simpler sentence structures, accessible vocabulary, conversational tone',
  },
  urgent: {
    ja: '緊急: 直接的で即座の印象、短くインパクトのある文章、行動志向の言葉、明確なアクション要請',
    en: 'Urgent: Direct and immediate, short impactful sentences, action-oriented language, clear calls to action',
  },
  custom: {
    ja: 'カスタム',
    en: 'Custom',
  },
};

const INTENSITY_DESCRIPTIONS: Record<number, { ja: string; en: string }> = {
  1: {
    ja: '微調整: 非常に細かい変更のみ。トーンをわずかに調整し、ほとんどの原文をそのまま維持',
    en: 'Subtle: Very minor changes only. Slightly adjust tone while keeping most of the original text intact',
  },
  2: {
    ja: '軽度: 軽い変更。トーンの一部を変更し、文章構造は維持',
    en: 'Light: Light modifications. Change some tonal elements while maintaining sentence structure',
  },
  3: {
    ja: '中程度: 適度な変更。トーンを明確に変更し、必要に応じて文章を再構成',
    en: 'Moderate: Moderate changes. Clearly change tone and restructure sentences as needed',
  },
  4: {
    ja: '強め: 大幅な変更。トーンを積極的に変更し、多くの文章を書き換え',
    en: 'Strong: Significant changes. Actively transform tone and rewrite many sentences',
  },
  5: {
    ja: '完全書き換え: コンテンツを新しいトーンで完全に書き換え、事実と重要な情報は保持',
    en: 'Complete rewrite: Completely rewrite content in the new tone while preserving facts and key information',
  },
};

function buildPrompt(request: AdjustToneRequest): string {
  const lang = request.language || 'ja';
  const currentToneDesc = TONE_DESCRIPTIONS[request.current_tone][lang];
  const targetToneDesc = request.target_tone === 'custom' && request.custom_tone
    ? request.custom_tone
    : TONE_DESCRIPTIONS[request.target_tone][lang];
  const intensityDesc = INTENSITY_DESCRIPTIONS[Math.min(5, Math.max(1, request.intensity))][lang];

  const systemPrompt = lang === 'ja'
    ? `あなたはClearPress AIの専門的なコンテンツエディターです。PRコンテンツのトーンを調整する専門家です。

重要な原則:
- 事実の正確性を維持する
- 規制コンプライアンスを維持する（特に製薬関連の場合）
- 同じ意味と情報を伝える
- 指定された強度レベルに従って変更を加える
- 説明や注釈は含めず、調整されたコンテンツのみを返す`
    : `You are ClearPress AI's expert content editor, specializing in adjusting the tone of PR content.

Key Principles:
- Maintain factual accuracy
- Preserve regulatory compliance (especially for pharmaceutical content)
- Convey the same meaning and information
- Make changes according to the specified intensity level
- Return only the adjusted content without explanations or notes`;

  const userPrompt = lang === 'ja'
    ? `以下のコンテンツのトーンを調整してください。

現在のトーン: ${currentToneDesc}

目標のトーン: ${targetToneDesc}

変更強度: ${request.intensity}/5
${intensityDesc}

${request.preserve_compliance ? '注意: 製薬規制のコンプライアンスを厳密に維持してください。安全性情報、禁忌、警告は変更しないでください。' : ''}

---コンテンツ開始---
${request.content}
---コンテンツ終了---

調整されたコンテンツのみを返してください。説明や注釈は含めないでください。`
    : `Please adjust the tone of the following content.

Current Tone: ${currentToneDesc}

Target Tone: ${targetToneDesc}

Change Intensity: ${request.intensity}/5
${intensityDesc}

${request.preserve_compliance ? 'IMPORTANT: Strictly maintain pharmaceutical regulatory compliance. Do not modify safety information, contraindications, or warnings.' : ''}

---CONTENT START---
${request.content}
---CONTENT END---

Return only the adjusted content. Do not include any explanations or notes.`;

  return JSON.stringify({
    system: systemPrompt,
    user: userPrompt,
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
    const body: AdjustToneRequest = await req.json();

    if (!body.content) {
      throw { code: 'VALIDATION_ERROR', message: 'content is required' };
    }
    if (!body.current_tone) {
      throw { code: 'VALIDATION_ERROR', message: 'current_tone is required' };
    }
    if (!body.target_tone) {
      throw { code: 'VALIDATION_ERROR', message: 'target_tone is required' };
    }
    if (body.intensity === undefined || body.intensity < 1 || body.intensity > 5) {
      throw { code: 'VALIDATION_ERROR', message: 'intensity must be between 1 and 5' };
    }
    if (body.target_tone === 'custom' && !body.custom_tone) {
      throw { code: 'VALIDATION_ERROR', message: 'custom_tone is required when target_tone is custom' };
    }

    // 6. Build the prompt
    const promptData = JSON.parse(buildPrompt(body));

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
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: promptData.system,
        messages: [{ role: 'user', content: promptData.user }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw { code: 'AI_ERROR', message: 'Failed to adjust tone' };
    }

    const claudeData = await claudeResponse.json();
    const adjustedContent = claudeData.content?.[0]?.text || '';

    // 8. Build response
    const response: AdjustToneResponse = {
      success: true,
      adjusted_content: adjustedContent.trim(),
      word_count: adjustedContent.length,
      changes_summary: body.language === 'en'
        ? `Adjusted from ${body.current_tone} to ${body.target_tone} (intensity: ${body.intensity}/5)`
        : `${body.current_tone}から${body.target_tone}へトーンを調整しました（強度: ${body.intensity}/5）`,
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
    else if (err.code === 'AI_ERROR') status = 502;
    else if (err.code === 'CONFIG_ERROR') status = 503;

    const response: AdjustToneResponse = {
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
