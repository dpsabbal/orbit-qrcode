const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.css':  'text/css',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.bmp':  'image/bmp',
};

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url.split('?')[0]; // strip query string
  if (filePath === './' || filePath === '.') filePath = './index.html';

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Only fallback to index.html for unknown routes (SPA behavior)
      if (err.code === 'ENOENT' && !ext) {
        fs.readFile('./index.html', (e, c) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(c, 'utf-8');
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found: ' + filePath);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Orbit Bill Scanner running on port ${PORT}`);
});
