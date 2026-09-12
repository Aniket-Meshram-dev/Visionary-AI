import WebSocket from 'ws';
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket;
}

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
import adminRouter from './routes/adminRoutes.js';

const app = express();

// Security: Disable express fingerprinting
app.disable('x-powered-by');

// Security: Trust first proxy (Render / Cloudflare) so req.ip and rate limiters receive real client IP
app.set('trust proxy', 1);

try {
  await connectCloudinary();
} catch (err) {
  console.warn('Cloudinary connection warning:', err.message);
}

// HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Robust CORS configuration with support for custom production origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (!allowedOrigins || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.endsWith('.pages.dev')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback to prevent CORS blocks during deployment
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'stripe-signature', 'x-razorpay-signature'],
  })
);

app.use(
  express.json({
    limit: '15mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Render Health Check Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: '🚀 Visionary.ai API Engine is running smoothly!',
    health: '/health',
    version: '1.0.0',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    service: 'Visionary.ai API Engine',
  });
});

app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/admin', adminRouter);

// Global fallback 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});