import net from 'node:net';
import tls from 'node:tls';

/**
 * Avinya Care Foundation - Native Zero-Dependency SMTP/TLS Client
 * Connects directly to SMTP servers (Hostinger, Gmail, SendGrid, MailHog, etc.)
 * Supports direct SSL/TLS (port 465), plain text (port 1025/25/587), and AUTH LOGIN authentication.
 */
export function sendSmtpSocket(options, ...legacyArgs) {
  let host, port, secure, user, pass, from, fromName, to, subject, htmlContent, textContent, replyTo;

  if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
    ({
      host = '127.0.0.1',
      port = 1025,
      secure = false,
      user,
      pass,
      from = 'info@test.avinyacarefoundation.org',
      fromName = 'Avinya Care Foundation',
      to,
      subject = 'Avinya Care Notification',
      htmlContent = '',
      textContent = '',
      replyTo
    } = options);
  } else {
    // Legacy positional arguments support: (host, port, from, to, subject, htmlContent)
    host = options || '127.0.0.1';
    port = legacyArgs[0] || 1025;
    from = legacyArgs[1] || 'info@test.avinyacarefoundation.org';
    to = legacyArgs[2];
    subject = legacyArgs[3] || '';
    htmlContent = legacyArgs[4] || '';
    secure = port === 465;
    fromName = 'Avinya Care Foundation';
  }

  if (!to) {
    return Promise.reject(new Error('Recipient email "to" is required'));
  }

  const isTls = secure || port === 465;

  return new Promise((resolve, reject) => {
    let socket;
    let timer = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (socket && !socket.destroyed) {
        socket.destroy();
      }
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`SMTP connection timed out after 12000ms connecting to ${host}:${port}`));
    }, 12000);

    const onConnect = () => {
      // Connection established, wait for 220 banner from server
    };

    if (isTls) {
      socket = tls.connect({
        host,
        port,
        servername: host,
        rejectUnauthorized: false
      }, onConnect);
    } else {
      socket = net.connect({
        host,
        port
      }, onConnect);
    }

    let state = 'WAIT_BANNER';
    let buffer = '';

    const sendLine = (line) => {
      if (!socket.destroyed) {
        socket.write(line + '\r\n');
      }
    };

    // Format RFC 2822 Message
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const msgId = `<${Date.now()}.${Math.random().toString(36).substring(2, 9)}@${host}>`;
    const dateStr = new Date().toUTCString();

    const headers = [
      `Date: ${dateStr}`,
      `From: "${fromName.replace(/"/g, '')}" <${from}>`,
      `To: <${to}>`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      `Message-ID: ${msgId}`,
      replyTo ? `Reply-To: <${replyTo}>` : `Reply-To: <${from}>`,
      `MIME-Version: 1.0`,
      `X-Mailer: AvinyaCare-Native-SMTP/2.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``
    ];

    const bodyParts = [
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      textContent || htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlContent || `<p>${textContent}</p>`,
      ``,
      `--${boundary}--`,
      ``
    ];

    // Dot stuffing: any line starting with a dot must be escaped with an extra dot
    const rawBody = bodyParts.join('\r\n').split('\r\n').map(l => l.startsWith('.') ? '.' + l : l).join('\r\n');
    const fullEmailData = headers.join('\r\n') + '\r\n' + rawBody + '\r\n.';

    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      
      // Process complete SMTP response lines
      while (buffer.includes('\r\n') || buffer.includes('\n')) {
        const newlineIdx = buffer.indexOf('\r\n') !== -1 ? buffer.indexOf('\r\n') : buffer.indexOf('\n');
        const delimLength = buffer.indexOf('\r\n') !== -1 ? 2 : 1;
        const line = buffer.substring(0, newlineIdx).trim();
        buffer = buffer.substring(newlineIdx + delimLength);

        if (!line) continue;

        const code = parseInt(line.substring(0, 3), 10);
        const isMultiLine = line.length >= 4 && line.charAt(3) === '-';

        if (isMultiLine) {
          // Continue collecting multiline response
          continue;
        }

        if (state === 'WAIT_BANNER') {
          if (code === 220) {
            state = 'EHLO';
            sendLine(`EHLO localhost`);
          } else {
            cleanup();
            reject(new Error(`SMTP Banner Error: ${line}`));
            return;
          }
        } else if (state === 'EHLO') {
          if (code === 250) {
            if (user && pass) {
              state = 'AUTH_LOGIN';
              sendLine(`AUTH LOGIN`);
            } else {
              state = 'MAIL_FROM';
              sendLine(`MAIL FROM:<${from}>`);
            }
          } else {
            cleanup();
            reject(new Error(`SMTP EHLO Error: ${line}`));
            return;
          }
        } else if (state === 'AUTH_LOGIN') {
          if (code === 334) {
            state = 'AUTH_USER';
            sendLine(Buffer.from(user).toString('base64'));
          } else {
            cleanup();
            reject(new Error(`SMTP AUTH Error: ${line}`));
            return;
          }
        } else if (state === 'AUTH_USER') {
          if (code === 334) {
            state = 'AUTH_PASS';
            sendLine(Buffer.from(pass).toString('base64'));
          } else {
            cleanup();
            reject(new Error(`SMTP Username Error: ${line}`));
            return;
          }
        } else if (state === 'AUTH_PASS') {
          if (code === 235) {
            state = 'MAIL_FROM';
            sendLine(`MAIL FROM:<${from}>`);
          } else {
            cleanup();
            reject(new Error(`SMTP Password Authentication Failed: ${line}`));
            return;
          }
        } else if (state === 'MAIL_FROM') {
          if (code === 250) {
            state = 'RCPT_TO';
            sendLine(`RCPT TO:<${to}>`);
          } else {
            cleanup();
            reject(new Error(`SMTP MAIL FROM Error: ${line}`));
            return;
          }
        } else if (state === 'RCPT_TO') {
          if (code === 250 || code === 251) {
            state = 'DATA_CMD';
            sendLine(`DATA`);
          } else {
            cleanup();
            reject(new Error(`SMTP RCPT TO Error for <${to}>: ${line}`));
            return;
          }
        } else if (state === 'DATA_CMD') {
          if (code === 354) {
            state = 'DATA_SEND';
            sendLine(fullEmailData);
          } else {
            cleanup();
            reject(new Error(`SMTP DATA Command Error: ${line}`));
            return;
          }
        } else if (state === 'DATA_SEND') {
          if (code === 250) {
            state = 'QUIT';
            sendLine(`QUIT`);
            cleanup();
            resolve({ success: true, response: line, messageId: msgId });
            return;
          } else {
            cleanup();
            reject(new Error(`SMTP Data Delivery Error: ${line}`));
            return;
          }
        } else if (state === 'QUIT') {
          cleanup();
          resolve({ success: true, response: line, messageId: msgId });
          return;
        }
      }
    });

    socket.on('error', (err) => {
      cleanup();
      reject(err);
    });

    socket.on('close', () => {
      if (state !== 'QUIT' && state !== 'DATA_SEND') {
        cleanup();
        reject(new Error(`SMTP Connection closed unexpectedly at state ${state}`));
      }
    });
  });
}
