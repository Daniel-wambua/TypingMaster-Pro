import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Minimize2, Maximize2, Loader, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AIAssistantProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen = false, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from sessionStorage on component mount
    try {
      const savedMessages = sessionStorage.getItem('aiAssistantMessages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading saved messages:', error);
    }
    
    // Default welcome message if no saved messages
    return [
      {
        id: '1',
        role: 'assistant',
        content: "👋 Hi! I'm your typing assistant. I can help you with:\n\n• Typing technique tips\n• Speed improvement strategies\n• Ergonomic advice\n• Practice recommendations\n• Troubleshooting typing issues\n\nWhat would you like to know?",
        timestamp: new Date()
      }
    ];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    // Load minimized state from sessionStorage
    const saved = sessionStorage.getItem('aiAssistantMinimized');
    return saved ? JSON.parse(saved) : false;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save messages to sessionStorage whenever messages change
  useEffect(() => {
    try {
      sessionStorage.setItem('aiAssistantMessages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, [messages]);

  // Save minimized state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('aiAssistantMinimized', JSON.stringify(isMinimized));
    } catch (error) {
      console.error('Error saving minimized state:', error);
    }
  }, [isMinimized]);

  // Quick suggestions for common typing questions
  const quickSuggestions = [
    "How can I improve my typing speed?",
    "What's the correct finger placement?",
    "How to reduce typing errors?",
    "Best practices for long typing sessions?",
    "How to maintain good posture while typing?"
  ];

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response (in a real app, you'd call an AI API)
      const response = await simulateAIResponse(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again later or check your connection.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate AI responses (replace with actual AI API in production)
  const simulateAIResponse = async (userInput: string): Promise<string> => {
    const input = userInput.toLowerCase();
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Pattern matching for common typing questions
    if (input.includes('speed') || input.includes('fast')) {
      return "🚀 **Improving Typing Speed:**\n\n1. **Focus on accuracy first** - Speed comes naturally with muscle memory\n2. **Use all 10 fingers** - Learn proper finger placement on home row (ASDF-JKL;)\n3. **Practice regularly** - 15-20 minutes daily is better than long sessions\n4. **Don't look at keyboard** - Train your fingers to find keys by feel\n5. **Type in rhythm** - Find a steady pace rather than rushing\n\n**Target progression:** 20→30→40→50+ WPM over months of practice.";
    }
    
    if (input.includes('finger') || input.includes('placement') || input.includes('position')) {
      return "✋ **Proper Finger Placement:**\n\n**Home Row Position:**\n• Left hand: A(pinky), S(ring), D(middle), F(index)\n• Right hand: J(index), K(middle), L(ring), ;(pinky)\n• Thumbs rest on spacebar\n\n**Key Assignments:**\n• **Pinkies:** Q,A,Z + numbers 1,0 + punctuation\n• **Ring fingers:** W,S,X + numbers 2,9\n• **Middle fingers:** E,D,C + numbers 3,8\n• **Index fingers:** R,T,F,G + Y,U,H,J + numbers 4,5,6,7\n\n💡 Keep wrists straight and fingers curved like holding a small ball!";
    }
    
    if (input.includes('error') || input.includes('mistake') || input.includes('accuracy')) {
      return "🎯 **Reducing Typing Errors:**\n\n1. **Slow down initially** - Build accuracy before speed\n2. **Focus on problem keys** - Practice difficult letter combinations\n3. **Use proper lighting** - Ensure you can see the screen clearly\n4. **Take breaks** - Fatigue leads to more mistakes\n5. **Practice common words** - Master frequently used words first\n\n**Error Analysis:**\n• Track which keys you miss most\n• Practice those specific combinations\n• Use typing games focused on problem areas\n\n🎮 Try our practice modes to target your weak spots!";
    }
    
    if (input.includes('posture') || input.includes('ergonomic') || input.includes('health')) {
      return "🪑 **Healthy Typing Posture:**\n\n**Seating:**\n• Feet flat on floor\n• Back straight against chair\n• Thighs parallel to floor\n\n**Arms & Wrists:**\n• Elbows at 90° angle\n• Wrists straight (not bent up/down)\n• Hands floating above keyboard\n• No wrist rests while typing\n\n**Screen:**\n• Top of screen at eye level\n• 20-26 inches from eyes\n• Slight downward gaze (10-20°)\n\n**Break Rules:**\n• 20-20-20: Every 20 min, look 20 feet away for 20 seconds\n• 5-minute break every hour\n• Stretch fingers and wrists regularly";
    }
    
    if (input.includes('practice') || input.includes('exercise') || input.includes('drill')) {
      return "📚 **Effective Practice Strategies:**\n\n**Daily Routine (15-20 minutes):**\n1. **Warm-up** (2-3 min): Type alphabet, numbers\n2. **Accuracy drills** (5-7 min): Focus on problem areas\n3. **Speed practice** (5-7 min): Comfortable pace typing\n4. **Cool-down** (2-3 min): Slow, deliberate typing\n\n**Practice Materials:**\n• Start with common words\n• Progress to sentences and paragraphs\n• Use books you enjoy (our Book Practice mode!)\n• Try coding practice if you're a programmer\n\n**Pro Tips:**\n• Quality over quantity\n• Track progress with WPM and accuracy\n• Set realistic goals (5 WPM improvement per month)\n• Stay consistent rather than intensive";
    }
    
    if (input.includes('book') || input.includes('reading') || input.includes('literature')) {
      return "📖 **Book Typing Practice Benefits:**\n\n**Why it's effective:**\n• **Context learning** - Real sentences vs random words\n• **Vocabulary expansion** - Encounter new words naturally\n• **Rhythm development** - Natural flow of language\n• **Engagement** - More interesting than drill text\n\n**Our Book Practice features:**\n• Classic literature from Project Gutenberg\n• Chapter-by-chapter progression\n• Progress tracking through entire books\n• Multiple genres to choose from\n\n**Recommendation:** Start with books you've read before - familiar content lets you focus on typing technique rather than comprehension!";
    }
    
    // Default helpful response
    return "🤔 I understand you're asking about typing! Here are some quick tips:\n\n• **Practice regularly** - Even 10 minutes daily helps\n• **Focus on accuracy** - Speed will follow naturally\n• **Use proper technique** - All 10 fingers, correct posture\n• **Take breaks** - Prevent fatigue and injury\n\nCould you be more specific about what aspect of typing you'd like help with? I can provide detailed guidance on:\n\n✅ Speed improvement\n✅ Accuracy tips\n✅ Finger placement\n✅ Ergonomics & health\n✅ Practice strategies\n✅ Troubleshooting specific issues";
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-50"
        title="Open AI Assistant"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ${
      isMinimized ? 'h-14' : 'h-[32rem]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Bot className="w-5 h-5 text-blue-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Typing Assistant</h3>
            {!isMinimized && <p className="text-xs text-gray-500">Powered by AI</p>}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-64">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3 text-blue-600" />
                    )}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-1 opacity-70 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <div className="text-xs text-gray-500 mb-2">Quick questions:</div>
              <div className="flex flex-wrap gap-1">
                {quickSuggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSuggestion(suggestion)}
                    className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-end space-x-2">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me about typing..."
                className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-20"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>AI Powered</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAssistant;
