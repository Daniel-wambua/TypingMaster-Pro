import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Zap, Target, Clock, Medal, Crown, Award } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

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

interface RealtimeStats {
  onlineUsersCount: number;
  activeTypists: number;
  totalTestsToday: number;
  averageWpmToday: number;
}

const RealTimeLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats>({
    onlineUsersCount: 0,
    activeTypists: 0,
    totalTestsToday: 0,
    averageWpmToday: 0
  });
  const [, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const { user, token } = useAuth();

  useEffect(() => {
    if (token) {
      // Initialize socket connection
      const newSocket = io('http://localhost:3002', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      setSocket(newSocket);

      // Connection handlers
      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
        newSocket.emit('join-leaderboard');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
        setIsConnected(false);
      });

      // Leaderboard updates
      newSocket.on('leaderboard-update', (data: LeaderboardEntry[]) => {
        setLeaderboard(data);
      });

      // Online users updates
      newSocket.on('online-users-update', (data: { count: number; users: OnlineUser[] }) => {
        setRealtimeStats(prev => ({
          ...prev,
          onlineUsersCount: data.count,
          activeTypists: data.users.filter(user => user.isTyping).length
        }));
        setOnlineUsers(data.users);
      });

      // Real-time typing updates
      newSocket.on('user-typing-update', (data: { userId: string; username: string; wpm: number; accuracy: number }) => {
        setOnlineUsers(prev => prev.map(user => 
          user.id === data.userId 
            ? { ...user, currentWpm: data.wpm, isTyping: true }
            : user
        ));
      });

      // System messages
      newSocket.on('system-message', (data: { message: string; type: 'info' | 'warning' | 'success' }) => {
        // Handle system messages (e.g., show notifications)
        console.log('System message:', data);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);

  // Load initial leaderboard data
  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`/api/leaderboard?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-gray-500 font-bold text-sm">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
        2: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white',
        3: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white'
      };
      return colors[rank as keyof typeof colors];
    }
    return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center">
          <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
          Real-Time Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Live rankings and typing activity from the community
        </p>
        <div className="flex items-center justify-center mt-2">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6 text-center">
          <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {realtimeStats.onlineUsersCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Online Users</div>
        </div>
        
        <div className="card p-6 text-center">
          <Zap className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {realtimeStats.activeTypists}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Typists</div>
        </div>
        
        <div className="card p-6 text-center">
          <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {realtimeStats.totalTestsToday}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Tests Today</div>
        </div>
        
        <div className="card p-6 text-center">
          <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(realtimeStats.averageWpmToday)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg WPM Today</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card p-4">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['all', 'today', 'week', 'month'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {filterOption === 'all' ? 'All Time' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Top Performers
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {leaderboard.slice(0, 10).map((entry) => (
                <div 
                  key={entry.id} 
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    user?.id === entry.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadge(entry.rank)}`}>
                        {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {entry.username}
                            {user?.id === entry.id && (
                              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                You
                              </span>
                            )}
                          </h3>
                          {onlineUsers.find(u => u.id === entry.id) && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-600 dark:text-green-400">online</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.totalTests} tests • Member since {formatTimeAgo(entry.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {entry.bestWpm} WPM
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.avgAccuracy}% accuracy
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {leaderboard.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No rankings available for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Online Activity */}
        <div className="space-y-6">
          {/* Currently Typing */}
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Zap className="w-4 h-4 mr-2 text-green-500" />
                Currently Typing
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {onlineUsers.filter(user => user.isTyping).slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.username}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {user.currentWpm} WPM
                  </div>
                </div>
              ))}
              
              {onlineUsers.filter(user => user.isTyping).length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No one is typing right now</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Online Users */}
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Users className="w-4 h-4 mr-2 text-blue-500" />
                Online Users ({onlineUsers.length})
              </h3>
            </div>
            
            <div className="p-4 space-y-2">
              {onlineUsers.slice(0, 8).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${user.isTyping ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {user.username}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(user.joinedAt)}
                  </span>
                </div>
              ))}
              
              {onlineUsers.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No users online</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeLeaderboard;
