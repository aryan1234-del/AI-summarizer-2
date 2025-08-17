// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios').default;
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '4mb' }));

// ---------- AI Summarization (Groq) ----------
async function summarizeWithGroq(text, prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY missing in .env');
  }
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  const userPrompt = [
    'You are a helpful meeting notes assistant.',
    'Return a clean, structured Markdown summary with sections:',
    '1) TL;DR  2) Key Points  3) Action Items (owners & deadlines)  4) Risks/Blocks  5) Next Steps',
    'Be concise and faithful to the transcript.',
    prompt ? `Custom instruction: "${prompt}"` : ''
  ].filter(Boolean).join('\n');

  const res = await axios.post(
    url,
    {
      model,
      messages: [
        { role: 'system', content: 'You are a world-class summarizer.' },
        { role: 'user', content: `${userPrompt}\n\nTranscript:\n${text}` }
      ],
      temperature: 0.2
    },
    { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
  );

  const out = res.data?.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error('No summary returned from Groq');
  return out;
}

// ---------- Email (SMTP via Nodemailer) ----------
async function sendEmail({ to, subject, html, text }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true', // true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.verify();

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject: subject || 'Meeting Summary',
    text: text,
    html: html
  });

  return info.messageId;
}

// ---------- Routes ----------
app.get('/', (_, res) => res.json({ ok: true, message: 'AI Summarizer backend running.' }));

app.post('/summarize', async (req, res) => {
  try {
    const { text, prompt } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Missing "text" in request body' });
    }
    const summary = await summarizeWithGroq(text, prompt);
    res.json({ summary });
  } catch (err) {
    console.error('Summarize error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to summarize. ' + (err?.response?.data?.error?.message || err.message) });
  }
});

app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body || {};
    if (!to) return res.status(400).json({ error: 'Missing "to" email' });

    const id = await sendEmail({ to, subject, html, text });
    res.json({ ok: true, messageId: id });
  } catch (err) {
    console.error('Email error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send email. ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
