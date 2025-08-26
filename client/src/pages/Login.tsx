import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Clock, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-orange-100 dark:bg-orange-900 rounded-full">
              <Lock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Login Coming Soon!
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We're preparing an amazing user experience for you
          </p>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
              Why Wait?
            </h3>
          </div>
          
          <p className="text-orange-700 dark:text-orange-300 text-sm mb-4">
            You can start improving your typing skills right now! No account needed for basic features.
          </p>
          
          <ul className="space-y-2 text-orange-700 dark:text-orange-300 text-sm">
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Take unlimited typing tests</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Practice with classic books</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>View global leaderboards</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Use AI typing assistant</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Start Your Journey!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Jump right into typing practice. Your progress will be saved locally until accounts are ready.
          </p>
          
          <div className="space-y-3">
            <Link
              to="/test"
              className="flex items-center justify-between w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors group"
            >
              <span className="font-medium">Quick Typing Test</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/books"
              className="flex items-center justify-between w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors group"
            >
              <span className="font-medium">Book Practice</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/leaderboard"
              className="flex items-center justify-between w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors group"
            >
              <span className="font-medium">View Leaderboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Want early access when login is ready?{' '}
            <a
              href="mailto:contact@typingmaster.com"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Join our waitlist
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
