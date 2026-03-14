const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});

server.listen(3001, () => {
  console.log('Test server is listening on port 3001');
});
