import net from 'node:net';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const SMTP_PORT = process.env.MAILHOG_SMTP_PORT || 1025;
const UI_PORT = process.env.MAILHOG_UI_PORT || 8025;
const CACHE_FILE = path.join(process.cwd(), 'cache', 'email_logs.json');

// In-memory MailHog message store
let mailhogMessages = [];

async function initMailHogStorage() {
  try {
    await fs.mkdir(path.join(process.cwd(), 'cache'), { recursive: true });
    const content = await fs.readFile(CACHE_FILE, 'utf-8');
    mailhogMessages = JSON.parse(content);
  } catch (err) {
    mailhogMessages = [];
  }
}

async function persistMailHogMessages() {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(mailhogMessages, null, 2), 'utf-8');
  } catch (err) {
    console.error('[MailHog Storage Error]', err.message);
  }
}

// -------------------------------------------------------------------
// 1. MailHog Local SMTP Server (Port 1025)
// -------------------------------------------------------------------
function startSmtpServer() {
  const server = net.createServer((socket) => {
    let state = 'CONNECTED';
    let currentMsg = {
      id: `mh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      from: '',
      to: [],
      raw: '',
      subject: '',
      html: '',
      text: '',
      headers: {}
    };

    socket.write('220 Avinya Care MailHog ESMTP Server Ready\r\n');

    socket.on('data', async (chunk) => {
      const lines = chunk.toString().split('\r\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (state === 'DATA_MODE') {
          if (line === '.') {
            state = 'CONNECTED';
            parseRawEmail(currentMsg);
            mailhogMessages.unshift(currentMsg);
            await persistMailHogMessages();
            console.log(`[MailHog SMTP] Received email from <${currentMsg.from}> to <${currentMsg.to.join(', ')}>: "${currentMsg.subject}"`);
            socket.write('250 2.0.0 OK : queued as ' + currentMsg.id + '\r\n');
          } else {
            currentMsg.raw += (line.startsWith('..') ? line.substring(1) : line) + '\r\n';
          }
          continue;
        }

        const cmd = line.trim().toUpperCase();
        if (cmd.startsWith('HELO') || cmd.startsWith('EHLO')) {
          socket.write('250-Avinya Care MailHog Server\r\n250-PIPELINING\r\n250-8BITMIME\r\n250 OK\r\n');
        } else if (cmd.startsWith('MAIL FROM:')) {
          const match = line.match(/MAIL FROM:\s*<([^>]+)>/i) || line.match(/MAIL FROM:\s*(\S+)/i);
          currentMsg.from = match ? match[1] : line.replace(/MAIL FROM:/i, '').trim();
          socket.write('250 2.1.0 Sender OK\r\n');
        } else if (cmd.startsWith('RCPT TO:')) {
          const match = line.match(/RCPT TO:\s*<([^>]+)>/i) || line.match(/RCPT TO:\s*(\S+)/i);
          const recipient = match ? match[1] : line.replace(/RCPT TO:/i, '').trim();
          currentMsg.to.push(recipient);
          socket.write('250 2.1.5 Recipient OK\r\n');
        } else if (cmd === 'DATA') {
          state = 'DATA_MODE';
          socket.write('354 Start mail input; end with <CR><LF>.<CR><LF>\r\n');
        } else if (cmd === 'QUIT') {
          socket.write('221 2.0.0 Goodbye\r\n');
          socket.end();
        } else if (cmd === 'RSET') {
          state = 'CONNECTED';
          currentMsg = { id: `mh-${Date.now()}`, timestamp: new Date().toISOString(), from: '', to: [], raw: '', subject: '', html: '', text: '', headers: {} };
          socket.write('250 2.0.0 OK\r\n');
        } else if (cmd.length > 0) {
          socket.write('250 OK\r\n');
        }
      }
    });
  });

  server.listen(SMTP_PORT, () => {
    console.log(`[MailHog SMTP] Listening on smtp://127.0.0.1:${SMTP_PORT}`);
  });
}

function parseRawEmail(msg) {
  const parts = msg.raw.split(/\r?\n\r?\n/);
  const headerLines = parts[0] ? parts[0].split(/\r?\n/) : [];
  const body = parts.slice(1).join('\n\n');

  headerLines.forEach((h) => {
    const colonIdx = h.indexOf(':');
    if (colonIdx > 0) {
      const key = h.substring(0, colonIdx).trim().toLowerCase();
      const val = h.substring(colonIdx + 1).trim();
      msg.headers[key] = val;
      if (key === 'subject') msg.subject = val;
      if (key === 'from' && !msg.from) msg.from = val;
      if (key === 'to' && msg.to.length === 0) msg.to = [val];
    }
  });

  if (body.includes('<html') || body.includes('<body') || body.includes('<!DOCTYPE')) {
    msg.html = body;
    msg.text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  } else {
    msg.text = body;
    msg.html = `<pre style="font-family: monospace; white-space: pre-wrap;">${escapeHtml(body)}</pre>`;
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// -------------------------------------------------------------------
// 2. MailHog Web Dashboard UI & REST API (Port 8025)
// -------------------------------------------------------------------
function startWebDashboard() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/v1/messages' || url.pathname === '/api/v2/messages') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mailhogMessages));
      return;
    }

    if (url.pathname === '/api/v1/clean' || url.pathname === '/api/v1/delete/all') {
      mailhogMessages = [];
      persistMailHogMessages();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', cleared: true }));
      return;
    }

    if (url.pathname.startsWith('/api/v1/messages/')) {
      const id = url.pathname.replace('/api/v1/messages/', '');
      const found = mailhogMessages.find((m) => m.id === id);
      if (found) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(found));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Message not found' }));
      }
      return;
    }

    // Render Web UI Dashboard
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getMailHogHtml());
  });

  server.listen(UI_PORT, () => {
    console.log(`[MailHog Web UI] Listening on http://localhost:${UI_PORT}`);
  });
}

function getMailHogHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MailHog - Avinya Care Local Email Testing</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0F172A;
      --bg-card: #1E293B;
      --bg-hover: #334155;
      --teal-primary: #087F73;
      --teal-accent: #14B8A6;
      --text-main: #F8FAFC;
      --text-muted: #94A3B8;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: var(--bg-dark); color: var(--text-main); height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    
    header { background: #0B0F19; border-bottom: 1px solid var(--border); padding: 0.9rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.25rem; color: var(--teal-accent); }
    .brand-tag { background: rgba(20, 184, 166, 0.15); color: var(--teal-accent); font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 9999px; border: 1px solid rgba(20, 184, 166, 0.3); }
    
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .btn { background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border); padding: 0.45rem 0.9rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { background: var(--bg-hover); }
    .btn-danger { background: rgba(239, 68, 68, 0.15); color: #EF4444; border-color: rgba(239, 68, 68, 0.3); }
    .btn-danger:hover { background: rgba(239, 68, 68, 0.25); }

    .main-layout { display: flex; flex: 1; overflow: hidden; }
    .sidebar { width: 380px; background: #0F172A; border-right: 1px solid var(--border); display: flex; flex-direction: column; }
    .search-box { padding: 1rem; border-bottom: 1px solid var(--border); }
    .search-input { width: 100%; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main); padding: 0.6rem 0.9rem; border-radius: 8px; font-family: inherit; font-size: 0.85rem; outline: none; }
    .search-input:focus { border-color: var(--teal-accent); }

    .email-list { flex: 1; overflow-y: auto; }
    .email-item { padding: 1rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s ease; }
    .email-item:hover { background: var(--bg-card); }
    .email-item.active { background: rgba(20, 184, 166, 0.12); border-left: 4px solid var(--teal-accent); }
    .email-subject { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.35rem; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .email-meta { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); }

    .preview-panel { flex: 1; display: flex; flex-direction: column; background: #1E293B; overflow: hidden; }
    .preview-header { padding: 1.25rem 1.75rem; border-bottom: 1px solid var(--border); background: #0B0F19; }
    .preview-title { font-size: 1.3rem; font-weight: 800; margin-bottom: 0.75rem; color: #FFFFFF; }
    .preview-info { display: flex; gap: 2rem; font-size: 0.85rem; color: var(--text-muted); }
    .preview-info span strong { color: var(--text-main); }

    .tab-bar { display: flex; gap: 4px; padding: 0 1.75rem; background: #0B0F19; border-bottom: 1px solid var(--border); }
    .tab-btn { padding: 0.75rem 1.25rem; font-weight: 600; font-size: 0.85rem; color: var(--text-muted); background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab-btn.active { color: var(--teal-accent); border-bottom-color: var(--teal-accent); }

    .preview-body { flex: 1; overflow: auto; padding: 1.5rem; }
    .iframe-box { width: 100%; height: 100%; border: none; background: #FFFFFF; border-radius: 12px; }
    .raw-box { font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: #38BDF8; white-space: pre-wrap; word-break: break-all; }

    .empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 1rem; text-align: center; }
    .empty-icon { font-size: 3rem; opacity: 0.5; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span>🐷 MailHog</span>
      <span class="brand-tag">Avinya SMTP 1025</span>
    </div>
    <div class="header-actions">
      <button class="btn" onclick="fetchMessages()"><span>🔄 Refresh</span></button>
      <button class="btn btn-danger" onclick="clearMessages()"><span>🗑 Clear Inbox</span></button>
    </div>
  </header>

  <div class="main-layout">
    <aside class="sidebar">
      <div class="search-box">
        <input type="text" id="search-input" class="search-input" placeholder="Search emails by recipient or subject..." oninput="filterMessages()">
      </div>
      <div class="email-list" id="email-list">
        <!-- Dynamic email items rendered via JS -->
      </div>
    </aside>

    <main class="preview-panel" id="preview-panel">
      <div class="empty-state">
        <div class="empty-icon">📫</div>
        <h3>Select an email to view contents</h3>
        <p>Emails sent to <code>localhost:1025</code> via SMTP will appear here live.</p>
      </div>
    </main>
  </div>

  <script>
    let messages = [];
    let activeMsgId = null;

    async function fetchMessages() {
      try {
        const res = await fetch('/api/v1/messages');
        messages = await res.json();
        renderList();
        if (activeMsgId) renderPreview(activeMsgId);
      } catch (err) {
        console.error('Failed to load MailHog messages:', err);
      }
    }

    async function clearMessages() {
      if (!confirm('Clear all stored emails?')) return;
      await fetch('/api/v1/clean');
      messages = [];
      activeMsgId = null;
      renderList();
      renderEmptyState();
    }

    function renderList() {
      const container = document.getElementById('email-list');
      const query = (document.getElementById('search-input').value || '').toLowerCase();
      const filtered = messages.filter(m => 
        (m.subject || '').toLowerCase().includes(query) || 
        (m.from || '').toLowerCase().includes(query) || 
        (m.to || []).join(' ').toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No messages found</div>';
        return;
      }

      container.innerHTML = filtered.map(m => \`
        <div class="email-item \${m.id === activeMsgId ? 'active' : ''}" onclick="selectMessage('\${m.id}')">
          <div class="email-subject">\${escapeHtml(m.subject || 'No Subject')}</div>
          <div class="email-meta">
            <span>\${escapeHtml(m.to?.[0] || 'Unknown')}</span>
            <span>\${new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>
      \`).join('');
    }

    function selectMessage(id) {
      activeMsgId = id;
      renderList();
      renderPreview(id);
    }

    function renderPreview(id) {
      const msg = messages.find(m => m.id === id);
      if (!msg) return renderEmptyState();

      const panel = document.getElementById('preview-panel');
      panel.innerHTML = \`
        <div class="preview-header">
          <h2 class="preview-title">\${escapeHtml(msg.subject || 'No Subject')}</h2>
          <div class="preview-info">
            <span>From: <strong>\${escapeHtml(msg.from)}</strong></span>
            <span>To: <strong>\${escapeHtml(msg.to.join(', '))}</strong></span>
            <span>Time: <strong>\${new Date(msg.timestamp).toLocaleString()}</strong></span>
          </div>
        </div>
        <div class="tab-bar">
          <button class="tab-btn active" onclick="showTab('html', this)">HTML Render</button>
          <button class="tab-btn" onclick="showTab('text', this)">Plain Text</button>
          <button class="tab-btn" onclick="showTab('raw', this)">Raw SMTP Source</button>
        </div>
        <div class="preview-body" id="tab-container">
          <iframe id="html-frame" class="iframe-box"></iframe>
        </div>
      \`;

      const frame = document.getElementById('html-frame');
      frame.contentWindow.document.open();
      frame.contentWindow.document.write(msg.html || \`<pre>\${escapeHtml(msg.text)}</pre>\`);
      frame.contentWindow.document.close();
      window.currentActiveMsg = msg;
    }

    function showTab(type, btn) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const container = document.getElementById('tab-container');
      const msg = window.currentActiveMsg;
      if (!msg) return;

      if (type === 'html') {
        container.innerHTML = '<iframe id="html-frame" class="iframe-box"></iframe>';
        const frame = document.getElementById('html-frame');
        frame.contentWindow.document.open();
        frame.contentWindow.document.write(msg.html || \`<pre>\${escapeHtml(msg.text)}</pre>\`);
        frame.contentWindow.document.close();
      } else if (type === 'text') {
        container.innerHTML = \`<pre style="font-family: 'Inter', sans-serif; white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6; color: var(--text-main); background: var(--bg-card); padding: 1.5rem; border-radius: 12px;">\${escapeHtml(msg.text)}</pre>\`;
      } else if (type === 'raw') {
        container.innerHTML = \`<pre class="raw-box">\${escapeHtml(msg.raw || JSON.stringify(msg, null, 2))}</pre>\`;
      }
    }

    function renderEmptyState() {
      document.getElementById('preview-panel').innerHTML = \`
        <div class="empty-state">
          <div class="empty-icon">📫</div>
          <h3>Select an email to view contents</h3>
          <p>Emails sent to <code>localhost:1025</code> via SMTP will appear here live.</p>
        </div>
      \`;
    }

    function filterMessages() { renderList(); }
    function escapeHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    fetchMessages();
    setInterval(fetchMessages, 3000);
  </script>
</body>
</html>`;
}

export async function startMailHogServer() {
  await initMailHogStorage();
  startSmtpServer();
  startWebDashboard();
}
