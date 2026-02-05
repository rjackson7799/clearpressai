/**
 * ClearPress AI - Invite User Edge Function
 *
 * Allows PR Admins to invite new team members to their organization.
 * Uses Supabase Admin API to send magic link invitations.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  role: 'pr_admin' | 'pr_staff' | 'client_user';
  name?: string;
  client_id?: string; // Required for client_user role
}

interface InviteResponse {
  success: boolean;
  user_id?: string;
  error?: {
    code: string;
    message: string;
  };
}

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
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');

    if (!authHeader) {
      throw { code: 'UNAUTHORIZED', message: 'Missing authorization header' };
    }

    // 3. Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // 4. Create user client to verify the calling user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );

    // 5. Get the calling user from the token
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseUser.auth.getUser();

    console.log('getUser result - caller:', caller?.id, 'error:', authError?.message);

    if (authError || !caller) {
      console.error('Auth verification failed:', authError);
      throw { code: 'UNAUTHORIZED', message: 'Invalid or expired token' };
    }

    // 6. Get caller's profile to verify they are pr_admin
    console.log('Looking up profile for user:', caller.id);
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role, organization_id')
      .eq('id', caller.id)
      .single();

    console.log('Profile lookup result:', callerProfile, 'error:', profileError?.message);

    if (profileError || !callerProfile) {
      console.error('Profile error:', profileError);
      throw { code: 'FORBIDDEN', message: 'User profile not found' };
    }

    console.log('User role:', callerProfile.role);

    if (callerProfile.role !== 'pr_admin') {
      throw { code: 'FORBIDDEN', message: 'Only admins can invite users' };
    }

    // 7. Parse and validate request body
    const body: InviteRequest = await req.json();

    if (!body.email) {
      throw { code: 'VALIDATION_ERROR', message: 'Email is required' };
    }

    if (!body.role) {
      throw { code: 'VALIDATION_ERROR', message: 'Role is required' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw { code: 'VALIDATION_ERROR', message: 'Invalid email format' };
    }

    // Validate role
    if (!['pr_admin', 'pr_staff', 'client_user'].includes(body.role)) {
      throw {
        code: 'INVALID_ROLE',
        message: 'Role must be pr_admin, pr_staff, or client_user',
      };
    }

    // Validate client_id is provided for client_user role
    if (body.role === 'client_user' && !body.client_id) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'client_id is required for client_user role',
      };
    }

    // Verify client exists and belongs to the organization
    if (body.client_id) {
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id, organization_id')
        .eq('id', body.client_id)
        .single();

      if (clientError || !client) {
        throw { code: 'NOT_FOUND', message: 'Client not found' };
      }

      if (client.organization_id !== callerProfile.organization_id) {
        throw { code: 'FORBIDDEN', message: 'Client belongs to another organization' };
      }
    }

    // 8. Check if user already exists in our users table (active member)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', body.email.toLowerCase())
      .single();

    if (existingUser) {
      throw { code: 'ALREADY_MEMBER', message: 'User is already a member' };
    }

    // 9. Send the invitation via Supabase Admin API
    // Note: We removed the listUsers() check for pending invites because it was
    // inefficient (fetched ALL users). The inviteUserByEmail API will return an
    // error if the user already has a pending invite, which we handle below.
    const appUrl =
      Deno.env.get('APP_URL') ?? Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(body.email, {
        data: {
          name: body.name || '',
          role: body.role,
          organization_id: callerProfile.organization_id,
          client_id: body.client_id || null, // Store client_id for auto-assignment on accept
        },
        redirectTo: `${appUrl}/accept-invite`,
      });

    if (inviteError) {
      console.error('Invite error:', inviteError);

      // Handle specific Supabase errors
      if (inviteError.message?.includes('already registered')) {
        throw {
          code: 'ALREADY_MEMBER',
          message: 'User is already registered',
        };
      }

      // Handle "User already invited" - Supabase returns this for unconfirmed users
      if (
        inviteError.message?.includes('already been invited') ||
        inviteError.message?.includes('already invited') ||
        inviteError.message?.includes('email already exists')
      ) {
        throw {
          code: 'ALREADY_INVITED',
          message: 'User has already been invited',
        };
      }

      // Handle rate limiting from Supabase's built-in email service
      const lowerMsg = (inviteError.message ?? '').toLowerCase();
      if (
        lowerMsg.includes('rate limit') ||
        lowerMsg.includes('too many') ||
        lowerMsg.includes('exceeded') ||
        lowerMsg.includes('429') ||
        (inviteError as { status?: number }).status === 429
      ) {
        throw {
          code: 'RATE_LIMITED',
          message: 'Email rate limit reached. Please try again in a few minutes.',
        };
      }

      // Handle email delivery failures
      if (
        lowerMsg.includes('email') && (lowerMsg.includes('deliver') || lowerMsg.includes('send') || lowerMsg.includes('fail'))
      ) {
        throw {
          code: 'EMAIL_DELIVERY_FAILED',
          message: 'Failed to deliver invitation email.',
        };
      }

      throw {
        code: 'INVITE_FAILED',
        message: inviteError.message || 'Failed to send invitation',
      };
    }

    // 11. Return success response
    const response: InviteResponse = {
      success: true,
      user_id: inviteData.user?.id,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // Handle structured errors
    const err = error as { code?: string; message?: string };

    // Determine HTTP status based on error code
    let status = 500;
    if (err.code === 'UNAUTHORIZED') status = 401;
    else if (err.code === 'FORBIDDEN') status = 403;
    else if (
      err.code === 'VALIDATION_ERROR' ||
      err.code === 'INVALID_ROLE' ||
      err.code === 'ALREADY_MEMBER' ||
      err.code === 'ALREADY_INVITED'
    )
      status = 400;
    else if (err.code === 'RATE_LIMITED') status = 429;
    else if (err.code === 'METHOD_NOT_ALLOWED') status = 405;

    const response: InviteResponse = {
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
