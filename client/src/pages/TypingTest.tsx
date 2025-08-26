import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, RotateCcw, Trophy } from 'lucide-react';
import TypingTestComponent from '../components/TypingTest/TypingTestComponent';
import { API_BASE_URL } from '../config/api';

interface TestSettings {
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  testType: 'words' | 'sentences' | 'paragraphs' | 'code';
}

interface TestResults {
  wpm: number;
  accuracy: number;
  errors: number;
  consistency: number;
  wordsTyped: number;
  timeSpent: number;
}

const TypingTest: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<TestSettings>({
    duration: 60,
    difficulty: 'intermediate',
    testType: 'sentences'
  });
  const [testText, setTestText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch test content
  useEffect(() => {
    fetchTestContent();
  }, [settings.difficulty, settings.testType]);

  const fetchTestContent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/texts/content?type=${settings.testType}&difficulty=${settings.difficulty}`);
      const data = await response.json();
      setTestText(data.content);
    } catch (error) {
      console.error('Failed to fetch test content:', error);
      // Fallback content based on test type
      setTestText(getFallbackContent(settings.testType, settings.difficulty));
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackContent = (testType: string, difficulty: string): string => {
    const contents: Record<string, Record<string, string>> = {
      words: {
        beginner: "the and for are but not you all can had her was one our out day get has him his how man new now old see two way who boy did its let put say she too use",
        intermediate: "about after again against because before being between both during each every family few first found from great group hand help here home house just last life little long made many most much need number other part people place right same school seem small state system take those three time under water where work world would write year young",
        advanced: "although anything available beginning between business certainly completely consider different during economic education enough especially everything example experience financial government important including information interesting international investment management necessary organization particular possible probably question relationship responsibility situation sometimes something standard technology together understanding university without",
        expert: "administration characteristics circumstances comprehensive consequently constitutional demonstration entrepreneurship implementation infrastructure international investigation philosophical psychological representative responsibility technological transformation understanding unfortunately unquestionably"
      },
      sentences: {
        beginner: "The cat sits on the mat. Dogs like to play in the park. Birds fly high in the sky. Fish swim in the water. Children go to school every day.",
        intermediate: "Learning to type quickly requires regular practice and patience. Technology has changed the way we communicate with each other. Many people enjoy reading books in their free time. Exercise is important for maintaining good health. Travel opens your mind to new experiences and cultures.",
        advanced: "The rapid advancement of artificial intelligence is transforming industries across the globe. Climate change presents unprecedented challenges that require innovative solutions and international cooperation. Modern education systems must adapt to prepare students for an increasingly digital future. Economic inequality remains a persistent issue in many developed nations despite technological progress.",
        expert: "Quantum computing represents a paradigm shift that could revolutionize cryptography, drug discovery, and complex optimization problems. The intersection of biotechnology and artificial intelligence is creating unprecedented opportunities for personalized medicine and therapeutic interventions. Geopolitical tensions in cyberspace necessitate comprehensive frameworks for international cooperation and digital sovereignty."
      },
      paragraphs: {
        beginner: "Learning to type is a valuable skill that everyone should develop. Start by placing your fingers on the home row keys. The left hand covers A, S, D, and F, while the right hand covers J, K, L, and semicolon. Practice typing simple words before moving to sentences. Regular practice will help you improve your speed and accuracy over time.",
        intermediate: "The art of touch typing involves training your muscle memory to find keys without looking at the keyboard. This skill becomes increasingly important in our digital age where most communication and work happens through computers. Professional typists often reach speeds of 80 words per minute or higher. The key to improvement lies in consistent practice, proper posture, and using all ten fingers efficiently. Focus on accuracy first, as speed will naturally follow with time and practice.",
        advanced: "Ergonomic considerations play a crucial role in developing sustainable typing habits that prevent repetitive strain injuries. The position of your wrists, the height of your chair, and the angle of your screen all contribute to your typing comfort and efficiency. Advanced typists understand the importance of taking regular breaks, maintaining proper form, and gradually increasing their typing speed without sacrificing accuracy. Modern keyboards offer various switch types and layouts designed to optimize comfort and performance for different typing styles and preferences.",
        expert: "The evolution of typing interfaces from mechanical typewriters to modern ergonomic keyboards reflects humanity's continuous quest for more efficient human-computer interaction. Contemporary research in haptic feedback, adaptive keyboards, and predictive text technologies suggests that the future of typing may involve entirely new paradigms that transcend traditional QWERTY layouts. Professional development in typing skills requires understanding not only the mechanical aspects of finger placement and movement patterns but also the cognitive processes involved in translating thoughts into written communication efficiently and accurately."
      },
      code: {
        beginner: `function greet(name) {
    return "Hello, " + name + "!";
}

let message = greet("World");
console.log(message);

for (let i = 0; i < 5; i++) {
    console.log(i);
}`,
        intermediate: `class Calculator {
    constructor() {
        this.result = 0;
    }
    
    add(number) {
        this.result += number;
        return this;
    }
    
    multiply(number) {
        this.result *= number;
        return this;
    }
    
    getValue() {
        return this.result;
    }
}

const calc = new Calculator();
const result = calc.add(10).multiply(2).getValue();`,
        advanced: `async function fetchUserData(userId) {
    try {
        const response = await fetch(\`/api/users/\${userId}\`);
        if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

const processUsers = async (userIds) => {
    const promises = userIds.map(id => fetchUserData(id));
    const results = await Promise.allSettled(promises);
    return results.filter(result => result.status === 'fulfilled');
};`,
        expert: `interface DatabaseConnection<T> {
    execute<R>(query: string, params?: T[]): Promise<R[]>;
    transaction<R>(callback: (conn: DatabaseConnection<T>) => Promise<R>): Promise<R>;
}

class PostgreSQLConnection implements DatabaseConnection<any> {
    private pool: Pool;
    
    constructor(config: PoolConfig) {
        this.pool = new Pool(config);
    }
    
    async execute<R>(query: string, params?: any[]): Promise<R[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(query, params);
            return result.rows;
        } finally {
            client.release();
        }
    }
    
    async transaction<R>(callback: (conn: DatabaseConnection<any>) => Promise<R>): Promise<R> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(new PostgreSQLConnection(this.pool));
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}`
      }
    };

    return contents[testType]?.[difficulty] || contents.sentences.intermediate;
  };

  const handleTestComplete = (results: TestResults) => {
    setTestResults(results);
    setShowResults(true);
    
    // Save results to backend if user is logged in
    saveTestResults(results);
  };

  const saveTestResults = async (results: TestResults) => {
    try {
      // Always save locally for guest users
      const testResult = {
        id: Date.now().toString(),
        testType: settings.testType,
        difficulty: settings.difficulty,
        duration: settings.duration,
        textContent: testText,
        date: new Date().toISOString(),
        ...results,
        wordsTyped: results.wordsTyped || 0
      };

      // Save to localStorage for local tracking
      const existingHistory = localStorage.getItem('testHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.push(testResult);
      
      // Keep only last 50 tests to prevent storage overflow
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
      localStorage.setItem('testHistory', JSON.stringify(history));

      // Also try to save to backend if user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetch('/api/tests/results', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testResult)
          });
        } catch (error) {
          console.error('Failed to save to backend (continuing with local save):', error);
        }
      }
    } catch (error) {
      console.error('Failed to save test results:', error);
    }
  };

  const resetTest = () => {
    setShowResults(false);
    setTestResults(null);
    fetchTestContent();
  };

  const getPerformanceLevel = (wpm: number, accuracy: number) => {
    if (wpm >= 80 && accuracy >= 95) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (wpm >= 60 && accuracy >= 90) return { level: 'Very Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (wpm >= 40 && accuracy >= 85) return { level: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (wpm >= 20 && accuracy >= 80) return { level: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { level: 'Needs Practice', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Typing Speed Test
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test your typing speed and accuracy with customizable settings
        </p>
      </div>

      {/* Settings Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Test Settings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration
            </label>
            <select
              value={settings.duration}
              onChange={(e) => setSettings(prev => ({ ...prev, duration: Number(e.target.value) }))}
              className="input w-full"
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            <select
              value={settings.difficulty}
              onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value as any }))}
              className="input w-full"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="professional">Professional</option>
            </select>
          </div>

          {/* Test Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Type
            </label>
            <select
              value={settings.testType}
              onChange={(e) => setSettings(prev => ({ ...prev, testType: e.target.value as any }))}
              className="input w-full"
            >
              <option value="words">Words</option>
              <option value="sentences">Sentences</option>
              <option value="paragraphs">Paragraphs</option>
              <option value="code">Code</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && testResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Test Complete!
              </h2>
              
              {(() => {
                const performance = getPerformanceLevel(testResults.wpm, testResults.accuracy);
                return (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${performance.color} ${performance.bgColor}`}>
                    {performance.level}
                  </span>
                );
              })()}
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {testResults.wpm}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">WPM</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {testResults.accuracy}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {testResults.consistency}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Consistency</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {testResults.errors}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={resetTest}
                className="btn btn-primary flex-1 py-2"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-outline flex-1 py-2"
              >
                View Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Typing Test Component */}
      <TypingTestComponent
        text={testText}
        duration={settings.duration}
        onComplete={handleTestComplete}
      />

      {/* Tips Section */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 Typing Tips
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <ul className="space-y-2">
            <li>• Keep your wrists straight and fingers curved</li>
            <li>• Use all ten fingers for optimal speed</li>
            <li>• Focus on accuracy before speed</li>
          </ul>
          <ul className="space-y-2">
            <li>• Take breaks to avoid fatigue</li>
            <li>• Practice regularly for best results</li>
            <li>• Don't look at the keyboard while typing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TypingTest;
