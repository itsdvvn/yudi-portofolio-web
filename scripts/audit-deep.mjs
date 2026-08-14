import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Running comprehensive A-Z audit on VPS...');
  
  const cmd = `
    echo "=== 1. CONTAINER LOGS ==="
    docker logs --tail 30 yudi-portfolio-web
    
    echo "=== 2. LS -LAR /root/portfolio/public ==="
    ls -laR /root/portfolio/public
    
    echo "=== 3. DOCKER EXEC LS -LA /app/public ==="
    docker exec yudi-portfolio-web ls -laR /app/public
    
    echo "=== 4. DOCKER EXEC LS -LA /app/dist/client ==="
    docker exec yudi-portfolio-web ls -laR /app/dist/client
    
    echo "=== 5. WELCOME-TO-MY-SPACE CONTENT ==="
    cat /root/portfolio/src/content/writings/welcome-to-my-space.mdoc
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
