import React from 'react';
import { Link } from 'react-router-dom';
import { Keyboard, Github, Twitter, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Keyboard className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-bold text-white">TypingMaster Pro</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              The ultimate typing training platform for users of all skill levels.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/test" className="hover:text-blue-400 transition-colors">Typing Test</Link></li>
              <li><Link to="/books" className="hover:text-blue-400 transition-colors">Book Practice</Link></li>
              <li><Link to="/leaderboard" className="hover:text-blue-400 transition-colors">Leaderboard</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-400 transition-colors">Progress Tracking</Link></li>
            </ul>
          </div>

          {/* Levels */}
          <div>
            <h3 className="text-white font-semibold mb-4">Training Levels</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/test?difficulty=beginner" className="hover:text-blue-400 transition-colors">Beginner</Link></li>
              <li><Link to="/test?difficulty=intermediate" className="hover:text-blue-400 transition-colors">Intermediate</Link></li>
              <li><Link to="/test?difficulty=advanced" className="hover:text-blue-400 transition-colors">Advanced</Link></li>
              <li><Link to="/test?difficulty=expert" className="hover:text-blue-400 transition-colors">Expert</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold mb-4">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register" className="hover:text-blue-400 transition-colors">Sign Up</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition-colors">Login</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link></li>
              <li><Link to="/profile" className="hover:text-blue-400 transition-colors">Profile</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © 2025 TypingMaster Pro. Made with ❤️ by Havoc for better typing skills.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
