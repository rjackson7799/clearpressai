import { corsHeaders } from './cors.ts';

export type ApiErrorCode =
  | 'permission_denied'
  | 'validation_error'
  | 'not_found'
  | 'ai_error'
  | 'internal_error';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export const jsonResponse = (status: number, body: unknown): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

export const jsonError = (status: number, error: ApiError): Response => {
  // Log server-side so failures leave a trace in Supabase Edge logs (the JSON
  // body alone was not logged anywhere). 5xx is a real fault; 4xx is expected
  // client error, logged at a lower level to keep the signal clean.
  const line = `[${error.code}] ${status} ${error.message}`;
  if (status >= 500) {
    console.error(line, error.details ?? "");
  } else {
    console.warn(line);
  }
  return jsonResponse(status, { data: null, error });
};
