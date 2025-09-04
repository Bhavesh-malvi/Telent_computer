import dotenv from 'dotenv';
import connectDB from './config/db.js';
dotenv.config();
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import studentRoutes from './Routes/studentRoutes.js';
import courseRoutes from './Routes/studentcourseRoutes.js';
import authRoutes from './Routes/authRoutes.js';
import enrollmentRoutes from './Routes/enrollmentRoutes.js';
import contactRoutes from './Routes/contactRoutes.js';
import issueRoutes from './Routes/issueRoutes.js';
import chapterRoutes from './Routes/chapterRoutes.js';
import dashboardRoutes from './Routes/dashboardRoutes.js';
import whatsappRoutes from './Routes/whatsappRoutes.js';
import whatsappController from './Controllers/whatsappController.js';
import staffRoutes from './Routes/staffRoutes.js';
import welcomeMessageRoutes from './Routes/welcomeMessageRoutes.js';
import feePaymentMessageRoutes from './Routes/feePaymentMessageRoutes.js';
import reminderSettingsRoutes from './Routes/reminderSettingsRoutes.js';
import autoMessageRoutes from './Routes/autoMessageRoutes.js';
import schedulerRoutes from './Routes/schedulerRoutes.js';
import autoMessageSettingsRoutes from './Routes/autoMessageSettingsRoutes.js';

import mongoose from 'mongoose';

// Import models to register them
import './Model/studentCourse.js';

// Import automatic reminder service
import automaticReminderService from './services/automaticReminderService.js';
// Import automatic birthday wishes service
import automaticBirthdayWishes from './services/automaticBirthdayWishes.js';
// Import new auto message scheduler
import autoMessageScheduler from './services/scheduler/autoMessageScheduler.js';

const app = express();
const httpServer = createServer(app);

// Security headers middleware
app.use((req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;");
  
  next();
});
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://localhost:5174',
        'https://telent-computer-gyx6.vercel.app',
        'https://telent-computer.vercel.app',
        "https://talentcomputeracademy.in",
        "https://talentcomputeracademy.in/new"
      ];
      
      // Check if the origin is in our allowedOrigins array
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Check if it's a vercel.app subdomain
      if (origin && origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // For development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cookie']
  },
  transports: ['websocket', 'polling']
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 Client connected:', socket.id);
  }
  
  // Send initial connection confirmation
  socket.emit('connected', { 
    message: 'Connected to server', 
    socketId: socket.id,
    timestamp: new Date().toISOString() 
  });
  
  socket.on('disconnect', (reason) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason);
    }
  });
  
  socket.on('error', (error) => {
    console.error('🔌 Socket error:', error);
  });
  
  socket.on('test-connection', (data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 Test connection received from:', socket.id);
    }
    socket.emit('test-response', { 
      message: 'Backend received test connection', 
      timestamp: new Date().toISOString(),
      socketId: socket.id 
    });
  });
  
  // WhatsApp status updates
  socket.on('whatsapp-status-request', () => {
    const whatsappStatus = {
      isReady: false, // Updated to use new service
      isInitialized: false, // Updated to use new service
      timestamp: new Date().toISOString()
    };
    socket.emit('whatsapp-status-update', whatsappStatus);
  });
});

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

// Middleware for parsing JSON and cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configuration - Allow all origins for now
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  // Set CORS headers for all requests
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/studentcourses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/dashboard', dashboardRoutes);
// WhatsApp routes (public and protected)
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/staff', staffRoutes);

// Welcome message routes
app.use('/api/welcome-messages', welcomeMessageRoutes);

// Fee payment message routes
app.use('/api/fee-payment-messages', feePaymentMessageRoutes);

// Reminder settings routes
app.use('/api/reminder-settings', reminderSettingsRoutes);

// Auto message routes
app.use('/api/auto-messages', autoMessageRoutes);

// Scheduler routes
app.use('/api/scheduler', schedulerRoutes);

