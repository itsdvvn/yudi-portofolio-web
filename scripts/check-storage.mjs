import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Checking VPS disk space and directory sizes...');
  
  const cmd = `
    echo "=== DISK USAGE (df -h) ==="
    df -h /
    df -h
    
    echo "=== LARGEST DIRECTORIES IN /root ==="
    du -sh /root/* 2>/dev/null | sort -hr | head -n 10
    
    echo "=== DOCKER SYSTEM DF ==="
    docker system df
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
