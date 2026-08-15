import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Force syncing VPS repository to clean main...');
  
  const deployCmd = `
    set -e
    cd /root/portfolio
    
    # Discard any local modifications made from live CMS testing
    git reset --hard HEAD
    git clean -fd
    git pull origin main
    
    # Clean uploaded test images on VPS
    rm -rf public/images/body/* public/images/writings/* 2>/dev/null || true
    
    docker compose up -d --build
    
    echo "=== Container Status ==="
    docker ps --filter "name=yudi-portfolio-web"
  `;

  conn.exec(deployCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Deployment finished with code: ' + code);
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
