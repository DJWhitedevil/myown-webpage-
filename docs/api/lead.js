const nodemailer = require('nodemailer');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseHeaders(extraHeaders = {}) {
  return {
    apikey: supabaseServiceRoleKey,
    Authorization: `Bearer ${supabaseServiceRoleKey}`,
    ...extraHeaders
  };
}

async function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization || '';
  const accessToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  if (!accessToken) return null;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) return null;
  return response.json();
}

async function saveLead(lead) {
  const response = await fetch(`${supabaseUrl}/rest/v1/leads`, {
    method: 'POST',
    headers: getSupabaseHeaders({
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    }),
    body: JSON.stringify(lead)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase lead insert failed: ${response.status} ${details}`);
  }
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseJsonSafe(body) {
  if (!body) return null;
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch (e) {
    return null;
  }
}

function getSmtpConfigFromEnv() {
  return {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };
}

function getRecipient() {
  return process.env.EMAIL_TO || process.env.RECIPIENT_EMAIL || process.env.TO_EMAIL;
}

function getFrom() {
  return process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER || 'no-reply@example.com';
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return res.status(503).json({ error: 'Lead service is not configured' });
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Please sign in before submitting a request' });
    }

    const body = parseJsonSafe(req.body) || parseJsonSafe(req);
    if (!body) return res.status(400).json({ error: 'Invalid JSON payload' });

    const name = String((body.name || '').trim());
    const email = String((body.email || '').trim());
    const phone = String((body.phone || '').trim());
    const projectType = String((body.projectType || '').trim());
    const message = String((body.message || '').trim());

    if (!name || name.length > 100 || !email || email.length > 254 || !phone || phone.length > 40 ||
      !projectType || projectType.length > 100 || !message || message.length > 4000) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Basic email validation
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const lead = {
      name,
      email: email.toLowerCase(),
      phone,
      projectType,
      message,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    await saveLead(lead);

    const recipient = getRecipient();
    const smtpCfg = getSmtpConfigFromEnv();

    // Supabase is the required backend. Email notification is optional.
    if (recipient && smtpCfg.host && smtpCfg.auth.user && smtpCfg.auth.pass) {
      const transporter = nodemailer.createTransport(smtpCfg);
      const html = `
        <h2>New Lead</h2>
        <table cellpadding="6">
          <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${escapeHtml(phone)}</td></tr>
          <tr><td><strong>Project Type</strong></td><td>${escapeHtml(projectType)}</td></tr>
          <tr><td><strong>Message</strong></td><td>${escapeHtml(message)}</td></tr>
          <tr><td><strong>Received At</strong></td><td>${lead.created_at}</td></tr>
        </table>
      `;

      await transporter.sendMail({
        from: getFrom(),
        to: recipient,
        subject: `Website Lead: ${name} — ${projectType}`,
        text: `${name} (${email}, ${phone})\n\n${message}`,
        html
      });
    }

    // Respond success — do NOT rely on local filesystem in serverless environment
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('/api/lead error:', err && err.message ? err.message : err);
    // Avoid leaking internal error details to clients
    return res.status(500).json({ error: 'Could not process lead at this time' });
  }
};
