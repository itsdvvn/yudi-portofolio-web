import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Verifying all services status on VPS...');
  
  const cmd = `
    echo "=== 1. ALL DOCKER CONTAINERS STATUS ==="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo "=== 2. LOCAL HTTP TEST (TRAEFIK / PORTFOLIO) ==="
    docker exec traefik wget -qO- --header="Host: itsdvvn.my.id" http://127.0.0.1:80 | head -n 15 || echo "Traefik routed"
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
