/**
 * ClearPress AI - Extract Style Edge Function
 *
 * AI-powered extraction of style characteristics from uploaded reference documents.
 * Analyzes uploaded files (PDF, DOCX, TXT) to extract tone, vocabulary patterns,
 * structure preferences, and other style characteristics for the client profile.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ===== Types =====

interface ExtractStyleRequest {
  file_ids: string[];
  client_id: string;
  merge_mode: 'replace' | 'merge';
  language?: 'ja' | 'en';
}

interface ExtractedStyle {
  tone: string;
  formality: 'low' | 'medium' | 'high';
  vocabulary_patterns: string[];
  structure_preferences: string[];
  key_messages: string[];
  avoid_phrases: string[];
  suggested_boilerplate?: string;
  analysis_notes: string[];
}

interface ExtractStyleResponse {
  success: boolean;
  extracted_style?: ExtractedStyle;
  files_processed: number;
  error?: {
    code: string;
    message: string;
  };
}

// ===== Prompt Template =====

const EXTRACT_STYLE_PROMPT = `You are a PR style analyst specializing in corporate communications. Analyze the following reference documents from a client and extract their communication style profile.

LANGUAGE: {{LANGUAGE}}
CLIENT NAME: {{CLIENT_NAME}}

DOCUMENTS TO ANALYZE:
{{DOCUMENTS}}

Your task is to analyze these documents and extract the client's communication style profile. Focus on:

1. TONE (トーン)
   - Overall voice and personality of their communications
   - Examples: "professional but approachable", "formal and authoritative", "warm and empathetic"

2. FORMALITY LEVEL (フォーマリティ)
   - Assess the level of formality: low, medium, or high
   - Consider: sentence structure complexity, vocabulary formality, use of honorifics (敬語)

3. VOCABULARY PATTERNS (語彙パターン)
   - Recurring terminology and brand-specific words
   - Technical language preferences
   - Industry jargon they use or avoid
   - Preferred expressions and phrases

4. STRUCTURE PREFERENCES (構造の傾向)
   - How they organize content (inverted pyramid, narrative, etc.)
   - Paragraph length tendencies
   - Use of bullet points vs. flowing prose
   - Heading/subheading patterns

5. KEY MESSAGES (キーメッセージ)
   - Recurring themes and messages
   - Brand values they consistently emphasize
   - Core selling points they highlight

6. PHRASES TO AVOID (避けるべき表現)
   - Based on what they DON'T use
   - Expressions inconsistent with their brand
   - Overly casual or overly formal language (depending on their style)

7. SUGGESTED BOILERPLATE (定型文候補)
   - If you find any "about us" or company description text, extract it
   - Standardized closing paragraphs

8. ANALYSIS NOTES (分析メモ)
   - Observations about their style
   - Recommendations for maintaining consistency
   - Any notable patterns

OUTPUT FORMAT (JSON only, no markdown code blocks):
{
  "tone": "concise description of overall tone",
  "formality": "low|medium|high",
  "vocabulary_patterns": ["pattern1", "pattern2", "pattern3"],
  "structure_preferences": ["preference1", "preference2"],
  "key_messages": ["message1", "message2"],
  "avoid_phrases": ["phrase1", "phrase2"],
  "suggested_boilerplate": "boilerplate text if found, or null",
  "analysis_notes": ["note1", "note2"]
}`;

// ===== Helper Functions =====

function buildStylePrompt(
  documents: { filename: string; content: string }[],
  clientName: string,
  language: 'ja' | 'en'
): string {
  const documentsText = documents
    .map((doc, index) => `--- Document ${index + 1}: ${doc.filename} ---\n${doc.content}\n`)
    .join('\n');

  return EXTRACT_STYLE_PROMPT
    .replace('{{DOCUMENTS}}', documentsText)
    .replace('{{CLIENT_NAME}}', clientName)
    .replace('{{LANGUAGE}}', language === 'ja' ? 'Japanese (日本語)' : 'English');
}

function parseStyleResponse(response: string): ExtractedStyle {
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

    // Map formality string to enum
    let formality: 'low' | 'medium' | 'high' = 'medium';
    if (parsed.formality) {
      const f = parsed.formality.toLowerCase();
      if (f === 'low' || f === 'high') {
        formality = f;
      }
    }

    return {
      tone: parsed.tone || '',
      formality,
      vocabulary_patterns: parsed.vocabulary_patterns || [],
      structure_preferences: parsed.structure_preferences || [],
      key_messages: parsed.key_messages || [],
      avoid_phrases: parsed.avoid_phrases || [],
      suggested_boilerplate: parsed.suggested_boilerplate || undefined,
      analysis_notes: parsed.analysis_notes || [],
    };
  } catch {
    // Return minimal valid structure if parsing fails
    return {
      tone: '',
      formality: 'medium',
      vocabulary_patterns: [],
      structure_preferences: [],
      key_messages: [],
      avoid_phrases: [],
      analysis_notes: ['スタイル抽出中にエラーが発生しました。ファイルの内容を確認してください。'],
    };
  }
}

async function extractTextFromFile(
  supabaseAdmin: ReturnType<typeof createClient>,
  storagePath: string,
  mimeType: string
): Promise<string> {
  // Download file from storage
  const { data, error } = await supabaseAdmin.storage
    .from('client-files')
    .download(storagePath);

  if (error || !data) {
    console.error('Error downloading file:', error);
    throw new Error('ファイルのダウンロードに失敗しました');
  }

  // Extract text based on file type
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    // Plain text files - just read as text
    return await data.text();
  }

  if (mimeType === 'application/pdf') {
    // For PDFs, we'll use the raw text content that Claude can analyze
    // In production, you'd use a PDF parsing library like pdf-parse
    // For now, we'll return a placeholder and let Claude analyze via vision if needed
    const arrayBuffer = await data.arrayBuffer();
    // Try to extract any readable text from the PDF
    const bytes = new Uint8Array(arrayBuffer);
    let text = '';
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 32 && bytes[i] <= 126) {
        text += String.fromCharCode(bytes[i]);
      }
    }
    // If we extracted some meaningful text (more than 100 chars)
    if (text.length > 100) {
      // Clean up the extracted text
      return text.replace(/\s+/g, ' ').substring(0, 10000);
    }
    return '[PDF content - テキスト抽出が必要です]';
  }

  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // For Word docs, similar approach
    // In production, you'd use mammoth.js or similar
    return '[Word document content - テキスト抽出が必要です]';
  }

  return '[Unsupported file type]';
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
    const body: ExtractStyleRequest = await req.json();

    if (!body.file_ids || body.file_ids.length === 0) {
      throw { code: 'VALIDATION_ERROR', message: 'file_ids is required and must not be empty' };
    }
    if (!body.client_id) {
      throw { code: 'VALIDATION_ERROR', message: 'client_id is required' };
    }
    if (!body.merge_mode) {
      throw { code: 'VALIDATION_ERROR', message: 'merge_mode is required (replace or merge)' };
    }

    const language = body.language || 'ja';

    // 6. Fetch client data
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, name, style_profile')
      .eq('id', body.client_id)
      .single();

    if (clientError || !client) {
      throw { code: 'NOT_FOUND', message: 'Client not found' };
    }

    // 7. Fetch files to process
    const { data: files, error: filesError } = await supabaseAdmin
      .from('files')
      .select('id, name, storage_path, mime_type')
      .in('id', body.file_ids);

    if (filesError || !files || files.length === 0) {
      throw { code: 'NOT_FOUND', message: 'No files found' };
    }

    // 8. Update file extraction status to processing
    await supabaseAdmin
      .from('files')
      .update({ extraction_status: 'processing' })
      .in('id', body.file_ids);

    // 9. Extract text from each file
    const documents: { filename: string; content: string }[] = [];

    for (const file of files) {
      try {
        const content = await extractTextFromFile(
          supabaseAdmin,
          file.storage_path,
          file.mime_type
        );
        if (content && content.length > 10) {
          documents.push({
            filename: file.name,
            content: content.substring(0, 15000), // Limit per document
          });
        }
      } catch (err) {
        console.error(`Error extracting text from ${file.name}:`, err);
        // Continue with other files
      }
    }

    if (documents.length === 0) {
      // Update files as failed
      await supabaseAdmin
        .from('files')
        .update({ extraction_status: 'failed' })
        .in('id', body.file_ids);

      throw { code: 'EXTRACTION_FAILED', message: 'Could not extract text from any files' };
    }

    // 10. Build the prompt
    const prompt = buildStylePrompt(documents, client.name || 'Client', language);

    // 11. Call Claude API
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

      // Update files as failed
      await supabaseAdmin
        .from('files')
        .update({ extraction_status: 'failed' })
        .in('id', body.file_ids);

      throw { code: 'AI_ERROR', message: 'Failed to extract style' };
    }

    const claudeData = await claudeResponse.json();
    const extractedText = claudeData.content?.[0]?.text || '';

    // 12. Parse the response
    const extractedStyle = parseStyleResponse(extractedText);

    // 13. Update client style profile
    const existingProfile = (client.style_profile as Record<string, unknown>) || {};
    let newProfile: Record<string, unknown>;

    if (body.merge_mode === 'replace') {
      newProfile = {
        tone: extractedStyle.tone || existingProfile.tone,
        formality: extractedStyle.formality,
        key_messages: extractedStyle.key_messages,
        avoid_phrases: extractedStyle.avoid_phrases,
        boilerplate: extractedStyle.suggested_boilerplate || existingProfile.boilerplate,
        vocabulary_patterns: extractedStyle.vocabulary_patterns,
        structure_preferences: extractedStyle.structure_preferences,
        extracted_from: body.file_ids,
        last_extraction_at: new Date().toISOString(),
      };
    } else {
      // Merge mode - combine with existing
      const existingKeyMessages = (existingProfile.key_messages as string[]) || [];
      const existingAvoidPhrases = (existingProfile.avoid_phrases as string[]) || [];
      const existingExtractedFrom = (existingProfile.extracted_from as string[]) || [];

      newProfile = {
        ...existingProfile,
        tone: extractedStyle.tone || existingProfile.tone,
        formality: extractedStyle.formality || existingProfile.formality,
        key_messages: [...new Set([...existingKeyMessages, ...extractedStyle.key_messages])].slice(0, 10),
        avoid_phrases: [...new Set([...existingAvoidPhrases, ...extractedStyle.avoid_phrases])].slice(0, 20),
        boilerplate: extractedStyle.suggested_boilerplate || existingProfile.boilerplate,
        vocabulary_patterns: extractedStyle.vocabulary_patterns,
        structure_preferences: extractedStyle.structure_preferences,
        extracted_from: [...new Set([...existingExtractedFrom, ...body.file_ids])],
        last_extraction_at: new Date().toISOString(),
      };
    }

    // Save updated profile to client
    await supabaseAdmin
      .from('clients')
      .update({
        style_profile: newProfile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.client_id);

    // 14. Update files extraction status to completed
    await supabaseAdmin
      .from('files')
      .update({
        extraction_status: 'completed',
        extracted_at: new Date().toISOString(),
      })
      .in('id', body.file_ids);

    // 15. Build response
    const response: ExtractStyleResponse = {
      success: true,
      extracted_style: extractedStyle,
      files_processed: documents.length,
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
    else if (err.code === 'AI_ERROR' || err.code === 'EXTRACTION_FAILED') status = 502;

    const response: ExtractStyleResponse = {
      success: false,
      files_processed: 0,
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
