/**
 * ClearPress AI - Email Templates
 * Reusable HTML email templates for notifications
 */

// ===== Types =====

export type NotificationType =
  | 'project_request'
  | 'content_submitted'
  | 'comment_added'
  | 'approval_needed'
  | 'content_approved'
  | 'deadline_reminder';

export type Language = 'ja' | 'en';

export interface EmailData {
  recipientName: string;
  language: Language;
  appUrl: string;
}

export interface ProjectRequestEmailData extends EmailData {
  projectName: string;
  clientName: string;
  urgency: string;
  deadline?: string;
  projectId: string;
}

export interface ContentSubmittedEmailData extends EmailData {
  contentTitle: string;
  contentType: string;
  projectName: string;
  projectId: string;
  contentItemId: string;
}

export interface CommentAddedEmailData extends EmailData {
  commenterName: string;
  contentTitle: string;
  commentExcerpt: string;
  projectId: string;
  contentItemId: string;
}

export interface ApprovalNeededEmailData extends EmailData {
  contentTitle: string;
  projectName: string;
  submitterName: string;
  projectId: string;
  contentItemId: string;
}

export interface ContentApprovedEmailData extends EmailData {
  contentTitle: string;
  projectName: string;
  approverName: string;
  projectId: string;
  contentItemId: string;
}

export interface DeadlineReminderEmailData extends EmailData {
  projectName: string;
  deadline: string;
  hoursRemaining: number;
  projectId: string;
}

// ===== Translations =====

const translations = {
  ja: {
    greeting: (name: string) => `${name} 様`,
    projectRequest: {
      subject: '新しいプロジェクトが作成されました',
      body: (data: ProjectRequestEmailData) =>
        `新しいプロジェクト「${data.projectName}」が${data.clientName}から依頼されました。`,
      urgency: (level: string) => `緊急度: ${level}`,
      deadline: (date: string) => `締め切り: ${date}`,
      cta: 'プロジェクトを確認',
    },
    contentSubmitted: {
      subject: 'コンテンツのレビューをお願いします',
      body: (data: ContentSubmittedEmailData) =>
        `「${data.contentTitle}」（${data.contentType}）のレビューをお願いします。`,
      project: (name: string) => `プロジェクト: ${name}`,
      cta: 'レビューを開始',
    },
    commentAdded: {
      subject: '新しいコメントが追加されました',
      body: (data: CommentAddedEmailData) =>
        `${data.commenterName}さんが「${data.contentTitle}」にコメントしました。`,
      excerpt: (text: string) => `「${text}」`,
      cta: 'コメントを確認',
    },
    approvalNeeded: {
      subject: '承認をお願いします',
      body: (data: ApprovalNeededEmailData) =>
        `${data.submitterName}さんが「${data.contentTitle}」の承認を依頼しています。`,
      project: (name: string) => `プロジェクト: ${name}`,
      cta: '承認ページへ',
    },
    contentApproved: {
      subject: 'コンテンツが承認されました',
      body: (data: ContentApprovedEmailData) =>
        `${data.approverName}さんが「${data.contentTitle}」を承認しました。`,
      project: (name: string) => `プロジェクト: ${name}`,
      cta: 'コンテンツを確認',
    },
    deadlineReminder: {
      subject: '締め切りが近づいています',
      body: (data: DeadlineReminderEmailData) =>
        `プロジェクト「${data.projectName}」の締め切りまであと${data.hoursRemaining}時間です。`,
      deadline: (date: string) => `締め切り: ${date}`,
      cta: 'プロジェクトを確認',
    },
    footer: {
      unsubscribe: 'メール配信を停止する',
      company: 'ClearPress AI',
      tagline: 'AI-powered PR content platform',
    },
  },
  en: {
    greeting: (name: string) => `Hi ${name},`,
    projectRequest: {
      subject: 'New project created',
      body: (data: ProjectRequestEmailData) =>
        `A new project "${data.projectName}" has been requested by ${data.clientName}.`,
      urgency: (level: string) => `Urgency: ${level}`,
      deadline: (date: string) => `Deadline: ${date}`,
      cta: 'View Project',
    },
    contentSubmitted: {
      subject: 'Content ready for review',
      body: (data: ContentSubmittedEmailData) =>
        `"${data.contentTitle}" (${data.contentType}) is ready for your review.`,
      project: (name: string) => `Project: ${name}`,
      cta: 'Start Review',
    },
    commentAdded: {
      subject: 'New comment added',
      body: (data: CommentAddedEmailData) =>
        `${data.commenterName} commented on "${data.contentTitle}".`,
      excerpt: (text: string) => `"${text}"`,
      cta: 'View Comment',
    },
    approvalNeeded: {
      subject: 'Approval requested',
      body: (data: ApprovalNeededEmailData) =>
        `${data.submitterName} is requesting approval for "${data.contentTitle}".`,
      project: (name: string) => `Project: ${name}`,
      cta: 'Review & Approve',
    },
    contentApproved: {
      subject: 'Content approved',
      body: (data: ContentApprovedEmailData) =>
        `${data.approverName} has approved "${data.contentTitle}".`,
      project: (name: string) => `Project: ${name}`,
      cta: 'View Content',
    },
    deadlineReminder: {
      subject: 'Deadline approaching',
      body: (data: DeadlineReminderEmailData) =>
        `Project "${data.projectName}" is due in ${data.hoursRemaining} hours.`,
      deadline: (date: string) => `Deadline: ${date}`,
      cta: 'View Project',
    },
    footer: {
      unsubscribe: 'Unsubscribe from emails',
      company: 'ClearPress AI',
      tagline: 'AI-powered PR content platform',
    },
  },
};

