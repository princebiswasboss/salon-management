import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeDatabase } from './src/db/jsonStore.js';

import servicesRouter from './src/routes/services.js';
import staffRouter from './src/routes/staff.js';
import customersRouter from './src/routes/customers.js';
import bookingsRouter from './src/routes/bookings.js';
import queueRouter from './src/routes/queue.js';
import statsRouter from './src/routes/stats.js';
import settingsRouter from './src/routes/settings.js';
import authRouter from './src/routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/services', servicesRouter);
app.use('/api/staff', staffRouter);
app.use('/api/customers', customersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/queue', queueRouter);
app.use('/api/dashboard/stats', statsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/auth', authRouter);

// System Health & Diagnostics
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Salon Booking Management System',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Single Page Application Fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` ✨ LUXE HAVEN SALON MANAGEMENT SYSTEM READY`);
      console.log(` 🚀 Node Version : ${process.version}`);
      console.log(` 🌐 Server URL   : http://localhost:${PORT}`);
      console.log(` 📁 Database     : JSON file storage initialized in ./data`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to initialize database and launch server:', err);
    process.exit(1);
  }
}

startServer();
