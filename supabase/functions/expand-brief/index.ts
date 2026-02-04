/**
 * ClearPress AI - Expand Brief Edge Function
 *
 * AI-powered expansion of project briefs into comprehensive plans.
 * Generates target audience, key messages, deliverables, and timeline suggestions.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ===== Types =====

interface ExpandBriefRequest {
  project_id: string;
  brief: string;
  client_id: string;
  language?: 'ja' | 'en';
}

interface ExpandedBrief {
  summary: string;
  objectives: string[];
  target_audience: {
    primary: string[];
    secondary: string[];
    personas?: {
      name: string;
      characteristics: string;
      needs: string;
    }[];
  };
  key_messages: {
    message: string;
    priority: number;
    proof_points: string[];
  }[];
  suggested_tone: {
    tone: string;
    rationale: string;
  };
  deliverables: {
    type: string;
    purpose: string;
    key_points: string[];
    unique_angle?: string;
  }[];
  timeline_suggestions: {
    phase: string;
    duration: string;
    activities: string[];
  }[];
  compliance_considerations: string[];
  questions_for_client: string[];
  references_needed: string[];
}

interface ExpandBriefResponse {
  success: boolean;
  expanded_brief?: ExpandedBrief;
  error?: {
    code: string;
    message: string;
  };
}

// ===== Prompt Template =====

const EXPAND_BRIEF_PROMPT = `You are a PR strategist helping expand an initial project brief into a comprehensive plan.

INITIAL BRIEF:
{{BRIEF}}

CLIENT INFORMATION:
- Name: {{CLIENT_NAME}}
- Industry: {{INDUSTRY}}

LANGUAGE: {{LANGUAGE}}

Expand the brief by analyzing and developing:

1. BRIEF ANALYSIS (ブリーフ分析)
   - Identify key objectives
   - Distill core message
   - Note gaps or ambiguities

2. TARGET AUDIENCE (ターゲットオーディエンス)
   - Primary audience
   - Secondary audiences
   - Audience characteristics and needs

3. KEY MESSAGES (キーメッセージ)
   - 3-5 main messages to convey
   - Priority order
   - Supporting proof points

4. TONE RECOMMENDATION (トーン推奨)
   - Suggested tone based on audience and purpose
   - Justification

5. DELIVERABLES PLAN (成果物計画)
   - For each content type:
     - Specific purpose
     - Key points to include
     - Unique angle or focus

6. TIMELINE SUGGESTIONS (タイムライン提案)
   - Recommended phases
   - Key milestones
   - Dependencies

7. COMPLIANCE CONSIDERATIONS (コンプライアンス考慮事項)
   - Industry-specific requirements
   - Potential compliance risks
   - Required reviews

8. QUESTIONS FOR CLIENT (クライアントへの質問)
   - Information gaps to fill
   - Decisions needed
   - Clarifications required

9. REFERENCE MATERIALS NEEDED (必要な参考資料)
   - Data or research needed
   - Existing materials to gather
   - Approvals required

OUTPUT FORMAT (JSON only, no markdown code blocks):
{
  "summary": "Brief summary of the expanded plan",
  "objectives": ["objective1", "objective2"],
  "target_audience": {
    "primary": ["primary audience 1", "primary audience 2"],
    "secondary": ["secondary audience 1"],
    "personas": [
      {
        "name": "Persona name",
        "characteristics": "Key characteristics",
        "needs": "What they need"
      }
    ]
  },
  "key_messages": [
    {
      "message": "Main message",
      "priority": 1,
      "proof_points": ["proof point 1", "proof point 2"]
    }
  ],
  "suggested_tone": {
    "tone": "professional",
    "rationale": "Why this tone is appropriate"
  },
  "deliverables": [
    {
      "type": "press_release",
      "purpose": "Specific purpose",
      "key_points": ["point 1", "point 2"],
      "unique_angle": "What makes this unique"
    }
  ],
  "timeline_suggestions": [
    {
      "phase": "Phase 1: Research & Planning",
      "duration": "1-2 days",
      "activities": ["activity 1", "activity 2"]
    }
  ],
  "compliance_considerations": ["consideration 1", "consideration 2"],
  "questions_for_client": ["question 1", "question 2"],
  "references_needed": ["reference 1", "reference 2"]
}`;

const PHARMACEUTICAL_CONTEXT = `
PHARMACEUTICAL INDUSTRY CONTEXT:
- All communications must comply with 薬機法 (Pharmaceutical and Medical Devices Act)
- PMDA approval status must be clearly stated
- Fair balance between efficacy and safety is required
- Important Safety Information (ISI) must be included where applicable
- Off-label promotion is strictly prohibited
`;

// ===== Helper Functions =====

function buildExpandPrompt(
  brief: string,
  clientName: string,
  industrySlug: string | null,
  language: 'ja' | 'en'
): string {
  let prompt = EXPAND_BRIEF_PROMPT
    .replace('{{BRIEF}}', brief)
    .replace('{{CLIENT_NAME}}', clientName)
    .replace('{{INDUSTRY}}', industrySlug || 'General')
    .replace('{{LANGUAGE}}', language === 'ja' ? 'Japanese (日本語)' : 'English');

  if (industrySlug === 'pharmaceutical') {
    prompt += '\n' + PHARMACEUTICAL_CONTEXT;
  }

  return prompt;
}

function parseExpandResponse(response: string): ExpandedBrief {
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

    // Ensure required fields exist with defaults
    return {
      summary: parsed.summary || '',
      objectives: parsed.objectives || [],
      target_audience: {
        primary: parsed.target_audience?.primary || [],
        secondary: parsed.target_audience?.secondary || [],
        personas: parsed.target_audience?.personas || [],
      },
      key_messages: (parsed.key_messages || []).map(
        (msg: { message?: string; priority?: number; proof_points?: string[] }, index: number) => ({
          message: msg.message || '',
          priority: msg.priority || index + 1,
          proof_points: msg.proof_points || [],
        })
      ),
      suggested_tone: {
        tone: parsed.suggested_tone?.tone || 'professional',
        rationale: parsed.suggested_tone?.rationale || '',
      },
      deliverables: (parsed.deliverables || []).map(
        (d: { type?: string; purpose?: string; key_points?: string[]; unique_angle?: string }) => ({
          type: d.type || 'press_release',
          purpose: d.purpose || '',
          key_points: d.key_points || [],
          unique_angle: d.unique_angle,
        })
      ),
      timeline_suggestions: (parsed.timeline_suggestions || []).map(
        (t: { phase?: string; duration?: string; activities?: string[] }) => ({
          phase: t.phase || '',
          duration: t.duration || '',
          activities: t.activities || [],
        })
      ),
      compliance_considerations: parsed.compliance_considerations || [],
      questions_for_client: parsed.questions_for_client || [],
      references_needed: parsed.references_needed || [],
    };
  } catch {
    // Return minimal valid structure if parsing fails
    return {
      summary: 'ブリーフの展開中にエラーが発生しました。',
      objectives: [],
      target_audience: {
        primary: [],
        secondary: [],
      },
      key_messages: [],
      suggested_tone: {
        tone: 'professional',
        rationale: '',
      },
      deliverables: [],
      timeline_suggestions: [],
      compliance_considerations: [],
      questions_for_client: [],
      references_needed: [],
    };
  }
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
    const body: ExpandBriefRequest = await req.json();

    if (!body.project_id) {
      throw { code: 'VALIDATION_ERROR', message: 'project_id is required' };
    }
    if (!body.brief) {
      throw { code: 'VALIDATION_ERROR', message: 'brief is required' };
    }
    if (!body.client_id) {
      throw { code: 'VALIDATION_ERROR', message: 'client_id is required' };
    }

    const language = body.language || 'ja';

    // 6. Fetch client data for context
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select(
        `
        id, name, style_profile,
        industries:client_industries(
          industry:industries(id, slug, name_ja)
        )
      `
      )
      .eq('id', body.client_id)
      .single();

    if (clientError || !client) {
      throw { code: 'NOT_FOUND', message: 'Client not found' };
    }

    const clientName = client.name || 'Client';
    const industrySlug = client.industries?.[0]?.industry?.slug || null;

    // 7. Build the prompt
    const prompt = buildExpandPrompt(body.brief, clientName, industrySlug, language);

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
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw { code: 'AI_ERROR', message: 'Failed to expand brief' };
    }

    const claudeData = await claudeResponse.json();
    const expandedText = claudeData.content?.[0]?.text || '';

    // 9. Parse the response
    const expandedBrief = parseExpandResponse(expandedText);

    // 10. Optionally save to project
    await supabaseAdmin
      .from('projects')
      .update({
        expanded_brief: expandedBrief,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.project_id);

    // 11. Build response
    const response: ExpandBriefResponse = {
      success: true,
      expanded_brief: expandedBrief,
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

    const response: ExpandBriefResponse = {
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
