import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Configs and services
dotenv.config();
import { connectDB } from './config/db';
import { errorHandler } from './middleware/error';

// Import Routers
import authRouter from './routes/auth';
import alertsRouter from './routes/alerts';
import predictionsRouter from './routes/predictions';
import resourcesRouter from './routes/resources';
import volunteerRouter from './routes/volunteer';
import chatRouter from './routes/chat';
import pdfRouter from './routes/pdf';

// Initialize App
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Setup WebSockets (Socket.io)
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev/competition simplicity
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach Socket.io instance to request environment
app.set('io', io);

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Register Endpoints
app.use('/api/auth', authRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/volunteer', volunteerRouter);
app.use('/api/chat', chatRouter);
app.use('/api/pdf', pdfRouter);

// WebSocket Connections
io.on('connection', (socket) => {
  console.log(`🔌 New WebSocket client connected: ${socket.id}`);
  
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`👥 Client ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(errorHandler);

// Connect to Database and start server
const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`🚀 DisasterGuard AI Backend running on http://localhost:${PORT}`);
  });
};

startServer();
