import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Auditing writing content and images on VPS...');
  
  const cmd = `
    echo "=== 1. FIND ALL IMAGES ON VPS ==="
    find /root/portfolio -name "*.jpg" -o -name "*.png" -o -name "*.webp"
    
    echo "=== 2. DOCKER FIND ALL IMAGES INSIDE CONTAINER ==="
    docker exec yudi-portfolio-web find /app -name "*.jpg" -o -name "*.png" -o -name "*.webp"
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
