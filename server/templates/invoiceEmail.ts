// templates/invoiceEmail.ts
// ==================== ORDER INVOICE EMAIL ====================
// Table-based, inline-styled HTML. Uses the same palette as the app
// (client/constants/index.ts) so the mail feels like part of the product.
//
// Outlook / Gmail safe: no flexbox, no external CSS, no <style> blocks
// beyond the mobile media query.
import {
  InvoiceItem,
  InvoiceOrder,
  InvoiceRecipient,
} from "../types/invoice.js";

const BRAND = {
  primary: "#B89354", // gold  — buttons, rules, accents
  accent: "#785920", // deep gold — headline text
  canvas: "#FFF8F5", // page background
  body: "#201B16", // primary text
  surface: "#ECE0D9", // table borders, muted fills
  muted: "#78716C", // secondary text
  white: "#FFFFFF",
  success: "#15803D",
} as const;

const CURRENCY = "د.ت"; // Tunisian dinar — matches client/constants/index.ts

// ---------- Formatting ----------
const money = (value: number) =>
  `${Number(value ?? 0).toFixed(2)} ${CURRENCY}`;

// ---------- Bidirectional text ----------
// A line like "رقم الطلب: ORD-2025-A3F9K2" mixes strong RTL (Arabic) with
// strong LTR (the order number) and the colon between them is neutral, so
// where it lands depends on the paragraph direction the client happens to
// pick. Subjects have no dir attribute at all, which is why the number can
// jump to the wrong end of the line in Outlook.
//
// Prefixing a RIGHT-TO-LEFT MARK pins the base direction to RTL, so the
// Arabic keeps its natural order and the trailing Latin runs resolve to the
// left. Lines with no Arabic are left alone, since LTR base is correct for
// them. The HTML body does not need this: it carries dir="rtl" already.
const RLM = "\u200F";
const hasArabic = (line: string) => /[\u0600-\u06FF]/.test(line);
const bidi = (line: string) => (hasArabic(line) ? RLM + line : line);

const formatDate = (value: Date | string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "الدفع عند الاستلام",
  stripe: "بطاقة بنكية",
};

const STATUS_LABELS: Record<string, string> = {
  placed: "تم استلام الطلب",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغى",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "في الانتظار",
  paid: "مدفوع",
  failed: "فشل الدفع",
  refunded: "مسترد",
};

/**
 * Escapes user-controlled text before it reaches the HTML body.
 * Order notes / product names are attacker-influencable, so this is not optional.
 */
const esc = (input: unknown): string =>
  String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ---------- Fragments ----------
const header = () => `
  <tr>
    <td style="background:${BRAND.primary};padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.primary};">
        <tr>
          <td align="center" style="padding:28px 24px 24px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:10px;color:${BRAND.white};font-weight:bold;direction:ltr;">LIRA</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;color:${BRAND.white};opacity:.85;margin-top:6px;direction:ltr;">LUXURY STORE</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

const infoCell = (label: string, value: string) => `
  <td width="50%" style="padding:0 8px 12px 8px;vertical-align:top;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${BRAND.muted};letter-spacing:.5px;padding-bottom:4px;">${esc(label)}</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.body};font-weight:bold;direction:ltr;text-align:right;">${esc(value)}</div>
  </td>`;

const orderSummary = (order: InvoiceOrder) => `
  <tr>
    <td style="padding:24px 28px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.white};border:1px solid ${BRAND.surface};border-radius:12px;">
        <tr>
          <td style="padding:20px 20px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                ${infoCell("رقم الطلب", order.orderNumber)}
                ${infoCell("تاريخ الطلب", formatDate(order.createdAt))}
              </tr>
              <tr>
                ${infoCell("حالة الطلب", STATUS_LABELS[order.orderStatus] ?? order.orderStatus)}
                ${infoCell("طريقة الدفع", PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod)}
              </tr>
              <tr>
                ${infoCell("حالة الدفع", PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus)}
                ${infoCell("عدد المنتجات", String(order.items.length))}
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;


