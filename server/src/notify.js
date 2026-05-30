/**
 * Report notifications for 24h developer review.
 *
 * Env (optional SMTP — not required for MVP):
 *   REPORT_EMAIL=office@tgbc.co.il
 *   ADMIN_SECRET=...
 *
 * TODO: configure SMTP for production email alerts:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

const REPORT_EMAIL = process.env.REPORT_EMAIL || 'office@tgbc.co.il';

export async function notifyReportCreated(report) {
  const payload = {
    to: REPORT_EMAIL,
    subject: `[Sikret] New moderation report ${report.id}`,
    report,
    adminHint: `Review open reports: curl -H "x-admin-secret: $ADMIN_SECRET" https://YOUR-API/admin/reports`,
  };

  // Always log — visible in Render logs within minutes
  console.log('[MODERATION ALERT]', JSON.stringify(payload, null, 2));

  // Placeholder for SMTP — implement when credentials are available
  if (process.env.SMTP_HOST) {
    console.log('[notify] SMTP_HOST set but mailer not wired — check server logs above');
  }

  return payload;
}
