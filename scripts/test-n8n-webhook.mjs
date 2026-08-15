import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const checkCmd = `
    docker exec n8n wget -S -O- --header="Content-Type: application/json" --post-data='{"email":"test.subscriber@example.com","sourceArticle":"Test Article"}' http://127.0.0.1:5678/webhook/newsletter-subscribe
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