const itemRow = (item: InvoiceItem) => {
  const variant = [item.size, item.color].filter(Boolean).join(" • ");
  const image = item.image
    ? `<img src="${esc(item.image)}" width="52" height="52" alt="" style="width:52px;height:52px;border-radius:8px;object-fit:cover;border:1px solid ${BRAND.surface};display:block;" />`
    : `<div style="width:52px;height:52px;border-radius:8px;background:${BRAND.canvas};border:1px solid ${BRAND.surface};"></div>`;

  return `
    <tr>
      <td style="padding:14px 20px;border-bottom:1px solid ${BRAND.surface};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="direction:ltr;">
          <tr>
            <td width="68" style="vertical-align:top;">${image}</td>
            <td style="vertical-align:top;padding-inline-start:14px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.body};font-weight:bold;direction:rtl;text-align:right;">${esc(item.name)}</div>
              ${
                variant
                  ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.muted};margin-top:3px;direction:rtl;text-align:right;">${esc(variant)}</div>`
                  : ""
              }
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.muted};margin-top:3px;direction:ltr;text-align:right;">${esc(
                money(item.price)
              )} &times; ${esc(item.quantity)}</div>
            </td>
            <td width="110" style="vertical-align:middle;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.body};font-weight:bold;direction:ltr;white-space:nowrap;">
              ${esc(money(item.subtotal))}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
};

const itemsTable = (order: InvoiceOrder) => `
  <tr>
    <td style="padding:24px 28px 0;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:${BRAND.accent};font-weight:bold;margin-bottom:12px;">
        تفاصيل الطلب
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.white};border:1px solid ${BRAND.surface};border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:12px 20px;background:${BRAND.canvas};border-bottom:1px solid ${BRAND.surface};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.muted};">المنتج</td>
                <td width="110" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.muted};text-align:right;direction:ltr;">الإجمالي</td>
              </tr>
            </table>
          </td>
        </tr>
        ${order.items.map(itemRow).join("")}
      </table>
    </td>
  </tr>`;

const totalRow = (label: string, value: string, bold = false) => `
  <tr>
    <td style="padding:5px 0;font-family:Arial,Helvetica,sans-serif;font-size:${
      bold ? "17px" : "14px"
    };color:${bold ? BRAND.body : BRAND.muted};font-weight:${
      bold ? "bold" : "normal"
    };">${esc(label)}</td>
    <td style="padding:5px 0;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:${
      bold ? "17px" : "14px"
    };color:${bold ? BRAND.accent : BRAND.body};font-weight:bold;direction:ltr;white-space:nowrap;">${esc(
      value
    )}</td>
  </tr>`;


const totals = (order: InvoiceOrder) => `
  <tr>
    <td style="padding:16px 28px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.white};border:1px solid ${BRAND.surface};border-radius:12px;">
        <tr>
          <td style="padding:18px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${totalRow("المجموع الفرعي", money(order.subtotal))}
              ${Number(order.tax) > 0 ? totalRow("الضريبة", money(order.tax)) : ""}
              ${
                Number(order.shippingCost) > 0
                  ? totalRow("الشحن", money(order.shippingCost))
                  : ""
              }
              <tr>
                <td colspan="2" style="padding:10px 0 0;border-top:1px solid ${BRAND.surface};"></td>
              </tr>
              ${totalRow("الإجمالي", money(order.totalAmount), true)}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

const address = (order: InvoiceOrder) => {
  const a = order.shippingAddress;
  return `
  <tr>
    <td style="padding:16px 28px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.white};border:1px solid ${BRAND.surface};border-radius:12px;">
        <tr>
          <td style="padding:18px 20px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${BRAND.accent};font-weight:bold;margin-bottom:10px;">
              عنوان التوصيل
            </div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.body};line-height:1.9;">
              ${esc(a.street)}<br />
              ${esc(a.city)}${a.state ? `، ${esc(a.state)}` : ""} — ${esc(
                a.zipCode
              )}<br />
              ${esc(a.phoneNumber)}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
};