// ===== Base Layout =====

function baseLayout(
  content: string,
  language: Language,
  appUrl: string,
  userId?: string
): string {
  const t = translations[language];
  const unsubscribeUrl = userId
    ? `${appUrl}/unsubscribe?user=${userId}`
    : `${appUrl}/settings`;

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ClearPress AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ClearPress AI
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: #ffffff;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                ${t.footer.company} — ${t.footer.tagline}
              </p>
              <a href="${unsubscribeUrl}" style="color: #94a3b8; font-size: 12px; text-decoration: none;">
                ${t.footer.unsubscribe}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function ctaButton(text: string, url: string): string {
  return `
<table role="presentation" style="margin: 24px 0;">
  <tr>
    <td>
      <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; border-radius: 6px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
`;
}

// ===== Email Template Functions =====

export function projectRequestEmail(data: ProjectRequestEmailData): {
  subject: string;
  html: string;
} {
  const t = translations[data.language];

  const content = `
<p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">
  ${t.greeting(data.recipientName)}
</p>
<p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
  ${t.projectRequest.body(data)}
</p>
<p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;">
  ${t.projectRequest.urgency(data.urgency)}
</p>
${data.deadline ? `<p style="margin: 0 0 16px 0; color: #475569; font-size: 14px;">${t.projectRequest.deadline(data.deadline)}</p>` : ''}
${ctaButton(t.projectRequest.cta, `${data.appUrl}/pr/projects/${data.projectId}`)}
`;

  return {
    subject: t.projectRequest.subject,
    html: baseLayout(content, data.language, data.appUrl),
  };
}

export function contentSubmittedEmail(data: ContentSubmittedEmailData): {
  subject: string;
  html: string;
} {
  const t = translations[data.language];

  const content = `
<p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">
  ${t.greeting(data.recipientName)}
</p>
<p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
  ${t.contentSubmitted.body(data)}
</p>
<p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">
  ${t.contentSubmitted.project(data.projectName)}
</p>
${ctaButton(t.contentSubmitted.cta, `${data.appUrl}/client/projects/${data.projectId}/content/${data.contentItemId}`)}
`;

  return {
    subject: t.contentSubmitted.subject,
    html: baseLayout(content, data.language, data.appUrl),
  };
}

export function commentAddedEmail(data: CommentAddedEmailData): {
  subject: string;
  html: string;
} {
  const t = translations[data.language];

  const content = `
<p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">
  ${t.greeting(data.recipientName)}
</p>
<p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
  ${t.commentAdded.body(data)}
</p>
${data.commentExcerpt ? `<blockquote style="margin: 0 0 16px 0; padding: 12px 16px; background-color: #f8fafc; border-left: 3px solid #3b82f6; color: #475569; font-size: 14px; font-style: italic;">${t.commentAdded.excerpt(data.commentExcerpt)}</blockquote>` : ''}
${ctaButton(t.commentAdded.cta, `${data.appUrl}/client/projects/${data.projectId}/content/${data.contentItemId}?tab=comments`)}
`;

  return {
    subject: t.commentAdded.subject,
    html: baseLayout(content, data.language, data.appUrl),
  };
}

export function approvalNeededEmail(data: ApprovalNeededEmailData): {
  subject: string;
  html: string;
} {
  const t = translations[data.language];

  const content = `
<p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">
  ${t.greeting(data.recipientName)}
</p>
<p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
  ${t.approvalNeeded.body(data)}
</p>
<p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">
  ${t.approvalNeeded.project(data.projectName)}
</p>
${ctaButton(t.approvalNeeded.cta, `${data.appUrl}/client/projects/${data.projectId}/content/${data.contentItemId}`)}
`;

  return {
    subject: t.approvalNeeded.subject,
    html: baseLayout(content, data.language, data.appUrl),
  };
}

export function contentApprovedEmail(data: ContentApprovedEmailData): {
  subject: string;
  html: string;
} {
  const t = translations[data.language];

  const content = `
<p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">
  ${t.greeting(data.recipientName)}
</p>
<p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
  ${t.contentApproved.body(data)}
</p>
<p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">
  ${t.contentApproved.project(data.projectName)}
</p>
<div style="margin: 16px 0; padding: 16px; background-color: #ecfdf5; border-radius: 8px; text-align: center;">
  <span style="color: #059669; font-size: 14px; font-weight: 500;">✓ ${data.language === 'ja' ? '承認済み' : 'Approved'}</span>
</div>
${ctaButton(t.contentApproved.cta, `${data.appUrl}/pr/projects/${data.projectId}/content/${data.contentItemId}`)}
`;

  return {
    subject: t.contentApproved.subject,
    html: baseLayout(content, data.language, data.appUrl),
  };
}

export function deadlineReminderEmail(data: DeadlineReminderEmailData): {
  subject: string;
  html: string;
} {
  const t = translations[data.language];

  const urgencyColor = data.hoursRemaining <= 12 ? '#dc2626' : '#f59e0b';

  const content = `
<p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">
  ${t.greeting(data.recipientName)}
</p>
<p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
  ${t.deadlineReminder.body(data)}
</p>
<div style="margin: 16px 0; padding: 16px; background-color: #fef3c7; border-radius: 8px; text-align: center;">
  <span style="color: ${urgencyColor}; font-size: 14px; font-weight: 500;">⏰ ${t.deadlineReminder.deadline(data.deadline)}</span>
</div>
${ctaButton(t.deadlineReminder.cta, `${data.appUrl}/pr/projects/${data.projectId}`)}
`;

  return {
    subject: `⏰ ${t.deadlineReminder.subject}`,
    html: baseLayout(content, data.language, data.appUrl),
  };
}

// ===== Main Template Dispatcher =====

export function generateEmailTemplate(
  type: NotificationType,
  // deno-lint-ignore no-explicit-any
  data: any
): { subject: string; html: string } | null {
  switch (type) {
    case 'project_request':
      return projectRequestEmail(data as ProjectRequestEmailData);
    case 'content_submitted':
      return contentSubmittedEmail(data as ContentSubmittedEmailData);
    case 'comment_added':
      return commentAddedEmail(data as CommentAddedEmailData);
    case 'approval_needed':
      return approvalNeededEmail(data as ApprovalNeededEmailData);
    case 'content_approved':
      return contentApprovedEmail(data as ContentApprovedEmailData);
    case 'deadline_reminder':
      return deadlineReminderEmail(data as DeadlineReminderEmailData);
    default:
      return null;
  }
}
