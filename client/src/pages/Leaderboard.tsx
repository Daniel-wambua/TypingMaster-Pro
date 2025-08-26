import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

interface LeaderboardEntry {
  id: string;
  username: string;
  bestWpm: number;
  avgAccuracy: number;
  totalTests: number;
  rank: number;
  createdAt: Date;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const { token } = useAuth();

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/leaderboard?filter=${filter}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-500" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 dark:text-gray-400">#{rank}</span>;
  };

  const formatMemberSince = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8 mx-auto"></div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Global Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          See how you rank against the world's fastest typists
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border mb-6">
        <div className="p-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['all', 'today', 'week', 'month'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {filterOption === 'all' ? 'All Time' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Top Performers - {filter === 'all' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {leaderboard.length > 0 ? (
            leaderboard.map((user) => (
              <div key={user.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center space-x-4">
                  {getRankIcon(user.rank)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user.username}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Rank #{user.rank} • Member since {formatMemberSince(user.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-8 text-right">
                  <div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {user.bestWpm}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      WPM
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {user.avgAccuracy.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Accuracy
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {user.totalTests}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tests
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Rankings Available</h3>
              <p>No users found for this time period. Be the first to set a record!</p>
            </div>
          )}
        </div>

        {leaderboard.length > 0 && (
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              {!token ? (
                <>Create an account to track your progress and compete for the top spots!</>
              ) : (
                <>Keep practicing to improve your ranking and climb the leaderboard!</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
