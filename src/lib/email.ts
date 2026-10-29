import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "./db";
import { APP_NAME, APP_URL, COMPANY, emailConfigured } from "./config";

let transporter: Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

/** Sends an email (or logs it when SMTP isn't configured). Never throws. Returns true when delivered or logged. */
export async function sendMail(to: string | string[], subject: string, html: string): Promise<boolean> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return false;
  const toLine = recipients.join(", ");
  try {
    if (emailConfigured()) {
      await getTransporter().sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: toLine, subject, html });
      await db.emailLog.create({ data: { to: toLine, subject, status: "SENT" } });
    } else {
      console.info(`[email:dev] To: ${toLine}\n  Subject: ${subject}`);
      await db.emailLog.create({ data: { to: toLine, subject, status: "LOGGED" } });
    }
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] failed:", message);
    await db.emailLog.create({ data: { to: toLine, subject, status: "FAILED", error: message.slice(0, 500) } }).catch(() => {});
    return false;
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Row = [label: string, value: string];

/** Warm-editorial email shell matching the portal styling. */
export function emailLayout(opts: { eyebrow: string; title: string; intro: string; rows?: Row[]; note?: string; cta?: { label: string; path: string } }) {
  const rows = (opts.rows ?? [])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;color:#6e695f;font-size:13px;width:150px;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;color:#1c1c19;font-size:14px;font-weight:600">${esc(v)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f1ec;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;color:#1c1c19">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4dec3;border-radius:16px;padding:32px">
<tr><td style="padding-bottom:24px"><img src="${APP_URL}/legacy-media-logo-dark.png" alt="${esc(COMPANY)}" height="28" style="height:28px;width:auto;border:0;vertical-align:middle"> <span style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#795915;padding-left:10px;vertical-align:middle">Leave</span></td></tr>
<tr><td style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#795915;padding-bottom:6px">${esc(opts.eyebrow)}</td></tr>
<tr><td style="font-size:22px;font-weight:600;letter-spacing:-0.015em;padding-bottom:12px">${esc(opts.title)}</td></tr>
<tr><td style="font-size:15px;line-height:24px;color:#444748;padding-bottom:16px">${esc(opts.intro)}</td></tr>
${rows ? `<tr><td style="border-top:1px solid #f0ede8;border-bottom:1px solid #f0ede8;padding:8px 0"><table role="presentation" width="100%">${rows}</table></td></tr>` : ""}
${opts.note ? `<tr><td style="padding-top:16px"><div style="background:#faf5eb;border-radius:8px;padding:12px 16px;font-size:13px;color:#5e4200;font-style:italic">&ldquo;${esc(opts.note)}&rdquo;</div></td></tr>` : ""}
${opts.cta ? `<tr><td style="padding-top:24px"><a href="${APP_URL}${opts.cta.path}" style="display:inline-block;background:#121212;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 22px;border-radius:8px">${esc(opts.cta.label)} &rarr;</a></td></tr>` : ""}
<tr><td style="padding-top:28px;font-size:12px;color:#6e695f">Sent automatically by ${esc(APP_NAME)}.</td></tr>
</table></td></tr></table></body></html>`;
}
