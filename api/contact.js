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
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load the letterhead background once per cold start.
// The image already contains the Kismath header and "Thank You" footer,
// so the email body only needs to render the inquiry details in the middle.
// Anchored to this file so it resolves the same way under `vercel dev`,
// the local dev-server, and the deployed serverless function.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BG_PATH = path.resolve(__dirname, '..', 'images', 'kismath_email_bg.png');
let BG_BUFFER = null;
try {
  BG_BUFFER = fs.readFileSync(BG_PATH);
} catch (e) {
  console.warn('[contact] background image not found at', BG_PATH, '— falling back to plain template');
}
const BG_CID = 'kismath-email-bg';

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
  // cream-light   #F8EFDB   (card bg — matches the paper tone in the letterhead)
  // maroon        #7A1B1B   (primary text + accents)
  //
  // Layout strategy:
  //   The letterhead PNG (kismath_email_bg.png) is 800×1200 with decorative
  //   art baked in at the top (Kismath / CATERING / A TASTE OF HERITAGE) and
  //   bottom (Thank You / KISMATH CATERING · kismath.live). The middle of the
  //   image is blank cream paper.
  //
  //   Instead of using the image as one fixed-height full-bleed background
  //   (which makes a long Message overlap the footer art), the card is split
  //   into three rows:
  //
  //     1) Top band  — fixed 240px, background-position:top    crops to header
  //     2) Middle    — flexible height, plain cream paper, holds all content
  //     3) Bottom band — fixed 200px, background-position:bottom crops to footer
  //
  //   The same source image is used for both bands, just positioned to expose
  //   only the relevant slice of the 900px-tall scaled image (600×900).
  const bgUrl = BG_BUFFER ? `cid:${BG_CID}` : null;
  const row = (label, value) => `
    <tr>
      <td style="padding:12px 0;width:88px;color:rgba(122,27,27,0.6);font-size:11px;letter-spacing:1.6px;text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif;vertical-align:top;border-bottom:1px solid rgba(122,27,27,0.10);">${label}</td>
      <td style="padding:12px 0;font-size:15px;color:#7A1B1B;font-family:Georgia,'Times New Roman',serif;border-bottom:1px solid rgba(122,27,27,0.10);">${value}</td>
    </tr>`;

  const bandStyle = (position) =>
    bgUrl
      ? `background-color:#F8EFDB;background-image:url('${bgUrl}');background-repeat:no-repeat;background-position:${position} center;background-size:600px 900px;`
      : `background-color:#F8EFDB;`;
  const bandAttr = bgUrl ? `background="${bgUrl}" ` : '';

  const html = `
    <div style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#F5F0E8;">
        <tr>
          <td align="center" style="padding:36px 12px;">

            <!-- Card: three rows so content can grow without overlapping artwork -->
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                   style="border-collapse:collapse;background:#F8EFDB;max-width:600px;width:100%;">

              <!-- Top band — header artwork (crops the image to its top 240px) -->
              <tr>
                <td ${bandAttr}width="600" height="240" style="height:240px;line-height:240px;font-size:0;${bandStyle('top')}">&nbsp;</td>
              </tr>

              <!-- Middle band — flexible cream paper, holds all inquiry content -->
              <tr>
                <td style="background:#F8EFDB;padding:8px 72px 24px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;">
                    ${row('Message', `<span style="white-space:pre-wrap;word-wrap:break-word;overflow-wrap:break-word;">${esc(fields.message) || '<em style="color:rgba(122,27,27,0.45)">No message provided.</em>'}</span>`)}
                    ${row('Name',  `<strong style="font-weight:600;">${esc(fields.name)}</strong>`)}
                    ${row('Phone', `<a href="tel:${esc(fields.phone)}" style="color:#7A1B1B;text-decoration:none;border-bottom:1px dotted rgba(122,27,27,0.4);">${esc(fields.phone)}</a>`)}
                    ${row('Event', esc(fields.event) || '<span style="color:rgba(122,27,27,0.4)">&mdash;</span>')}
                    ${row('Date',  esc(fields.date)  || '<span style="color:rgba(122,27,27,0.4)">&mdash;</span>')}
                  </table>
                </td>
              </tr>

              <!-- Bottom band — footer artwork (crops the image to its bottom 200px) -->
              <tr>
                <td ${bandAttr}width="600" height="200" style="height:200px;line-height:200px;font-size:0;${bandStyle('bottom')}">&nbsp;</td>
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
      attachments: BG_BUFFER
        ? [
            {
              filename: 'kismath_email_bg.png',
              content: BG_BUFFER,
              cid: BG_CID,
              contentType: 'image/png',
              contentDisposition: 'inline',
            },
          ]
        : [],
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
