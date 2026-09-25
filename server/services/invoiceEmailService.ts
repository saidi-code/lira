// services/invoiceEmailService.ts
// ==================== SEND ORDER INVOICE ====================
import { sendMail, isMailConfigured } from "../config/mailer.js";
import {
  invoiceEmailHtml,
  invoiceEmailText,
  invoiceEmailSubject,
} from "../templates/invoiceEmail.js";
import {
  InvoiceOrder,
  InvoiceRecipient,
} from "../types/invoice.js";

/**
 * Sends the post-purchase invoice email.
 *
 * Never throws: a mail outage must not fail a customer's checkout. The order
 * is already saved by the time this runs, so we log and swallow errors.
 *
 * @returns true when the message was handed to the SMTP server.
 */
export const sendOrderInvoiceEmail = async (
  recipient: InvoiceRecipient,
  order: InvoiceOrder
): Promise<boolean> => {
  if (!isMailConfigured()) {
    console.warn(
      "[invoice] SMTP not configured — skipping invoice email for order",
      order.orderNumber
    );
    return false;
  }

  if (!recipient?.email) {
    console.warn(
      "[invoice] Recipient has no email — skipping for order",
      order.orderNumber
    );
    return false;
  }

  try {
    await sendMail({
      to: recipient.email,
      subject: invoiceEmailSubject(order),
      html: invoiceEmailHtml(recipient, order),
      text: invoiceEmailText(recipient, order),
    });
    console.log("[invoice] Sent to", recipient.email, "for", order.orderNumber);
    return true;
  } catch (error) {
    console.error(
      "[invoice] Failed to send invoice for",
      order.orderNumber,
      error
    );
    return false;
  }
};
