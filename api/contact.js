// =============================================================
// /api/contact.js — Vercel serverless function
//
// Receives JSON from the contact form and sends an email via
// Gmail SMTP using credentials from environment variables.
//
// Local dev:   `vercel dev` reads from .env automatically.
// Production:  add the same vars in Vercel → Project → Settings
//              → Environment Variables, then redeploy.
// =============================================================

import nodemailer from 'nodemailer';

const MAX_LEN = {
  name: 120,
  phone: 40,
  event: 80,
  date: 40,
  message: 4000,
};

const escape = (s) =>
  String(s ?? '')
    .replace(/[\r\n\t]+/g, ' ')   // strip CR/LF — prevents header injection
    .trim();

export default async function handler(req, res) {
  // CORS preflight (only matters if you embed the form on another domain)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Vercel auto-parses application/json bodies.
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // Honeypot — bots fill the hidden field, humans don't.
  if (body._honey) return res.status(200).json({ ok: true });

  const fields = {
    name:    escape(body.name),
    phone:   escape(body.phone),
    event:   escape(body.event),
    date:    escape(body.date),
    message: String(body.message ?? '').trim(),
  };

  if (!fields.name || !fields.phone) {
    return res.status(400).json({ ok: false, error: 'Name and phone are required.' });
  }
  for (const [k, max] of Object.entries(MAX_LEN)) {
    if (fields[k].length > max) {
      return res.status(400).json({ ok: false, error: 'Submission too large.' });
    }
  }

  // ---------- Read env config ----------
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  const SMTP_USER = (process.env.SMTP_USER || '').trim();
  // Gmail displays App Passwords with spaces ("xxxx xxxx xxxx xxxx") —
  // strip them so SMTP receives the 16-char string it expects.
  const SMTP_PASS = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const TO_EMAIL  = (process.env.TO_EMAIL  || SMTP_USER).trim();

  if (!SMTP_USER || !SMTP_PASS) {
    console.error('[contact] SMTP_USER / SMTP_PASS env vars missing');
    return res.status(500).json({ ok: false, error: 'Server is not configured to send mail.' });
  }

  // ---------- Build transport ----------
  // For Gmail we use the service shortcut — nodemailer picks the right
  // host/port and timeouts. For anything else we use explicit host/port.
  const isGmail = /gmail\.com$/i.test(SMTP_HOST) || /gmail/i.test(SMTP_HOST);
  const transporter = nodemailer.createTransport(
    isGmail
      ? {
          service: 'gmail',
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        }
      : {
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_PORT === 465,
          requireTLS: SMTP_PORT === 587,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        }
  );

  // ---------- Compose email ----------
  const text = [
    'You have a new catering inquiry from the Kismath website.',
    '',
    `Name      : ${fields.name}`,
    `Phone     : ${fields.phone}`,
    `Event     : ${fields.event || '—'}`,
    `Date      : ${fields.date  || '—'}`,
    '',
    'Message:',
    fields.message || '(none)',
    '',
    '—',
    'Sent automatically from kismathcatering.sa',
  ].join('\n');

  // Escape user-provided text for HTML.
  const esc = (s) =>
    String(s ?? '').replace(/[<>&"']/g, (c) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c])
    );

  // Brand palette
  // cream         #F5F0E8   (page bg)
  // cream-light   #FBF7EE   (card bg — slightly lighter for contrast)
  // maroon        #7A1B1B   (primary text + accents)
  // gold          #C9A961   (divider rule, ornament)
  const row = (label, value) => `
    <tr>
      <td style="padding:14px 0;width:96px;color:rgba(122,27,27,0.55);font-size:11px;letter-spacing:1.6px;text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif;vertical-align:top;border-bottom:1px solid rgba(122,27,27,0.08);">${label}</td>
      <td style="padding:14px 0;font-size:16px;color:#7A1B1B;font-family:Georgia,'Times New Roman',serif;border-bottom:1px solid rgba(122,27,27,0.08);">${value}</td>
    </tr>`;

  const html = `
    <div style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#F5F0E8;">
        <tr>
          <td align="center" style="padding:36px 12px;">

            <!-- Card -->
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                   style="border-collapse:collapse;background:#FBF7EE;border:1px solid rgba(122,27,27,0.12);max-width:600px;width:100%;">

              <!-- Top maroon accent bar -->
              <tr><td style="background:#7A1B1B;height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>

              <!-- Header -->
              <tr>
                <td style="padding:48px 56px 8px;text-align:center;">
                  <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(122,27,27,0.6);">Kismath Catering</p>
                  <h1 style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:28px;color:#7A1B1B;letter-spacing:0.3px;">New Catering Inquiry</h1>
                  <!-- Gold ornament rule -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto 0;">
                    <tr>
                      <td style="width:40px;height:1px;background:#C9A961;font-size:0;line-height:0;">&nbsp;</td>
                      <td style="padding:0 10px;color:#C9A961;font-size:14px;font-family:Georgia,serif;">&#10022;</td>
                      <td style="width:40px;height:1px;background:#C9A961;font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                  <p style="margin:18px 0 0;font-style:italic;color:rgba(122,27,27,0.65);font-size:14px;">A new guest has reached out from your website.</p>
                </td>
              </tr>

              <!-- Details -->
              <tr>
                <td style="padding:28px 56px 8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;">
                    ${row('Name',  `<strong style="font-weight:600;">${esc(fields.name)}</strong>`)}
                    ${row('Phone', `<a href="tel:${esc(fields.phone)}" style="color:#7A1B1B;text-decoration:none;border-bottom:1px dotted rgba(122,27,27,0.4);">${esc(fields.phone)}</a>`)}
                    ${row('Event', esc(fields.event) || '<span style="color:rgba(122,27,27,0.4)">&mdash;</span>')}
                    ${row('Date',  esc(fields.date)  || '<span style="color:rgba(122,27,27,0.4)">&mdash;</span>')}
                  </table>
                </td>
              </tr>

              <!-- Message -->
              <tr>
                <td style="padding:24px 56px 8px;">
                  <p style="margin:0 0 10px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(122,27,27,0.55);">Message</p>
                  <div style="background:#F5F0E8;border-left:3px solid #C9A961;padding:18px 22px;font-size:15px;line-height:1.75;color:#7A1B1B;font-family:Georgia,'Times New Roman',serif;white-space:pre-wrap;">${esc(fields.message) || '<em style="color:rgba(122,27,27,0.45)">No message provided.</em>'}</div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:36px 56px 44px;text-align:center;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 16px;">
                    <tr>
                      <td style="width:30px;height:1px;background:rgba(122,27,27,0.25);font-size:0;line-height:0;">&nbsp;</td>
                      <td style="padding:0 10px;color:rgba(122,27,27,0.35);font-size:11px;">&bull;</td>
                      <td style="width:30px;height:1px;background:rgba(122,27,27,0.25);font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                  <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(122,27,27,0.45);">Sent from kismath.sa &middot; Reply directly to respond</p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </div>
  `;

  // ---------- Send ----------
  try {
    const info = await transporter.sendMail({
      from: `"Kismath Website" <${SMTP_USER}>`,
      to: TO_EMAIL,
      replyTo: SMTP_USER,
      subject: `New catering inquiry — ${fields.name}`,
      text,
      html,
    });
    console.log('[contact] sent', info.messageId, 'to', TO_EMAIL);
    return res.status(200).json({ ok: true });
  } catch (err) {
    // Verbose log so you can read it in Vercel → Functions → Logs
    console.error('[contact] sendMail failed', {
      code: err.code,
      command: err.command,
      response: err.response,
      message: err.message,
    });
    return res
      .status(500)
      .json({ ok: false, error: 'Could not send your inquiry. Please try WhatsApp.' });
  }
}
