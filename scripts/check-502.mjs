import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Diagnosing 502 Bad Gateway error...');
  
  const cmd = `
    echo "=== 1. CONTAINER STATUS ==="
    docker ps -a --filter "name=yudi-portfolio-web"
    
    echo "=== 2. CONTAINER LOGS ==="
    docker logs --tail 50 yudi-portfolio-web
    
    echo "=== 3. CONTAINER NETWORK TEST ==="
    docker inspect yudi-portfolio-web --format '{{json .NetworkSettings.Networks}}'
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
