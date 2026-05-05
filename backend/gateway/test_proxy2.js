const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const backend = express();
backend.use('/api/admin', (req, res) => res.send('matched /api/admin! path=' + req.path));
backend.listen(8081, () => console.log('backend running'));

const gateway = express();
gateway.use('/api/admin', createProxyMiddleware({ 
  target: 'http://localhost:8081', 
  changeOrigin: true,
  pathRewrite: (path, req) => '/api/admin' + path
}));
gateway.listen(8080, () => console.log('gateway running'));
