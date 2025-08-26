import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';

// Routes  
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import testRoutes from './routes/test';
import textRoutes from './routes/text';
import leaderboardRoutes from './routes/leaderboard';
import achievementRoutes from './routes/achievement';
import bookRoutes from './routes/books';

// Services
import SocketService from './services/socketService';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';

const app = express();
const PORT = process.env.PORT || 3002;
export const prisma = new PrismaClient();

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO service
const socketService = new SocketService(httpServer);

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(logger);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/texts', textRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/books', bookRoutes);

// Error handling
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`⚡ WebSocket real-time features enabled`);
});

export default app;
