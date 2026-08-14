import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Fixing PocketBase container command and starting...');
  
  const cmd = `
    cd /root/pocketbase
    
    cat << 'EOF' > docker-compose.yml
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: pocketbase-media
    restart: unless-stopped
    command:
      - --http=0.0.0.0:8090
      - --dir=/pb/pb_data
      - --publicDir=/pb/pb_public
    volumes:
      - ./pb_data:/pb/pb_data
      - ./pb_public:/pb/pb_public
    networks:
      - server_web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.pocketbase.rule=Host(\`pb.itsdvvn.my.id\`)"
      - "traefik.http.routers.pocketbase.entrypoints=websecure"
      - "traefik.http.routers.pocketbase.tls.certresolver=myresolver"
      - "traefik.http.services.pocketbase.loadbalancer.server.port=8090"

networks:
  server_web:
    external: true
EOF

    docker compose down
    docker compose up -d
    
    sleep 2
    docker logs pocketbase-media
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
  readyTimeout: 30000,
});
