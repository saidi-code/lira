// scripts/previewInvoice.ts
// ==========================================
// Dev-only harness for the invoice email.
//
// Renders the template with sample data, asserts the output is well formed,
// and optionally performs a real send. Excluded from the production build
// (see tsconfig.json) — it is a debugging tool, not application code.
//
//   npm run preview:invoice                  -> render + assert only
//   npm run preview:invoice -- you@mail.com  -> also send a real test email
// ==========================================
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { invoiceEmailHtml, invoiceEmailText, invoiceEmailSubject } from "../templates/invoiceEmail.js";
import { sendOrderInvoiceEmail } from "../services/invoiceEmailService.js";
import type { InvoiceOrder, InvoiceRecipient } from "../types/invoice.js";

const recipient: InvoiceRecipient = {
  name: "سارة بن عمار",
  email: "sara@example.com",
};

const order: InvoiceOrder = {
  orderNumber: "LR-2024-000123",
  items: [
    { name: "خاتم ذهب عيار 18 - تصميم كلاسيكي", image: "https://res.cloudinary.com/demo/image/upload/ring.jpg", price: 450.0, quantity: 1, size: null, color: "ذهبي", subtotal: 450.0 },
    { name: "قلادة لؤلؤ طبيعي", image: "https://res.cloudinary.com/demo/image/upload/necklace.jpg", price: 120.5, quantity: 2, size: "M", color: "فضي", subtotal: 241.0 },
  ],
  shippingAddress: { type: "Home", street: "شارع أبو بكر الصديق منزل عدد 2", city: "مدنين", state: "مدنين", zipCode: "4100", phoneNumber: "+216 40 444 336" },
  paymentMethod: "cash",
  paymentStatus: "pending",
  orderStatus: "placed",
  subtotal: 691.0,
  shippingCost: 7.0,
  tax: 19.35,
  totalAmount: 717.35,
  createdAt: new Date("2024-06-15T10:30:00Z"),
};

const html = invoiceEmailHtml(recipient, order);
const text = invoiceEmailText(recipient, order);
const subject = invoiceEmailSubject(order);

console.log("SUBJECT:", subject);
console.log("HTML length:", html.length);
console.log("TEXT length:", text.length);

// --- sanity assertions ---
const checks: Array<[string, boolean]> = [
  ["starts with <!DOCTYPE", html.trimStart().startsWith("<!DOCTYPE")],
  ["ends with </html>", html.trimEnd().endsWith("</html>")],
  ["has order number", html.includes("LR-2024-000123")],
  ["has both product names", html.includes("خاتم ذهب عيار 18") && html.includes("قلادة لؤلؤ طبيعي")],
  ["has total", html.includes("717.35")],
  ["has address city", html.includes("مدنين")],
  ["has recipient name", html.includes("سارة بن عمار")],
  ["no 'undefined'", !html.includes("undefined")],
  ["no 'NaN'", !html.includes("NaN")],
  ["no '[object Object]'", !html.includes("[object Object]")],
  ["no unclosed template junk", !html.includes("${")],
  ["table tags balanced", (html.match(/<tr/g) || []).length === (html.match(/<\/tr>/g) || []).length],
  ["td tags balanced", (html.match(/<td/g) || []).length === (html.match(/<\/td>/g) || []).length],
  ["text has order number", text.includes("LR-2024-000123")],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
}
console.log(failed === 0 ? "\nALL CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);

// Write artifacts to the OS temp dir so the script works on any platform
// (process.env.TEMP only exists on Windows).
const previewPath = join(tmpdir(), "invoice-preview.html");
const subjectPath = join(tmpdir(), "invoice-subject.txt");

writeFileSync(previewPath, html);
console.log("preview written to", previewPath);

// Verify the Arabic subject survives as real UTF-8 (console output above is
// mangled by the Windows codepage, so round-trip through a file instead).
writeFileSync(subjectPath, subject, "utf8");
console.log("subject utf8 bytes:", Buffer.from(subject, "utf8").length);
console.log("has arabic bytes  :", /[\u0600-\u06FF]/.test(subject));
console.log("has rtl marks      :", /[\u200E\u200F\u061C]/.test(subject));
console.log("meta charset utf-8 :", /charset=["']?utf-8/i.test(html));
console.log("dir=rtl in html    :", /dir=["']rtl["']/i.test(html));
console.log("lang=ar in html    :", /lang=["']ar/i.test(html));

// ---------- live transport test (opt-in) ----------
// Only runs when a real recipient is supplied, so it never emails anyone
// accidentally:  npm run preview:invoice -- you@example.com
const liveTo = process.argv[2];
if (liveTo) {
  console.log("\n--- sending live test to", liveTo, "---");
  const sent = await sendOrderInvoiceEmail(
    { name: recipient.name, email: liveTo } as InvoiceRecipient,
    order
  );
  console.log(sent ? "SEND OK" : "SEND FAILED (see server log above)");
} else {
  console.log("\n(tip: pass an address to test a real send)");
}