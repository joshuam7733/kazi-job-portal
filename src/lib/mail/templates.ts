import { absoluteUrl } from "@/lib/utils";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Minimal, accessible transactional email layout. */
export function layout(opts: { heading: string; body: string; cta?: { label: string; href: string }; footer?: string }) {
  const href = opts.cta ? (opts.cta.href.startsWith("http") ? opts.cta.href : absoluteUrl(opts.cta.href)) : "";
  const html = `<!doctype html><html><body style="margin:0;background:#F6F7F4;font-family:Segoe UI,Arial,sans-serif;color:#0F1B2D">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border:1px solid #E1E5DF;border-radius:14px">
<tr><td style="padding:28px 32px 8px;font-size:20px;font-weight:700">kazi<span style="color:#0E7C58">.</span></td></tr>
<tr><td style="padding:8px 32px 0;font-size:22px;font-weight:700;line-height:1.3">${escapeHtml(opts.heading)}</td></tr>
<tr><td style="padding:12px 32px 0;font-size:15px;line-height:1.6;color:#334155">${escapeHtml(opts.body).replace(/\n/g, "<br>")}</td></tr>
${opts.cta ? `<tr><td style="padding:24px 32px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#0F1B2D;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${escapeHtml(opts.cta.label)}</a></td></tr>` : ""}
<tr><td style="padding:28px 32px 28px;font-size:12px;color:#566170">${escapeHtml(opts.footer ?? "You're receiving this because you have an account on KAZI Job Portal. Manage email preferences in Settings.")}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${opts.heading}\n\n${opts.body}${opts.cta ? `\n\n${opts.cta.label}: ${href}` : ""}`;
  return { html, text };
}
