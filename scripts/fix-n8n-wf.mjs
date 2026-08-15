import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const checkCmd = `
cat << 'EOF' > /tmp/deact_activate.js
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

  // Get all workflows to find any with path newsletter-subscribe
  const listRes = await request({
    hostname: '127.0.0.1',
    port: 5678,
    path: '/rest/workflows',
    method: 'GET',
    headers: { 'Cookie': cookie }
  });

  const listData = JSON.parse(listRes.body);
  const workflows = listData.data || listData;
  for (const wf of workflows) {
    if (wf.name.includes('Newsletter') && wf.id !== 'pNBFJ6WTJwN9nGww') {
      console.log('Deactivating/Deleting old workflow:', wf.id, wf.name);
      await request({
        hostname: '127.0.0.1',
        port: 5678,
        path: '/rest/workflows/' + wf.id + '/deactivate',
        method: 'POST',
        headers: { 'Cookie': cookie }
      });
      await request({
        hostname: '127.0.0.1',
        port: 5678,
        path: '/rest/workflows/' + wf.id,
        method: 'DELETE',
        headers: { 'Cookie': cookie }
      });
    }
  }

  // Activate pNBFJ6WTJwN9nGww
  const actRes = await request({
    hostname: '127.0.0.1',
    port: 5678,
    path: '/rest/workflows/pNBFJ6WTJwN9nGww/activate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify({ versionId: '4d211a95-0cc6-4417-8c2e-0b76e586ceb3' })),
      'Cookie': cookie
    }
  }, JSON.stringify({ versionId: '4d211a95-0cc6-4417-8c2e-0b76e586ceb3' }));

  console.log('Final activation status:', actRes.statusCode, actRes.body);
}

main();
EOF

docker cp /tmp/deact_activate.js n8n:/tmp/deact_activate.js
docker exec n8n node /tmp/deact_activate.js
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
