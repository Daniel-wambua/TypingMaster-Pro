import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const testResultSchema = z.object({
  testType: z.enum(['words', 'sentences', 'paragraphs', 'code']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'professional']),
  duration: z.number().positive(),
  textContent: z.string(),
  wpm: z.number().nonnegative(),
  accuracy: z.number().min(0).max(100),
  errors: z.number().nonnegative(),
  consistency: z.number().min(0).max(100),
  wordsTyped: z.number().nonnegative(),
  timeSpent: z.number().positive(),
  keystrokeData: z.any().optional(),
  errorData: z.any().optional()
});

// Submit test result
router.post('/results', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const testData = testResultSchema.parse(req.body);

    // Create test session
    const testSession = await prisma.testSession.create({
      data: {
        userId: req.user?.id,
        ...testData
      }
    });

    // Update user statistics if authenticated
    if (req.user) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (user) {
        const newTotalTests = user.totalTests + 1;
        const newTotalWords = user.totalWords + testData.wordsTyped;
        const newTotalTime = user.totalTime + testData.timeSpent;
        const newAverageWpm = (user.averageWpm * user.totalTests + testData.wpm) / newTotalTests;
        const newAverageAccuracy = (user.averageAccuracy * user.totalTests + testData.accuracy) / newTotalTests;

        await prisma.user.update({
          where: { id: req.user.id },
          data: {
            totalTests: newTotalTests,
            totalWords: newTotalWords,
            totalTime: newTotalTime,
            bestWpm: Math.max(user.bestWpm, testData.wpm),
            averageWpm: newAverageWpm,
            bestAccuracy: Math.max(user.bestAccuracy, testData.accuracy),
            averageAccuracy: newAverageAccuracy
          }
        });
      }
    }

    res.status(201).json({
      message: 'Test result saved successfully',
      testSession: {
        id: testSession.id,
        ...testData,
        createdAt: testSession.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's test history
router.get('/history', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20, testType, difficulty } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user!.id };
    if (testType) where.testType = testType;
    if (difficulty) where.difficulty = difficulty;

    const [testSessions, total] = await Promise.all([
      prisma.testSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          id: true,
          testType: true,
          difficulty: true,
          duration: true,
          wpm: true,
          accuracy: true,
          errors: true,
          consistency: true,
          wordsTyped: true,
          timeSpent: true,
          createdAt: true
        }
      }),
      prisma.testSession.count({ where })
    ]);

    res.json({
      testSessions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get test statistics
router.get('/stats', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    let dateFilter: Date;
    switch (timeframe) {
      case '7d':
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const stats = await prisma.testSession.aggregate({
      where: {
        userId: req.user!.id,
        createdAt: { gte: dateFilter }
      },
      _avg: {
        wpm: true,
        accuracy: true,
        consistency: true
      },
      _max: {
        wpm: true,
        accuracy: true
      },
      _count: {
        id: true
      }
    });

    // Get progress data for charts
    const progressData = await prisma.testSession.findMany({
      where: {
        userId: req.user!.id,
        createdAt: { gte: dateFilter }
      },
      select: {
        wpm: true,
        accuracy: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      stats: {
        averageWpm: stats._avg.wpm || 0,
        averageAccuracy: stats._avg.accuracy || 0,
        averageConsistency: stats._avg.consistency || 0,
        bestWpm: stats._max.wpm || 0,
        bestAccuracy: stats._max.accuracy || 0,
        totalTests: stats._count.id
      },
      progressData
    });
  } catch (error) {
    next(error);
  }
});

// Get recent test sessions for a user
router.get('/recent', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const recentTests = await prisma.testSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        wpm: true,
        accuracy: true,
        testType: true,
        duration: true,
        createdAt: true
      }
    });

    res.json(recentTests);
  } catch (error) {
    console.error('Error fetching recent tests:', error);
    res.status(500).json({ error: 'Failed to fetch recent tests' });
  }
});

export default router;
