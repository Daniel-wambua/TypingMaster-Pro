import React from 'react';
import { Link } from 'react-router-dom';
import { User, Clock, ArrowRight } from 'lucide-react';

const Register: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Registration Coming Soon!
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We're working hard to bring you the best registration experience
          </p>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              What's Coming
            </h3>
          </div>
          
          <ul className="space-y-2 text-blue-700 dark:text-blue-300 text-sm">
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Personal progress tracking</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Custom typing goals</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Achievement badges</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Global leaderboards</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Start Practicing Now!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            You don't need an account to improve your typing skills. Jump right in and start practicing!
          </p>
          
          <div className="space-y-3">
            <Link
              to="/test"
              className="flex items-center justify-between w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors group"
            >
              <span className="font-medium">Start Typing Test</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/books"
              className="flex items-center justify-between w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors group"
            >
              <span className="font-medium">Practice with Books</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Want to be notified when registration opens?{' '}
            <a
              href="mailto:contact@typingmaster.com"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
