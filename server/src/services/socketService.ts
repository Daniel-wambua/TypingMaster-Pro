import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

declare module 'socket.io' {
  interface Socket {
    userId?: string;
    username?: string;
  }
}

type AuthenticatedSocket = Socket & {
  userId: string;
  username: string;
};

interface LeaderboardEntry {
  id: string;
  username: string;
  bestWpm: number;
  avgAccuracy: number;
  totalTests: number;
  createdAt: Date;
  rank: number;
}

interface OnlineUser {
  id: string;
  username: string;
  currentWpm: number;
  isTyping: boolean;
  joinedAt: Date;
}

class SocketService {
  private io: SocketIOServer;
  private onlineUsers: Map<string, OnlineUser> = new Map();
  private typingRooms: Map<string, Set<string>> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:4173",
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupAuthentication();
    this.setupEventHandlers();
  }

  private setupAuthentication() {
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, username: true }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.username = user.username;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User ${socket.username} connected with ID: ${socket.id}`);
      
      // Add user to online users
      if (socket.userId && socket.username) {
        this.onlineUsers.set(socket.id, {
          id: socket.userId,
          username: socket.username,
          currentWpm: 0,
          isTyping: false,
          joinedAt: new Date()
        });

        // Broadcast updated online users count
        this.broadcastOnlineUsers();
      }

      // Handle joining leaderboard room
      socket.on('join-leaderboard', () => {
        socket.join('leaderboard');
        this.sendLeaderboard(socket);
      });

      // Handle leaving leaderboard room
      socket.on('leave-leaderboard', () => {
        socket.leave('leaderboard');
      });

      // Handle typing session start
      socket.on('typing-start', (data: { testId?: string }) => {
        if (socket.userId) {
          const user = this.onlineUsers.get(socket.id);
          if (user) {
            user.isTyping = true;
            this.onlineUsers.set(socket.id, user);
            this.broadcastOnlineUsers();
          }
        }
      });

      // Handle real-time typing updates
      socket.on('typing-update', (data: { wpm: number, accuracy: number }) => {
        if (socket.userId) {
          const user = this.onlineUsers.get(socket.id);
          if (user) {
            user.currentWpm = data.wpm;
            user.isTyping = true;
            this.onlineUsers.set(socket.id, user);
            
            // Broadcast to others in typing room
            socket.broadcast.emit('user-typing-update', {
              userId: socket.userId,
              username: socket.username,
              wpm: data.wpm,
              accuracy: data.accuracy
            });
          }
        }
      });

      // Handle typing session end
      socket.on('typing-end', async (data: { 
        wpm: number, 
        accuracy: number, 
        wordsTyped: number, 
        timeSpent: number,
        errors: number,
        consistency?: number,
        textContent?: string
      }) => {
        if (socket.userId) {
          try {
            // Save test result
            const testResult = await prisma.testSession.create({
              data: {
                userId: socket.userId,
                wpm: data.wpm,
                accuracy: data.accuracy,
                wordsTyped: data.wordsTyped,
                timeSpent: data.timeSpent,
                errors: data.errors,
                consistency: data.consistency || 0,
                testType: 'practice',
                difficulty: 'intermediate',
                duration: data.timeSpent,
                textContent: data.textContent || 'Practice text'
              }
            });

            // Update user stats
            await this.updateUserStats(socket.userId);
            
            // Update online user status
            const user = this.onlineUsers.get(socket.id);
            if (user) {
              user.isTyping = false;
              user.currentWpm = data.wpm;
              this.onlineUsers.set(socket.id, user);
            }

            // Broadcast updated leaderboard
            this.broadcastLeaderboard();
            this.broadcastOnlineUsers();

            socket.emit('typing-saved', { success: true, testId: testResult.id });
          } catch (error) {
            console.error('Error saving typing result:', error);
            socket.emit('typing-saved', { success: false, error: 'Failed to save result' });
          }
        }
      });

      // Handle joining multiplayer typing room
      socket.on('join-typing-room', (roomId: string) => {
        socket.join(`typing-room-${roomId}`);
        
        if (!this.typingRooms.has(roomId)) {
          this.typingRooms.set(roomId, new Set());
        }
        this.typingRooms.get(roomId)!.add(socket.id);

        // Notify room about new participant
        socket.to(`typing-room-${roomId}`).emit('user-joined-room', {
          userId: socket.userId,
          username: socket.username
        });

        // Send current room participants
        const roomUsers = Array.from(this.typingRooms.get(roomId)!)
          .map(socketId => this.onlineUsers.get(socketId))
          .filter(user => user);

        socket.emit('room-participants', roomUsers);
      });

      // Handle leaving typing room
      socket.on('leave-typing-room', (roomId: string) => {
        socket.leave(`typing-room-${roomId}`);
        
        if (this.typingRooms.has(roomId)) {
          this.typingRooms.get(roomId)!.delete(socket.id);
          
          if (this.typingRooms.get(roomId)!.size === 0) {
            this.typingRooms.delete(roomId);
          }
        }

        socket.to(`typing-room-${roomId}`).emit('user-left-room', {
          userId: socket.userId,
          username: socket.username
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.username} disconnected`);
        
        // Remove from online users
        this.onlineUsers.delete(socket.id);
        
        // Remove from typing rooms
        for (const [roomId, users] of this.typingRooms.entries()) {
          if (users.has(socket.id)) {
            users.delete(socket.id);
            socket.to(`typing-room-${roomId}`).emit('user-left-room', {
              userId: socket.userId,
              username: socket.username
            });
            
            if (users.size === 0) {
              this.typingRooms.delete(roomId);
            }
          }
        }

        this.broadcastOnlineUsers();
      });
    });
  }

  private async sendLeaderboard(socket: Socket) {
    try {
      const leaderboard = await this.getLeaderboard();
      socket.emit('leaderboard-update', leaderboard);
    } catch (error) {
      console.error('Error sending leaderboard:', error);
    }
  }

  private async broadcastLeaderboard() {
    try {
      const leaderboard = await this.getLeaderboard();
      this.io.to('leaderboard').emit('leaderboard-update', leaderboard);
    } catch (error) {
      console.error('Error broadcasting leaderboard:', error);
    }
  }

  private async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const users = await prisma.user.findMany({
      include: {
        testSessions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      },
      orderBy: {
        bestWpm: 'desc'
      },
      take: 50
    });

    return users.map((user, index) => {
      // Calculate average accuracy from test sessions
      const avgAccuracy = user.testSessions.length > 0
        ? user.testSessions.reduce((sum, session) => sum + session.accuracy, 0) / user.testSessions.length
        : 0;

      return {
        id: user.id,
        username: user.username,
        bestWpm: user.bestWpm || 0,
        avgAccuracy: Math.round(avgAccuracy * 100) / 100,
        totalTests: user.totalTests || 0,
        createdAt: user.createdAt,
        rank: index + 1
      };
    });
  }

  private async updateUserStats(userId: string) {
    const testSessions = await prisma.testSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (testSessions.length > 0) {
      const bestWpm = Math.max(...testSessions.map(session => session.wpm));
      const totalTests = testSessions.length;

      await prisma.user.update({
        where: { id: userId },
        data: {
          bestWpm,
          totalTests
        }
      });
    }
  }

  private broadcastOnlineUsers() {
    const onlineUsersArray = Array.from(this.onlineUsers.values());
    this.io.emit('online-users-update', {
      count: onlineUsersArray.length,
      users: onlineUsersArray.slice(0, 10) // Send top 10 for performance
    });
  }

  // Method to manually trigger leaderboard update (for API calls)
  public async updateLeaderboard() {
    await this.broadcastLeaderboard();
  }

  // Method to get online users count
  public getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  // Method to broadcast system messages
  public broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'success' = 'info') {
    this.io.emit('system-message', { message, type, timestamp: new Date() });
  }
}

export default SocketService;
