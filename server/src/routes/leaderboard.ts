import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get leaderboard data
router.get('/', async (req, res) => {
  try {
    const filter = req.query.filter as string || 'all';
    const limit = parseInt(req.query.limit as string) || 50;
    
    let dateFilter: any = {};
    
    // Apply date filters
    if (filter !== 'all') {
      const now = new Date();
      switch (filter) {
        case 'today':
          dateFilter = {
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = {
            createdAt: {
              gte: weekAgo
            }
          };
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = {
            createdAt: {
              gte: monthAgo
            }
          };
          break;
      }
    }

    // Get users with their best performances
    const users = await prisma.user.findMany({
      where: dateFilter,
      include: {
        testSessions: {
          where: dateFilter,
          orderBy: { wpm: 'desc' },
          take: 1
        }
      },
      orderBy: {
        bestWpm: 'desc'
      },
      take: limit
    });

    // Format leaderboard data
    const leaderboard = users
      .filter(user => user.bestWpm && user.bestWpm > 0)
      .map((user, index) => {
        // Calculate average accuracy from recent test sessions
        const recentSessions = user.testSessions;
        const avgAccuracy = recentSessions.length > 0
          ? recentSessions.reduce((sum, session) => sum + session.accuracy, 0) / recentSessions.length
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

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

export default router;
