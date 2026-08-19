import { Client } from 'ssh2';
import fs from 'fs';

const config = {
  host: '82.112.239.95',
  port: 65002,
  username: 'u382139760',
  password: '@qLVTyL|J5',
  readyTimeout: 30000
};

const zipFile = 'avinya-care-hostinger-deployment.zip';
const testDir = 'domains/test.avinyacarefoundation.org/public_html';
const prodDir = 'domains/avinyacarefoundation.org/public_html';

console.log(`Connecting to Hostinger SSH (${config.host}:${config.port})...`);

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connection established successfully.');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP Error:', err);
      conn.end();
      return;
    }

    const testZipPath = `${testDir}/${zipFile}`;
    console.log(`Uploading ${zipFile} (${(fs.statSync(zipFile).size / 1024 / 1024).toFixed(2)} MB) to test environment...`);
    const readStream = fs.createReadStream(zipFile);
    const writeStream = sftp.createWriteStream(testZipPath);

    readStream.pipe(writeStream);

    writeStream.on('close', () => {
      console.log('Test upload complete.');

      console.log('Deploying and synchronizing on Hostinger server (both test & prod)...');
      const deployCmd = `
        cd ~/${testDir} &&
        unzip -o ${zipFile} &&
        rm -f ${zipFile} &&
        cp -rf * .htaccess .env ~/${prodDir}/ &&
        mkdir -p ~/${prodDir}/api && cp -rf api/* ~/${prodDir}/api/ &&
        mkdir -p ~/${prodDir}/services && cp -rf services/* ~/${prodDir}/services/ 2>/dev/null || true &&
        echo "DEPLOYMENT_SYNC_SUCCESS"
      `;

      conn.exec(deployCmd, (err, stream) => {
        if (err) {
          console.error('Exec error:', err);
          conn.end();
          return;
        }

        let output = '';
        stream.on('close', (code, signal) => {
          console.log(`Remote execution finished with code: ${code}`);
          console.log('Deployment Output:\n', output);
          conn.end();
        }).on('data', (data) => {
          output += data.toString();
        }).stderr.on('data', (data) => {
          console.error('STDERR:', data.toString());
        });
      });
    });

    writeStream.on('error', (err) => {
      console.error('Write stream error:', err);
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('SSH Connection Error:', err);
}).connect(config);
