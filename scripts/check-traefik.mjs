import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Checking Traefik configuration and docker networks...');
  
  const cmd = `
    docker inspect traefik --format '{{json .NetworkSettings.Networks}}'
    docker inspect traefik --format '{{json .Args}}'
    docker network ls
    find / -maxdepth 3 -name "docker-compose*.yml" -o -name "compose.yaml" 2>/dev/null
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
