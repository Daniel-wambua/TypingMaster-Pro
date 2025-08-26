import React, { useState, useEffect } from 'react';
import { Trophy, Target, Clock, Zap, BarChart3, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LocalStats {
  totalTests: number;
  bestWpm: number;
  avgWpm: number;
  avgAccuracy: number;
  totalTimeTyped: number;
  streakDays: number;
  wordsTyped: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<LocalStats>({
    totalTests: 0,
    bestWpm: 0,
    avgWpm: 0,
    avgAccuracy: 0,
    totalTimeTyped: 0,
    streakDays: 0,
    wordsTyped: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocalStats();
  }, []);

  const loadLocalStats = () => {
    try {
      setLoading(true);
      
      // Load stats from localStorage
      const savedStats = localStorage.getItem('typingStats');
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        setStats(parsedStats);
      }
      
      // Load test history to calculate additional stats
      const testHistory = localStorage.getItem('testHistory');
      if (testHistory) {
        const tests = JSON.parse(testHistory);
        calculateStatsFromHistory(tests);
      }
    } catch (error) {
      console.error('Error loading local stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatsFromHistory = (tests: any[]) => {
    if (tests.length === 0) return;

    const totalTests = tests.length;
    const bestWpm = Math.max(...tests.map(t => t.wpm || 0));
    const avgWpm = tests.reduce((sum, t) => sum + (t.wpm || 0), 0) / totalTests;
    const avgAccuracy = tests.reduce((sum, t) => sum + (t.accuracy || 0), 0) / totalTests;
    const totalTimeTyped = tests.reduce((sum, t) => sum + (t.duration || 0), 0);
    const wordsTyped = tests.reduce((sum, t) => sum + (t.wordsTyped || 0), 0);

    // Calculate streak (simplified)
    const today = new Date().toDateString();
    const hasTestToday = tests.some(t => new Date(t.date).toDateString() === today);
    const streakDays = hasTestToday ? 1 : 0;

    const calculatedStats = {
      totalTests,
      bestWpm: Math.round(bestWpm),
      avgWpm: Math.round(avgWpm),
      avgAccuracy: Math.round(avgAccuracy),
      totalTimeTyped: Math.round(totalTimeTyped),
      streakDays,
      wordsTyped
    };

    setStats(calculatedStats);
    
    // Save calculated stats back to localStorage
    localStorage.setItem('typingStats', JSON.stringify(calculatedStats));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your Typing Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your progress and improve your typing skills
        </p>
      </div>

      {stats.totalTests === 0 ? (
        // Empty state when no tests taken yet
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to TypingMaster Pro!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Start your typing journey and watch your progress grow. Take your first test to see your dashboard come to life!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
            <Link
              to="/test"
              className="flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors group"
            >
              <span className="font-medium">Start Typing Test</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/books"
              className="flex items-center justify-between p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors group"
            >
              <span className="font-medium">Practice with Books</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      ) : (
        // Dashboard with stats
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Best WPM</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bestWpm}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgAccuracy}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tests Taken</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTests}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Time Practiced</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatTime(stats.totalTimeTyped)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Average WPM</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.avgWpm}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Words Typed</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.wordsTyped.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Practice Streak</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.streakDays} day{stats.streakDays !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Keep Practicing!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Want to save your progress permanently and compete with others?
              </p>
              <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                <Lock className="w-4 h-4" />
                <span>Account features coming soon!</span>
              </div>
              <div className="mt-4 space-y-2">
                <Link
                  to="/test"
                  className="block w-full p-3 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors"
                >
                  Take Another Test
                </Link>
                <Link
                  to="/leaderboard"
                  className="block w-full p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-center rounded-lg transition-colors"
                >
                  View Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
