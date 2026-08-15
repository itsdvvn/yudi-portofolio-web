import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== N8N DOCKER COMPOSE ==="
    cat /root/server/docker-compose.yml | head -80
    echo ""
    echo "=== N8N API KEY CHECK ==="
    docker exec n8n printenv N8N_API_KEY 2>/dev/null || echo "No N8N_API_KEY set"
    echo ""
    echo "=== CADDY/NGINX REVERSE PROXY ==="
    cat /root/server/Caddyfile 2>/dev/null || echo "No Caddyfile"
    echo ""
    echo "=== N8N WORKFLOWS ==="
    docker exec n8n wget -qO- http://localhost:5678/api/v1/workflows 2>/dev/null | head -200 || echo "Cannot query n8n API (may need auth)"
  `;

  conn.exec(cmd, (err, stream) => {
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
