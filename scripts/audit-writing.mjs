import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Auditing writing content and images on VPS...');
  
  const cmd = `
    echo "=== 1. CHECK WRITING ENTRY CONTENT ==="
    cat /root/portfolio/src/content/writings/welcome-to-my-space.mdoc
    
    echo "=== 2. TEST CURL WRITING PAGE VIA TRAEFIK NETWORK ==="
    docker exec traefik wget -qO- --header="Host: itsdvvn.my.id" http://172.18.0.11:4321/writings/welcome-to-my-space | grep -i "heroImage"
    
    echo "=== 3. TEST CURL IMAGE ENDPOINT VIA DOCKER ==="
    docker exec yudi-portfolio-web wget -S --spider http://127.0.0.1:4321/media/writings/welcome-to-my-space/heroImage.jpg || true
    
    echo "=== 4. DOCKER CONTAINER LOGS ==="
    docker logs --tail 25 yudi-portfolio-web
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
