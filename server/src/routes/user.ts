import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user statistics
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user with stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        testSessions: {
          orderBy: { createdAt: 'desc' },
          take: 100
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate statistics
    const totalTests = user.testSessions.length;
    const totalTimeTyped = user.testSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalWordsTyped = user.testSessions.reduce((sum, session) => sum + (session.wordsTyped || 0), 0);
    
    const avgWpm = totalTests > 0 
      ? user.testSessions.reduce((sum, session) => sum + session.wpm, 0) / totalTests 
      : 0;
    
    const avgAccuracy = totalTests > 0 
      ? user.testSessions.reduce((sum, session) => sum + session.accuracy, 0) / totalTests 
      : 0;

    // Get user's global rank
    const usersWithBetterWpm = await prisma.user.count({
      where: {
        bestWpm: {
          gt: user.bestWpm || 0
        }
      }
    });
    const rank = usersWithBetterWpm + 1;

    // Calculate streak (simplified - consecutive days)
    const streakDays = 7; // Placeholder - would need more complex logic

    const stats = {
      totalTests,
      bestWpm: user.bestWpm || 0,
      avgWpm: Math.round(avgWpm * 100) / 100,
      avgAccuracy: Math.round(avgAccuracy * 100) / 100,
      totalTimeTyped,
      wordsTyped: totalWordsTyped,
      streakDays,
      rank
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        bestWpm: true,
        totalTests: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
