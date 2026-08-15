import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const checkCmd = `
cat << 'EOF' > /tmp/activate_n8n.js
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
  const loginData = JSON.stringify({ emailOrLdapLoginId: 'itsdvvn@gmail.com', password: 'Pastibisa123' });
  const loginRes = await request({
    hostname: '127.0.0.1',
    port: 5678,
    path: '/rest/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
  }, loginData);

  const cookie = loginRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');

  // Get workflow details to get versionId
  const getRes = await request({
    hostname: '127.0.0.1',
    port: 5678,
    path: '/rest/workflows/hv0JirvMQXfdW4j6',
    method: 'GET',
    headers: { 'Cookie': cookie }
  });

  const wfData = JSON.parse(getRes.body);
  const versionId = wfData.data ? wfData.data.versionId : wfData.versionId;
  console.log('VersionId:', versionId);

  // Activate with versionId
  const actPayload = JSON.stringify({ versionId: versionId });
  const actRes = await request({
    hostname: '127.0.0.1',
    port: 5678,
    path: '/rest/workflows/hv0JirvMQXfdW4j6/activate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(actPayload),
      'Cookie': cookie
    }
  }, actPayload);

  console.log('Activation result:', actRes.statusCode, actRes.body);
}

main();
EOF

docker cp /tmp/activate_n8n.js n8n:/tmp/activate_n8n.js
docker exec n8n node /tmp/activate_n8n.js
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
