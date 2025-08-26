import React from 'react';
import { Link } from 'react-router-dom';
import { Keyboard, Target, TrendingUp, Users, Zap, Clock } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Keyboard className="w-16 h-16 mx-auto text-blue-500 mb-4" />
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              TypingMaster Pro
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Master your typing skills with our comprehensive training platform. 
              From beginner to professional - we've got you covered.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/test"
              className="btn btn-primary px-8 py-3 text-lg"
            >
              Start Typing Test
            </Link>
            <Link
              to="/register"
              className="btn btn-outline px-8 py-3 text-lg"
            >
              Create Account
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">10+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Difficulty Levels</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">95%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy Goal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">100+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">WPM Possible</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Features that make the difference
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Target className="w-12 h-12 mx-auto text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Accuracy Training
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Focus on precision with real-time error detection and correction guidance.
              </p>
            </div>
            
            <div className="text-center p-6">
              <Zap className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Speed Building
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Progressive exercises designed to naturally increase your typing speed.
              </p>
            </div>
            
            <div className="text-center p-6">
              <TrendingUp className="w-12 h-12 mx-auto text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Progress Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Detailed analytics and progress charts to monitor your improvement.
              </p>
            </div>
            
            <div className="text-center p-6">
              <Clock className="w-12 h-12 mx-auto text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Timed Challenges
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Various test durations from quick 30-second sprints to marathon sessions.
              </p>
            </div>
            
            <div className="text-center p-6">
              <Users className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Global Leaderboard
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Compete with typists worldwide and see how you rank globally.
              </p>
            </div>
            
            <div className="text-center p-6">
              <Keyboard className="w-12 h-12 mx-auto text-indigo-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Multiple Modes
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Practice with words, sentences, paragraphs, and even code snippets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Training Levels Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Training Levels for Everyone
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 dark:text-green-400 font-bold">B</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Beginner
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Learn basic finger placement and simple letter combinations.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Home row practice</li>
                <li>• Basic words</li>
                <li>• 10-20 WPM target</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 dark:text-blue-400 font-bold">I</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Intermediate
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Build fluency with common sentences and phrases.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Full sentences</li>
                <li>• Punctuation practice</li>
                <li>• 30-50 WPM target</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold">A</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Advanced
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Master complex paragraphs and technical content.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Long paragraphs</li>
                <li>• Technical terms</li>
                <li>• 60-80 WPM target</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                <span className="text-red-600 dark:text-red-400 font-bold">P</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Professional
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Excel with code snippets and specialized content.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Code snippets</li>
                <li>• Special characters</li>
                <li>• 80+ WPM target</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to become a typing master?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who have improved their typing skills with our platform.
          </p>
          <Link
            to="/test"
            className="btn bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
          >
            Start Your Journey
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
