const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');
const verifyToken = require('./src/middleware/authMiddleware');

dotenv.config();

const app = express();

// 1. Dynamic Origin Logic
const allowedOrigins = [
  'http://localhost:3000', // React default
  'http://localhost:5173', // Vite default
  'https://nonpersuasible-overlavishly-tarra.ngrok-free.dev' // ngrok
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Private-Network'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// 2. Private Network Access (PNA) fix for ngrok -> localhost
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});
app.use(helmet());

// Proxy configuration
const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Forward the user details as custom headers
      if (req.user) {
        if (req.user.userId) proxyReq.setHeader('x-user-id', req.user.userId);
        if (req.user.role) proxyReq.setHeader('x-user-role', req.user.role);
        if (req.user.collegeId) proxyReq.setHeader('x-college-id', req.user.collegeId);
        if (req.user.permissions) proxyReq.setHeader('x-permissions', JSON.stringify(req.user.permissions));
      }
    }
  }
});

// Since proxy middleware works before body-parser, don't use express.json() globally here
// Let the underlying microservices handle body parsing

// Apply auth middleware to verify JWT and attach req.user
app.use(verifyToken);

// Services
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL || 'http://localhost:8002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8003';
const LEADERBOARD_SERVICE_URL = process.env.LEADERBOARD_SERVICE_URL || 'http://localhost:8004';
const SETTINGS_SERVICE_URL = process.env.SETTINGS_SERVICE_URL || 'http://localhost:8005';

// API Routes
const authProxy = createProxyMiddleware(proxyOptions(AUTH_SERVICE_URL));
app.use((req, res, next) => {
  if (['/api/auth', '/api/admin', '/api/colleges', '/api/roles', '/api/payments'].some(p => req.path.startsWith(p))) {
    req.url = req.originalUrl;
    return authProxy(req, res, next);
  }
  next();
});
app.use('/api/events', createProxyMiddleware(proxyOptions(EVENT_SERVICE_URL)));
app.use('/api/announcements', createProxyMiddleware(proxyOptions(NOTIFICATION_SERVICE_URL)));
app.use('/api/notifications', createProxyMiddleware(proxyOptions(NOTIFICATION_SERVICE_URL)));
app.use('/api/leaderboard', createProxyMiddleware(proxyOptions(LEADERBOARD_SERVICE_URL)));
app.use('/api/settings', createProxyMiddleware(proxyOptions(SETTINGS_SERVICE_URL)));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});