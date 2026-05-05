const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const backend = express();
backend.use('/register', (req, res) => res.send('matched /register!'));
backend.use('/colleges', (req, res) => res.send('matched /colleges!'));
backend.use('/', (req, res) => res.send('matched /! path=' + req.path));
backend.listen(8081, () => console.log('backend running'));

const gateway = express();
gateway.use('/api/auth', createProxyMiddleware({ target: 'http://localhost:8081', changeOrigin: true }));
gateway.listen(8080, () => console.log('gateway running'));
