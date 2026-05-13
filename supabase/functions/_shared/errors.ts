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
  return jsonResponse(status, { data: null, error });
};
