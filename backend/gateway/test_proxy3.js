const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const backend = express();
backend.use('/api/colleges', (req, res) => res.send('matched /api/colleges!'));
backend.listen(8081, () => console.log('backend running'));

const gateway = express();
gateway.use(createProxyMiddleware({
  pathFilter: ['/api/colleges'],
  target: 'http://localhost:8081', 
  changeOrigin: true
}));
gateway.listen(8080, () => console.log('gateway running'));
