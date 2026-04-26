/**
 * lib/email/smtp.ts
 * Nodemailer SMTP transporter using Gmail (free).
 *
 * Required env vars:
 *   SMTP_USER   — Gmail address (e.g. yourapp@gmail.com)
 *   SMTP_PASS   — Gmail App Password (not your real password — see Google Account > App Passwords)
 *   SMTP_FROM   — Optional display name + address, defaults to SMTP_USER
 */

import nodemailer from "nodemailer";

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      "SMTP_USER and SMTP_PASS environment variables are required for email sending."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(opts: SendMailOptions) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"NexCart" <${from}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

// ── Email templates ──────────────────────────────────────────────────────────

export function otpEmailHtml(otp: string, expiresInMinutes = 10): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset OTP</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">
                Nex<span style="color:#c4b5fd;">Cart</span>
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#111827;font-size:20px;font-weight:600;margin:0 0 12px 0;">
                Password Reset Request
              </h2>
              <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px 0;">
                We received a request to reset your NexCart password.
                Use the verification code below to proceed.
              </p>

              <!-- OTP Box -->
              <div style="background:#f5f3ff;border:2px dashed #8b5cf6;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <p style="color:#7c3aed;font-size:13px;font-weight:600;letter-spacing:0.05em;margin:0 0 8px 0;text-transform:uppercase;">
                  Your Verification Code
                </p>
                <p style="color:#111827;font-size:40px;font-weight:800;letter-spacing:0.2em;margin:0;font-family:'Courier New',monospace;">
                  ${otp}
                </p>
                <p style="color:#9ca3af;font-size:13px;margin:12px 0 0 0;">
                  Expires in ${expiresInMinutes} minutes
                </p>
              </div>

              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
                Enter this code on the NexCart website to reset your password.
                If you didn't request this, you can safely ignore this email — your password won't change.
              </p>

              <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;padding:12px 16px;margin-top:20px;">
                <p style="color:#92400e;font-size:13px;margin:0;">
                  <strong>Security tip:</strong> Never share this code with anyone.
                  NexCart staff will never ask for your OTP.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} NexCart. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function welcomeEmailHtml(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Welcome to NexCart</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">
                Nex<span style="color:#c4b5fd;">Cart</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#111827;font-size:20px;font-weight:600;margin:0 0 12px;">Welcome, ${name}!</h2>
              <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0;">
                Your NexCart account has been created successfully.
                Start shopping thousands of quality products today!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} NexCart.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
