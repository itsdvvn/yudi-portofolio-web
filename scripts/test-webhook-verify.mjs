import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const checkCmd = `
cat << 'EOF' > /tmp/test_and_check.js
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // 1. Send webhook test
  const testPayload = JSON.stringify({ email: 'yudhi.test@dvvn.my.id', sourceArticle: 'Testing Clean N8N' });
  const hookRes = await request({
    hostname: '127.0.0.1',
    port: 5678,
    path: '/webhook/newsletter-subscribe',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testPayload)
    }
  }, testPayload);

  console.log('Webhook Response:', hookRes.statusCode, hookRes.body);

  // 2. Check Execution Log
  const loginData = JSON.stringify({ emailOrLdapLoginId: 'itsdvvn@gmail.com', password: 'Pastibisa123' });
  const loginRes = await request({
    hostname: '127.0.0.1',
    port: 5678,
    path: '/rest/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
  }, loginData);

  const cookie = loginRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');

  const execRes = await request({
    hostname: '127.0.0.1',
    port: 5678,
    path: '/rest/executions?workflowId=pNBFJ6WTJwN9nGww&limit=1',
    method: 'GET',
    headers: { 'Cookie': cookie }
  });

  const execData = JSON.parse(execRes.body);
  const latest = execData.data?.results?.[0];
  console.log('Latest Execution ID:', latest?.id, 'Status:', latest?.status);
}

main();
EOF

docker cp /tmp/test_and_check.js n8n:/tmp/test_and_check.js
docker exec n8n node /tmp/test_and_check.js
  `;

  conn.exec(checkCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\nDone with code: ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '43.156.121.141',
  port: 22,
  username: 'root',
  password: 'REDACTED_PASSWORD',
  readyTimeout: 30000,
});
