import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Target, Zap, TrendingUp } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import KeyboardVisualizer from './KeyboardVisualizer';

interface TypingTestProps {
  text?: string;
  duration?: number;
  onComplete?: (results: TestResults) => void;
}

interface TestResults {
  wpm: number;
  accuracy: number;
  errors: number;
  consistency: number;
  wordsTyped: number;
  timeSpent: number;
}

interface CharState {
  char: string;
  status: 'pending' | 'correct' | 'incorrect' | 'current';
}

const defaultText = "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and is perfect for typing practice. Focus on accuracy first, then gradually increase your speed. Remember to maintain proper finger positioning and use all ten fingers for optimal results.";

const TypingTestComponent: React.FC<TypingTestProps> = ({ 
  text = defaultText,
  duration = 60,
  onComplete
}) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [charStates, setCharStates] = useState<CharState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [userInput, setUserInput] = useState('');
  const [errors, setErrors] = useState(0);
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (token && user) {
      const newSocket = io('http://localhost:3002', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket for typing test');
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token, user]);

  // Initialize character states
  useEffect(() => {
    const states: CharState[] = text.split('').map(char => ({
      char,
      status: 'pending'
    }));
    if (states.length > 0) {
      states[0].status = 'current';
    }
    setCharStates(states);
  }, [text]);

  // Timer logic
  useEffect(() => {
    let interval: number;
    
    if (isStarted && !isFinished && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isStarted, isFinished, timeLeft]);

  // Calculate WPM periodically and send real-time updates
  useEffect(() => {
    if (!isStarted || isFinished) return;

    const interval = setInterval(() => {
      const currentWpm = calculateWPM();
      const currentAccuracy = calculateAccuracy();
      
      setWpmHistory(prev => [...prev.slice(-9), currentWpm]);
      
      // Send real-time typing update via Socket.IO
      if (socket && user) {
        socket.emit('typing-update', {
          wpm: currentWpm,
          accuracy: currentAccuracy,
          progress: (currentIndex / text.length) * 100,
          isTyping: true
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, isFinished, currentIndex, startTime, socket, user, text.length]);

  // Send typing status updates
  useEffect(() => {
    if (!socket || !user) return;

    if (isStarted && !isFinished) {
      // User started typing
      socket.emit('typing-status', { isTyping: true });
    } else {
      // User stopped typing or finished
      socket.emit('typing-status', { isTyping: false });
    }
  }, [isStarted, isFinished, socket, user]);

  const calculateWPM = useCallback(() => {
    if (!startTime) return 0;
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const wordsTyped = userInput.length / 5; // standard 5 characters per word
    return timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
  }, [startTime, userInput]);

  const calculateAccuracy = useCallback(() => {
    if (userInput.length === 0) return 100;
    const correctChars = charStates.slice(0, currentIndex).filter(state => state.status === 'correct').length;
    return Math.round((correctChars / userInput.length) * 100);
  }, [charStates, currentIndex, userInput]);

  const calculateConsistency = useCallback(() => {
    if (wpmHistory.length < 2) return 100;
    const average = wpmHistory.reduce((sum, wpm) => sum + wpm, 0) / wpmHistory.length;
    const variance = wpmHistory.reduce((sum, wpm) => sum + Math.pow(wpm - average, 2), 0) / wpmHistory.length;
    const standardDeviation = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - (standardDeviation / average) * 100);
    return Math.round(consistency);
  }, [wpmHistory]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (isFinished) return;

    // Start the test on first keypress
    if (!isStarted) {
      setIsStarted(true);
      setStartTime(Date.now());
    }

    const key = event.key;

    // Handle backspace
    if (key === 'Backspace') {
      event.preventDefault();
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        setUserInput(prev => prev.slice(0, -1));
        
        setCharStates(prev => prev.map((state, index) => ({
          ...state,
          status: index === newIndex ? 'current' : 
                 index < newIndex ? state.status : 'pending'
        })));
      }
      return;
    }

    // Handle regular character input
    if (key.length === 1) {
      event.preventDefault();
      
      if (currentIndex >= text.length) return;

      const isCorrect = key === text[currentIndex];
      setUserInput(prev => prev + key);
      
      if (!isCorrect) {
        setErrors(prev => prev + 1);
      }

      setCharStates(prev => prev.map((state, index) => {
        if (index === currentIndex) {
          return { ...state, status: isCorrect ? 'correct' : 'incorrect' };
        } else if (index === currentIndex + 1) {
          return { ...state, status: 'current' };
        }
        return state;
      }));

      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);

      // Check if test is complete
      if (newIndex >= text.length) {
        setIsFinished(true);
      }
    }
  }, [isStarted, isFinished, currentIndex, text]);

  // Complete test and call onComplete
  useEffect(() => {
    if (isFinished && onComplete && startTime) {
      const finalWpm = calculateWPM();
      const accuracy = calculateAccuracy();
      const consistency = calculateConsistency();
      const timeSpent = duration - timeLeft;
      
      const results: TestResults = {
        wpm: finalWpm,
        accuracy,
        errors,
        consistency,
        wordsTyped: Math.round(userInput.length / 5),
        timeSpent
      };
      
      // Send test completion to server via Socket.IO
      if (socket && user) {
        socket.emit('test-completed', {
          wpm: finalWpm,
          accuracy,
          errors,
          consistency,
          timeSpent,
          textLength: text.length,
          userId: user.id
        });
      }
      
      onComplete(results);
    }
  }, [isFinished, onComplete, startTime, calculateWPM, calculateAccuracy, calculateConsistency, duration, timeLeft, errors, userInput, socket, user, text.length]);

  const currentWpm = calculateWPM();
  const currentAccuracy = calculateAccuracy();
  const currentConsistency = calculateConsistency();

  const resetTest = () => {
    setCurrentIndex(0);
    setIsStarted(false);
    setIsFinished(false);
    setTimeLeft(duration);
    setStartTime(null);
    setUserInput('');
    setErrors(0);
    setWpmHistory([]);
    
    const states: CharState[] = text.split('').map(char => ({
      char,
      status: 'pending'
    }));
    if (states.length > 0) {
      states[0].status = 'current';
    }
    setCharStates(states);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{timeLeft}s</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">WPM</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{currentWpm}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{currentAccuracy}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Consistency</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{currentConsistency}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Typing Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 mb-6">
        <div 
          className="typing-area focus:outline-none"
          tabIndex={0}
          onKeyDown={handleKeyPress}
        >
          <div className="text-content font-mono text-xl leading-relaxed">
            {charStates.map((charState, index) => {
              // Handle space characters specially
              if (charState.char === ' ') {
                return (
                  <span
                    key={index}
                    className={`char-space ${
                      charState.status === 'correct' ? 'char-correct' : 
                      charState.status === 'incorrect' ? 'char-incorrect' :
                      charState.status === 'current' ? 'char-current' : 
                      'char-pending'
                    }`}
                  >
                    {' '}
                  </span>
                );
              }
              
              return (
                <span
                  key={index}
                  className={`${
                    charState.status === 'correct' ? 'char-correct' : 
                    charState.status === 'incorrect' ? 'char-incorrect' :
                    charState.status === 'current' ? 'char-current' : 
                    'char-pending'
                  }`}
                >
                  {charState.char}
                </span>
              );
            })}
          </div>
        </div>
        
        {!isStarted && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
            Click here and start typing to begin the test
          </p>
        )}
      </div>

      {/* Keyboard Visualizer */}
      <KeyboardVisualizer 
        currentChar={charStates[currentIndex]?.char || ''}
        nextChar={charStates[currentIndex + 1]?.char || ''}
        highlightMode="both"
        showFingerPosition={true}
      />

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={resetTest}
          className="btn btn-outline px-6 py-2"
        >
          Reset Test
        </button>
        
        {isFinished && (
          <button
            onClick={resetTest}
            className="btn btn-primary px-6 py-2"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default TypingTestComponent;