// Auto message settings routes
app.use('/api/auto-message-settings', autoMessageSettingsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Student Management System API',
    status: 'running',
    time: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Health check endpoint for keep-alive
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    whatsapp: {
      isReady: false, // Updated to use new service
      isInitialized: false // Updated to use new service
    }
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    time: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      mongoConnected: mongoose.connection.readyState === 1,
      dbName: mongoose.connection.name,
      dbHost: mongoose.connection.host
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error details
  console.error('Error:', {
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    origin: req.get('origin'),
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: 'Duplicate entry found',
        error: err.message
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Database Error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      details: err
    } : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error',
    message: `Route ${req.url} not found`
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  
  // Wait for database connection before initializing WhatsApp
  console.log('⏳ Waiting for database connection...');
  let dbConnected = false;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!dbConnected && attempts < maxAttempts) {
    if (mongoose.connection.readyState === 1) {
      dbConnected = true;
      console.log('✅ Database connected, proceeding with WhatsApp initialization');
    } else {
      attempts++;
      console.log(`⏳ Database not ready, attempt ${attempts}/${maxAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!dbConnected) {
    console.log('⚠️ Database connection timeout, initializing WhatsApp anyway');
  }
  
  // Initialize WhatsApp service after database is ready
  try {
      // WhatsApp service is now handled by the new connection service
  console.log('✅ WhatsApp service initialization skipped (using new connection service)');
    console.log('📱 WhatsApp service initialized (manual connection required)');
  } catch (error) {
    console.log('⚠️ Failed to initialize WhatsApp service:', error.message);
  }
  
  // Start automatic reminder service (old system) - DISABLED
  try {
    // await automaticReminderService.start();
    console.log('⚠️ Old automatic reminder service DISABLED (using new system)');
  } catch (error) {
    console.log('⚠️ Failed to start old automatic reminder service:', error.message);
  }
  
  // Start new auto message scheduler (DISABLED - manual initialization required)
  try {
    // await autoMessageScheduler.initialize();
    // await autoMessageScheduler.startAllSchedules();
    console.log('⚠️ Auto message scheduler DISABLED (manual initialization required)');
    console.log('📱 Please use "Connect WhatsApp" button to initialize WhatsApp');
  } catch (error) {
    console.log('⚠️ Failed to start new auto message scheduler:', error.message);
  }
  
  // Start automatic birthday wishes service (now handled by automaticReminderService)
  try {
    console.log('🎂 Birthday wishes now managed by automatic reminder service');
  } catch (error) {
    // Failed to start automatic birthday wishes service
  }
  
  // Start keep-alive service to prevent sleep
  try {
    const keepAliveService = (await import('./keepAlive.js')).default;
    console.log('🔄 Keep-alive service started to prevent server sleep');
  } catch (error) {
    console.log('⚠️ Keep-alive service failed to start:', error.message);
  }
});

// Expose io to routes/controllers
app.set('io', io);
global.__io = io;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  
  // Check if it's a WhatsApp EBUSY error - don't restart server
  if (err.message && (err.message.includes('EBUSY') || err.message.includes('resource busy'))) {
    console.log('⚠️ WhatsApp EBUSY error detected, but continuing without server restart...');
    console.log('⚠️ WhatsApp session will need manual reconnection');
    console.log('⚠️ This is a file locking issue, not a critical server error');
    return; // Don't restart server
  }
  
  // For other critical errors, close server & exit process
  console.error('❌ Critical error detected, shutting down server...');
  httpServer.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  
  // Check if it's a WhatsApp EBUSY error - don't restart server
  if (err.message && (err.message.includes('EBUSY') || err.message.includes('resource busy'))) {
    console.log('⚠️ WhatsApp EBUSY error detected, but continuing without server restart...');
    console.log('⚠️ WhatsApp session will need manual reconnection');
    console.log('⚠️ This is a file locking issue, not a critical server error');
    return; // Don't restart server
  }
  
  // For other critical errors, close server & exit process
  console.error('❌ Critical error detected, shutting down server...');
  httpServer.close(() => process.exit(1));
});