const footer = () => `
  <tr>
    <td style="padding:28px 28px 32px;text-align:center;">
      <div style="height:2px;width:56px;background:${BRAND.primary};margin:0 auto 18px;"></div>
      <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.body};line-height:1.8;">
        شكراً لثقتك بلي&nbsp;را — نتشرّف بخدمتك.
      </p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.muted};line-height:1.8;">
        لأي استفسار بخصوص طلبك، تواصلي معنا عبر البريد الإلكتروني.
      </p>
    </td>
  </tr>`;

const greeting = (recipient: InvoiceRecipient, order: InvoiceOrder) => `
  <tr>
    <td style="padding:30px 28px 0;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:${BRAND.accent};font-weight:bold;line-height:1.5;">
        شكراً لشرائك، ${esc(recipient.name)}
      </div>
      <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${BRAND.body};line-height:1.9;">
        سعدنا بخدمتك في متجر ليرا. تم استلام طلبك بنجاح، وستجدين التفاصيل كاملة في الفاتورة أدناه.
        سنتواصل معك لتأكيد موعد التسليم.
      </p>
    </td>
  </tr>`;

// ==================== PUBLIC API ====================

/** Full HTML body for the order-invoice email. */
export const invoiceEmailHtml = (
  recipient: InvoiceRecipient,
  order: InvoiceOrder
): string => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>فاتورة طلبك ${esc(order.orderNumber)} — ليرا</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.canvas};">
  <div style="display:none;font-size:1px;color:${BRAND.canvas};">
    شكراً لشرائك من ليرا — فاتورة طلبك ${esc(order.orderNumber)} جاهزة.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.canvas};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.white};border:1px solid ${BRAND.surface};border-radius:16px;overflow:hidden;">
          ${header()}
          ${greeting(recipient, order)}
          ${orderSummary(order)}
          ${itemsTable(order)}
          ${totals(order)}
          ${address(order)}
          ${footer()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/** Plain-text alternative — required, and the only thing some clients render. */
export const invoiceEmailText = (
  recipient: InvoiceRecipient,
  order: InvoiceOrder
): string => {
  const lines: string[] = [
    "LIRA — LUXURY STORE",
    "",
    `شكراً لشرائك، ${recipient.name}`,
    "سعدنا بخدمتك في متجر ليرا. تم استلام طلبك بنجاح.",
    "",
    `رقم الطلب: ${order.orderNumber}`,
    `تاريخ الطلب: ${formatDate(order.createdAt)}`,
    `حالة الطلب: ${STATUS_LABELS[order.orderStatus] ?? order.orderStatus}`,
    `طريقة الدفع: ${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}`,
    "",
    "المنتجات:",
    ...order.items.map((i) => {
      const variant = [i.size, i.color].filter(Boolean).join(" / ");
      return `  - ${i.name}${variant ? ` (${variant})` : ""} x${i.quantity} = ${money(
        i.subtotal
      )}`;
    }),
    "",
    `المجموع الفرعي: ${money(order.subtotal)}`,
    ...(Number(order.tax) > 0 ? [`الضريبة: ${money(order.tax)}`] : []),
    ...(Number(order.shippingCost) > 0
      ? [`الشحن: ${money(order.shippingCost)}`]
      : []),
    `الإجمالي: ${money(order.totalAmount)}`,
    "",
    "عنوان التوصيل:",
    `  ${order.shippingAddress.street}`,
    `  ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`,
    `  ${order.shippingAddress.phoneNumber}`,
    "",
    "شكراً لثقتك بلي را.",
  ];
  // Each plain-text line is its own bidi paragraph, so the base direction has
  // to be set per line rather than once for the document.
  return lines.map(bidi).join("\n");
};

export const invoiceEmailSubject = (order: InvoiceOrder): string =>
  bidi(`شكراً لشرائك — فاتورة طلبك ${order.orderNumber}`);
