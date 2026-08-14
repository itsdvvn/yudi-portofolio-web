import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connection Ready. Starting isolated deployment...');
  
  const deployCmd = `
    set -e
    mkdir -p /root/portfolio
    cd /root/portfolio
    
    if [ -d ".git" ]; then
      echo "Pulling latest updates..."
      git pull origin main
    else
      echo "Cloning repository..."
      git clone https://github.com/itsdvvn/yudi-portofolio-web.git .
    fi
    
    echo "Building and starting container in isolated network..."
    docker compose up -d --build
    
    echo "=== Container Status ==="
    docker ps --filter "name=yudi-portfolio-web"
  `;

  conn.exec(deployCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Deployment script finished with exit code: ' + code);
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
