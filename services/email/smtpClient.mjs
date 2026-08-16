import net from 'node:net';

export function sendSmtpSocket(host, port, from, to, subject, htmlContent) {
  return new Promise((resolve) => {
    const socket = net.connect(port, host, () => {
      let step = 0;
      const emailLines = [
        `From: "Avinya Care Foundation" <${from}>`,
        `To: <${to}>`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        `Content-Transfer-Encoding: 8bit`,
        ``,
        htmlContent,
        `.`
      ].join('\r\n');

      socket.on('data', (data) => {
        const response = data.toString();
        if (step === 0 && response.startsWith('220')) {
          step++;
          socket.write(`EHLO local\r\n`);
        } else if (step === 1 && response.startsWith('250')) {
          step++;
          socket.write(`MAIL FROM:<${from}>\r\n`);
        } else if (step === 2 && response.startsWith('250')) {
          step++;
          socket.write(`RCPT TO:<${to}>\r\n`);
        } else if (step === 3 && response.startsWith('250')) {
          step++;
          socket.write(`DATA\r\n`);
        } else if (step === 4 && response.startsWith('354')) {
          step++;
          socket.write(`${emailLines}\r\n`);
        } else if (step === 5 && response.startsWith('250')) {
          step++;
          socket.write(`QUIT\r\n`);
          resolve(true);
        }
      });
    });

    socket.on('error', () => resolve(false));
    socket.setTimeout(5000, () => { socket.destroy(); resolve(false); });
  });
}
