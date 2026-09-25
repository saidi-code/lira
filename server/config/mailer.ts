// config/mailer.ts
// ==================== NODEMAILER TRANSPORT ====================
import nodemailer, { type Transporter } from "nodemailer";
import dotenv from "dotenv";
import mailConfig from "./nodeMailConfig.js";

dotenv.config();

/**
 * Lazily-created SMTP transport. Built on first use so that a missing or
 * invalid mail configuration can never prevent the server from booting.
 */
let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: mailConfig.EMAIL_SERVICE,
      auth: {
        user: mailConfig.EMAIL_USER,
        pass: mailConfig.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

/** True when the SMTP credentials look usable (not the placeholder defaults). */
export const isMailConfigured = (): boolean => {
  const { EMAIL_USER, EMAIL_PASS } = mailConfig;
  if (!EMAIL_USER || !EMAIL_PASS) return false;
  return (
    !EMAIL_USER.startsWith("your-email") &&
    !EMAIL_PASS.startsWith("your-email")
  );
};

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Sends a message. Throws on failure so callers can log/handle. */
export const sendMail = async ({
  to,
  subject,
  html,
  text,
}: SendMailOptions) => {
  const info = await getTransporter().sendMail({
    from: mailConfig.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
  return info;
};

export { mailConfig };
