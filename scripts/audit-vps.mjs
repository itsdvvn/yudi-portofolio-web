import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection Ready. Running audit...');
  
  const cmd = `
    echo "=== 1. OS & UPTIME ==="
    uname -a
    uptime
    
    echo "=== 2. MEMORY & DISK ==="
    free -h
    df -h /
    
    echo "=== 3. ACTIVE PORTS & LISTENING SERVICES ==="
    ss -tulpn || netstat -tulpn
    
    echo "=== 4. DOCKER CONTAINERS (IF ANY) ==="
    which docker && docker ps || echo "No docker active"
    
    echo "=== 5. PM2 PROCESSES (IF ANY) ==="
    which pm2 && pm2 list || echo "No pm2 active"
    
    echo "=== 6. WEB SERVERS & SITES-ENABLED ==="
    systemctl status nginx --no-pager || systemctl status apache2 --no-pager || systemctl status caddy --no-pager
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No nginx sites-enabled"
    
    echo "=== 7. NODE & NPM VERSIONS ==="
    node -v || echo "Node not installed globally"
    npm -v || echo "NPM not installed"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Audit completed with code: ' + code);
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
