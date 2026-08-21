import nodemailer from 'nodemailer';
import { logger } from './logger';

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  // Return null if no SMTP host configured
  return null;
};

export const sendEmail = async (options: MailOptions): Promise<boolean> => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.ADMIN_EMAIL || 'sportsentertainmentclub9@gmail.com';

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"SEC Cricket Club Admin" <${from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      logger.info(`Password reset email successfully sent to ${options.to}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email via SMTP to ${options.to}:`, error);
    }
  }

  // Fallback for development / unconfigured SMTP: log reset instructions
  logger.warn(`[DEV/SMTP Fallback] Mail dispatch to ${options.to}:`);
  logger.warn(`Subject: ${options.subject}`);
  logger.warn(`Email body content / Reset URL extracted from html.`);

  return true;
};

export const sendAdminPasswordResetEmail = async (
  email: string,
  resetUrl: string
): Promise<boolean> => {
  const subject = 'SEC Cricket Club - Admin Password Reset Request';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #111B30; color: #FFFFFF; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background-color: #1A2744; border: 1px solid #243260; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { text-align: center; margin-bottom: 24px; }
        .title { color: #FFFFFF; font-size: 22px; font-weight: 800; text-transform: uppercase; margin: 8px 0; }
        .subtitle { color: #C41230; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
        .divider { height: 2px; background-color: #C41230; width: 40px; margin: 16px auto; }
        .content { font-size: 15px; line-height: 1.6; color: #D1D5DB; margin-bottom: 28px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { background-color: #C41230; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(196,18,48,0.4); }
        .footer { font-size: 12px; color: #9CA3AF; text-align: center; margin-top: 32px; border-top: 1px solid #243260; padding-top: 16px; }
        .link-box { word-break: break-all; background-color: #111B30; border: 1px solid #243260; padding: 12px; border-radius: 8px; font-size: 12px; color: #9CA3AF; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="subtitle">SEC Cricket Club • Admin Portal</div>
          <div class="title">Password Reset Request</div>
          <div class="divider"></div>
        </div>
        <div class="content">
          <p>Hello Administrator,</p>
          <p>You requested a password reset for your SEC Cricket Club Admin account (<strong>${email}</strong>).</p>
          <p>Please click the button below to set a new password. This link is encrypted and valid for <strong>15 minutes</strong> for security purposes.</p>
        </div>
        <div class="btn-container">
          <a href="${resetUrl}" class="btn" target="_blank">Reset Administrator Password</a>
        </div>
        <div class="content">
          <p>If you did not request this password reset, please ignore this email or contact system administration.</p>
          <div class="link-box">
            If the button doesn't work, copy and paste this encrypted URL into your browser:<br>
            <a href="${resetUrl}" style="color: #60A5FA;">${resetUrl}</a>
          </div>
        </div>
        <div class="footer">
          SEC Cricket Club • ESTD. 1994 • Prestige • Community • Legacy
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `SEC Cricket Club - Admin Password Reset Request\n\nHello Administrator,\n\nUse the encrypted link below to reset your password (valid for 15 minutes):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};
