import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Creating .env on VPS and starting deployment...');
  
  const deployCmd = `
    set -e
    cd /root/portfolio
    
    if [ ! -f ".env" ]; then
      cat << 'EOF' > .env
R2_ACCOUNT_ID=54654e7eebbed345259d292ae43dafe6
R2_BUCKET_NAME=yudi-web-personal
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_DOMAIN=https://media.itsdvvn.my.id
EOF
    fi
    
    mkdir -p public/images/profile public/images/writings public/images/ships public/images/education
    
    echo "Pulling latest code from GitHub repository..."
    git pull origin main
    
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
