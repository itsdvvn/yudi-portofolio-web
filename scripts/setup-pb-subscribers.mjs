import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const checkCmd = `
cat << 'EOF' > /tmp/create_subscribers.sh
#!/bin/sh
AUTH=$(wget -qO- --header="Content-Type: application/json" --post-data='{"identity":"itsdvvn@gmail.com","password":"Pastibisa123"}' http://127.0.0.1:8090/api/collections/_superusers/auth-with-password)
TOKEN=$(echo "$AUTH" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: \${TOKEN:0:20}..."

PAYLOAD='{"name":"subscribers","type":"base","createRule":"","fields":[{"name":"email","type":"email","required":true,"unique":true},{"name":"source_article","type":"text","required":false},{"name":"status","type":"select","required":false,"values":["active","unsubscribed"]}]}'

wget -qO- --header="Authorization: Bearer $TOKEN" --header="Content-Type: application/json" --post-data="$PAYLOAD" http://127.0.0.1:8090/api/collections || echo "Already exists"

echo ""
echo "Verifying subscribers collection:"
wget -qO- --header="Authorization: Bearer $TOKEN" http://127.0.0.1:8090/api/collections/subscribers
EOF

docker cp /tmp/create_subscribers.sh pocketbase-media:/tmp/create_subscribers.sh
docker exec pocketbase-media sh /tmp/create_subscribers.sh
  `;

  conn.exec(checkCmd, (err, stream) => {
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
