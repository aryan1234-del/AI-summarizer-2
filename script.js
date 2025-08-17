// Simple frontend to connect with backend API
const fileInput = document.getElementById('fileInput');
const textInput = document.getElementById('textInput');
const promptInput = document.getElementById('promptInput');
const summaryBox = document.getElementById('summaryBox');
const summarizeBtn = document.getElementById('summarizeBtn');
const apiBase = document.getElementById('apiBase');
const statusEl = document.getElementById('status');
const emailStatusEl = document.getElementById('emailStatus');
const sendBtn = document.getElementById('sendBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const emailTo = document.getElementById('emailTo');
const emailSubject = document.getElementById('emailSubject');

function setStatus(msg){ statusEl.textContent = msg || ''; }
function setEmailStatus(msg){ emailStatusEl.textContent = msg || ''; }

function readFileAsText(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function getTranscriptText(){
  if (fileInput.files && fileInput.files[0]) {
    return await readFileAsText(fileInput.files[0]);
  }
  return textInput.value || '';
}

async function generateSummary(){
  setStatus('Generating summary...');
  summarizeBtn.disabled = true;
  try {
    const text = await getTranscriptText();
    if (!text.trim()) {
      setStatus('Please provide a transcript (upload file or paste text).');
      return;
    }
    const prompt = promptInput.value.trim();
    const res = await fetch(`${apiBase.value}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, prompt })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to summarize');
    summaryBox.value = data.summary || '';
    setStatus('Done.');
  } catch (err) {
    console.error(err);
    setStatus('Error: ' + err.message);
  } finally {
    summarizeBtn.disabled = false;
  }
}

async function sendEmail(){
  setEmailStatus('Sending email...');
  sendBtn.disabled = true;
  try {
    const to = emailTo.value.trim();
    if (!to) { setEmailStatus('Please enter recipient email.'); return; }
    const subject = emailSubject.value.trim() || 'Meeting Summary';
    const html = `<h2>Meeting Summary</h2><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(summaryBox.value)}</pre>`;

    const res = await fetch(`${apiBase.value}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to send email');
    setEmailStatus('Email sent ✅');
  } catch (err) {
    console.error(err);
    setEmailStatus('Error: ' + err.message);
  } finally {
    sendBtn.disabled = false;
  }
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, (m) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
}

copyBtn.addEventListener('click', async () => {
  try{
    await navigator.clipboard.writeText(summaryBox.value);
    setStatus('Copied to clipboard.');
  } catch {
    setStatus('Copy failed.');
  }
});

clearBtn.addEventListener('click', () => {
  summaryBox.value = '';
  setStatus('');
});

summarizeBtn.addEventListener('click', generateSummary);
sendBtn.addEventListener('click', sendEmail);
