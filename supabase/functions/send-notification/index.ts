/**
 * ClearPress AI - Send Notification Edge Function
 *
 * Creates in-app notifications and sends email notifications via Resend API.
 * Respects user email preferences.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  generateEmailTemplate,
  type NotificationType,
  type Language,
} from '../_shared/email-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ===== Types =====

interface NotificationMetadata {
  project_id?: string;
  content_item_id?: string;
  link?: string;
  // Additional data for email templates
  project_name?: string;
  content_title?: string;
  content_type?: string;
  client_name?: string;
  urgency?: string;
  deadline?: string;
  commenter_name?: string;
  comment_excerpt?: string;
  submitter_name?: string;
  approver_name?: string;
  hours_remaining?: number;
}

interface SendNotificationRequest {
  user_ids: string[];
  type: NotificationType;
  title: string;
  body: string;
  metadata?: NotificationMetadata;
  send_email?: boolean; // Default: true
}

interface UserWithPreferences {
  id: string;
  email: string;
  name: string;
  preferences: {
    language?: Language;
    notifications_email?: boolean;
  } | null;
}

interface SendNotificationResponse {
  success: boolean;
  notifications_created: number;
  emails_sent: number;
  emails_skipped: number;
  failures?: { user_id: string; reason: string }[];
  error?: {
    code: string;
    message: string;
  };
}

// ===== Helper Functions =====

async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string,
  resendApiKey: string,
  fromEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return {
        success: false,
        error: errorData.message || 'Failed to send email',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Resend API exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function buildEmailTemplateData(
  user: UserWithPreferences,
  type: NotificationType,
  metadata: NotificationMetadata | undefined,
  appUrl: string
  // deno-lint-ignore no-explicit-any
): any {
  const language = user.preferences?.language || 'ja';
  const baseData = {
    recipientName: user.name,
    language,
    appUrl,
  };

  switch (type) {
    case 'project_request':
      return {
        ...baseData,
        projectName: metadata?.project_name || 'New Project',
        clientName: metadata?.client_name || 'Client',
        urgency: metadata?.urgency || 'standard',
        deadline: metadata?.deadline,
        projectId: metadata?.project_id || '',
      };

    case 'content_submitted':
      return {
        ...baseData,
        contentTitle: metadata?.content_title || 'Content',
        contentType: metadata?.content_type || 'content',
        projectName: metadata?.project_name || 'Project',
        projectId: metadata?.project_id || '',
        contentItemId: metadata?.content_item_id || '',
      };

    case 'comment_added':
      return {
        ...baseData,
        commenterName: metadata?.commenter_name || 'Someone',
        contentTitle: metadata?.content_title || 'Content',
        commentExcerpt: metadata?.comment_excerpt || '',
        projectId: metadata?.project_id || '',
        contentItemId: metadata?.content_item_id || '',
      };

    case 'approval_needed':
      return {
        ...baseData,
        contentTitle: metadata?.content_title || 'Content',
        projectName: metadata?.project_name || 'Project',
        submitterName: metadata?.submitter_name || 'Someone',
        projectId: metadata?.project_id || '',
        contentItemId: metadata?.content_item_id || '',
      };

    case 'content_approved':
      return {
        ...baseData,
        contentTitle: metadata?.content_title || 'Content',
        projectName: metadata?.project_name || 'Project',
        approverName: metadata?.approver_name || 'Someone',
        projectId: metadata?.project_id || '',
        contentItemId: metadata?.content_item_id || '',
      };

    case 'deadline_reminder':
      return {
        ...baseData,
        projectName: metadata?.project_name || 'Project',
        deadline: metadata?.deadline || '',
        hoursRemaining: metadata?.hours_remaining || 24,
        projectId: metadata?.project_id || '',
      };

    default:
      return baseData;
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
    const body: SendNotificationRequest = await req.json();

    if (!body.user_ids || !Array.isArray(body.user_ids) || body.user_ids.length === 0) {
      throw { code: 'VALIDATION_ERROR', message: 'user_ids array is required' };
    }
    if (!body.type) {
      throw { code: 'VALIDATION_ERROR', message: 'type is required' };
    }
    if (!body.title) {
      throw { code: 'VALIDATION_ERROR', message: 'title is required' };
    }
    if (!body.body) {
      throw { code: 'VALIDATION_ERROR', message: 'body is required' };
    }

    const sendEmail = body.send_email !== false; // Default to true

    // 6. Get environment variables for email
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'ClearPress AI <noreply@clearpress.ai>';

    // 7. Create in-app notifications for all users
    const notificationsToInsert = body.user_ids.map((userId) => ({
      user_id: userId,
      type: body.type,
      title: body.title,
      body: body.body,
      metadata: body.metadata
        ? {
            project_id: body.metadata.project_id,
            content_item_id: body.metadata.content_item_id,
            link: body.metadata.link,
          }
        : null,
      read: false,
    }));

    const { error: insertError, data: insertedNotifications } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      throw { code: 'DB_ERROR', message: 'Failed to create notifications' };
    }

    const notificationsCreated = insertedNotifications?.length || 0;

    // 8. Send emails if enabled and Resend is configured
    let emailsSent = 0;
    let emailsSkipped = 0;
    const failures: { user_id: string; reason: string }[] = [];

    if (sendEmail && resendApiKey) {
      // Fetch user details for email sending
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, preferences')
        .in('id', body.user_ids);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        // Continue without sending emails - in-app notifications are created
      } else if (users && users.length > 0) {
        for (const user of users as UserWithPreferences[]) {
          // Check if user has email notifications enabled
          const emailEnabled = user.preferences?.notifications_email !== false;

          if (!emailEnabled) {
            emailsSkipped++;
            continue;
          }

          // Generate email template
          const templateData = buildEmailTemplateData(user, body.type, body.metadata, appUrl);
          const template = generateEmailTemplate(body.type, templateData);

          if (!template) {
            failures.push({
              user_id: user.id,
              reason: 'Failed to generate email template',
            });
            continue;
          }

          // Send email
          const result = await sendEmailViaResend(
            user.email,
            template.subject,
            template.html,
            resendApiKey,
            fromEmail
          );

          if (result.success) {
            emailsSent++;
          } else {
            failures.push({
              user_id: user.id,
              reason: result.error || 'Email send failed',
            });
          }
        }
      }
    } else if (sendEmail && !resendApiKey) {
      console.warn('RESEND_API_KEY not configured - skipping email delivery');
      emailsSkipped = body.user_ids.length;
    }

    // 9. Build response
    const response: SendNotificationResponse = {
      success: true,
      notifications_created: notificationsCreated,
      emails_sent: emailsSent,
      emails_skipped: emailsSkipped,
    };

    if (failures.length > 0) {
      response.failures = failures;
    }

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
    else if (err.code === 'DB_ERROR') status = 500;

    const response: SendNotificationResponse = {
      success: false,
      notifications_created: 0,
      emails_sent: 0,
      emails_skipped: 0,
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
