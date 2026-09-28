import "server-only";
import nodemailer from "nodemailer";

/** Sends an email if SMTP is configured; otherwise silently does nothing. */
export async function sendMail(to: string, subject: string, text: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !to) return;
  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, text });
  } catch (err) {
    console.error("Email failed:", err);
  }
}
