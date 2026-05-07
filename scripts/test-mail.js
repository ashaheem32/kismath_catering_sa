// =============================================================
// scripts/test-mail.js
// Sends a test email using the credentials from .env.
// Use this to confirm your SMTP setup works before deploying.
//
// Run:  node scripts/test-mail.js
// =============================================================

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import nodemailer from 'nodemailer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env');

async function loadEnv(path) {
  try {
    const raw = await readFile(path, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch (err) {
    console.warn(`Could not read ${path} (${err.code}). Using existing process.env.`);
  }
}

await loadEnv(ENV_PATH);

const SMTP_USER = (process.env.SMTP_USER || '').trim();
const SMTP_PASS = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
const TO_EMAIL  = (process.env.TO_EMAIL  || SMTP_USER).trim();

if (!SMTP_USER || !SMTP_PASS) {
  console.error('SMTP_USER / SMTP_PASS missing from .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

console.log(`Verifying SMTP connection to Gmail as ${SMTP_USER}…`);
try {
  await transporter.verify();
  console.log('SMTP connection OK. Sending test email…');
  const info = await transporter.sendMail({
    from: `"Kismath Test" <${SMTP_USER}>`,
    to: TO_EMAIL,
    subject: 'SMTP test — Kismath Catering',
    text: 'If you can read this, your contact form will work.\n\n— Sent from scripts/test-mail.js',
  });
  console.log('Sent!', info.messageId, '→', TO_EMAIL);
} catch (err) {
  console.error('FAILED:', err.code || '', err.message);
  if (err.response) console.error('SMTP response:', err.response);
  process.exit(1);
}
