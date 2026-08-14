import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Fetching logs from yudi-portfolio-web...');
  
  const cmd = `
    echo "=== 1. CONTAINER LOGS ==="
    docker logs --tail 50 yudi-portfolio-web
    
    echo "=== 2. CHECK CONTENT FILES ON VPS ==="
    ls -la /root/portfolio/src/content/writings/
    cat /root/portfolio/src/content/writings/welcome-to-my-space.mdoc || cat /root/portfolio/src/content/writings/welcome-to-my-space/index.mdoc || echo "Check subdirs"
    
    echo "=== 3. CHECK VOLUME MOUNT IN DOCKER ==="
    docker inspect yudi-portfolio-web --format '{{json .Mounts}}'
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
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
  readyTimeout: 20000,
});
