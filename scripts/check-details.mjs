import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Inspecting VPS content and image files...');
  
  const cmd = `
    echo "=== 1. CONTAINER LOGS ==="
    docker logs --tail 30 yudi-portfolio-web
    
    echo "=== 2. LIST FILES IN /root/portfolio/src/content/writings ==="
    ls -laR /root/portfolio/src/content/writings
    
    echo "=== 3. LIST FILES IN /root/portfolio/public/images ==="
    ls -laR /root/portfolio/public/images 2>/dev/null || echo "No public/images"
    
    echo "=== 4. CHECK ENTRY CONTENT IN WELCOME-TO-MY-SPACE ==="
    cat /root/portfolio/src/content/writings/welcome-to-my-space.mdoc || cat /root/portfolio/src/content/writings/welcome-to-my-space/index.mdoc || echo "No mdoc"
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
