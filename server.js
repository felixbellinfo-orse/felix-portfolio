// Local dev server with Are.na CORS proxy
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
};

http.createServer((req, res) => {
  // Proxy Are.na API requests
  if (req.url.startsWith('/arena/')) {
    const arenaPath = req.url.replace('/arena/', '/v2/');
    const options = {
      hostname: 'api.are.na',
      path: arenaPath,
      method: 'GET',
      headers: { 'User-Agent': 'felix-portfolio-dev' }
    };
    const proxy = https.request(options, r => {
      res.writeHead(r.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      r.pipe(res);
    });
    proxy.on('error', () => res.writeHead(502) && res.end());
    proxy.end();
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath)) filePath = path.join(__dirname, 'index.html');
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));
