import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearMockData() {
  try {
    console.log('🧹 Clearing mock data from database...');

    // First delete all test sessions (to avoid foreign key constraints)
    const deletedSessions = await prisma.testSession.deleteMany({
      where: {
        user: {
          email: {
            in: [
              'speedtyper@example.com',
              'fastfingers@example.com',
              'ninja@example.com',
              'master@example.com',
              'quick@example.com'
            ]
          }
        }
      }
    });

    console.log(`🗑️  Deleted ${deletedSessions.count} test sessions`);

    // Then delete the mock users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'speedtyper@example.com',
            'fastfingers@example.com',
            'ninja@example.com',
            'master@example.com',
            'quick@example.com'
          ]
        }
      }
    });

    console.log(`🗑️  Deleted ${deletedUsers.count} mock users`);
    console.log('✅ Mock data cleared successfully!');
    console.log('📊 Leaderboard will now show empty state until real users register');
    
  } catch (error) {
    console.error('❌ Error clearing mock data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearMockData();
