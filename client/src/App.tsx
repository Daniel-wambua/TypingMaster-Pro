import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import AIAssistant from './components/AIAssistant';
import HomePage from './pages/HomePage';
import TypingTest from './pages/TypingTest';
import BookPractice from './pages/BookPractice';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/test" element={<TypingTest />} />
                <Route path="/books" element={<BookPractice />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </main>
            <Footer />
            
            {/* AI Assistant Toggle Button */}
            <button
              onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
              className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-colors z-40"
              title="Toggle AI Assistant"
            >
              🤖
            </button>

            {/* AI Assistant */}
            <AIAssistant 
              isOpen={isAIAssistantOpen} 
              onToggle={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
            />

            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
