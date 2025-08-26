import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface KeyboardVisualizerProps {
  currentChar?: string;
  nextChar?: string;
  highlightMode?: 'current' | 'next' | 'both';
  showFingerPosition?: boolean;
}

interface KeyData {
  key: string;
  finger: 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
  hand: 'left' | 'right';
  row: number;
  position: string;
  shiftKey?: string;
}

const KeyboardVisualizer: React.FC<KeyboardVisualizerProps> = ({
  currentChar = '',
  nextChar = '',
  highlightMode = 'current',
  showFingerPosition: initialShowFingerPosition = true
}) => {
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showFingerPosition, setShowFingerPosition] = useState(initialShowFingerPosition);
  const [activeFingers, setActiveFingers] = useState<Set<string>>(new Set());

  // Keyboard layout with finger mappings
  const keyboardLayout: KeyData[][] = [
    // Number row
    [
      { key: '`', finger: 'pinky', hand: 'left', row: 0, position: 'far-left', shiftKey: '~' },
      { key: '1', finger: 'pinky', hand: 'left', row: 0, position: 'left', shiftKey: '!' },
      { key: '2', finger: 'ring', hand: 'left', row: 0, position: 'left', shiftKey: '@' },
      { key: '3', finger: 'middle', hand: 'left', row: 0, position: 'left', shiftKey: '#' },
      { key: '4', finger: 'index', hand: 'left', row: 0, position: 'left', shiftKey: '$' },
      { key: '5', finger: 'index', hand: 'left', row: 0, position: 'center', shiftKey: '%' },
      { key: '6', finger: 'index', hand: 'right', row: 0, position: 'center', shiftKey: '^' },
      { key: '7', finger: 'index', hand: 'right', row: 0, position: 'right', shiftKey: '&' },
      { key: '8', finger: 'middle', hand: 'right', row: 0, position: 'right', shiftKey: '*' },
      { key: '9', finger: 'ring', hand: 'right', row: 0, position: 'right', shiftKey: '(' },
      { key: '0', finger: 'pinky', hand: 'right', row: 0, position: 'right', shiftKey: ')' },
      { key: '-', finger: 'pinky', hand: 'right', row: 0, position: 'far-right', shiftKey: '_' },
      { key: '=', finger: 'pinky', hand: 'right', row: 0, position: 'far-right', shiftKey: '+' }
    ],
    // QWERTY row
    [
      { key: 'q', finger: 'pinky', hand: 'left', row: 1, position: 'left' },
      { key: 'w', finger: 'ring', hand: 'left', row: 1, position: 'left' },
      { key: 'e', finger: 'middle', hand: 'left', row: 1, position: 'left' },
      { key: 'r', finger: 'index', hand: 'left', row: 1, position: 'left' },
      { key: 't', finger: 'index', hand: 'left', row: 1, position: 'center' },
      { key: 'y', finger: 'index', hand: 'right', row: 1, position: 'center' },
      { key: 'u', finger: 'index', hand: 'right', row: 1, position: 'right' },
      { key: 'i', finger: 'middle', hand: 'right', row: 1, position: 'right' },
      { key: 'o', finger: 'ring', hand: 'right', row: 1, position: 'right' },
      { key: 'p', finger: 'pinky', hand: 'right', row: 1, position: 'right' },
      { key: '[', finger: 'pinky', hand: 'right', row: 1, position: 'far-right', shiftKey: '{' },
      { key: ']', finger: 'pinky', hand: 'right', row: 1, position: 'far-right', shiftKey: '}' },
      { key: '\\', finger: 'pinky', hand: 'right', row: 1, position: 'far-right', shiftKey: '|' }
    ],
    // ASDF row (home row)
    [
      { key: 'a', finger: 'pinky', hand: 'left', row: 2, position: 'left' },
      { key: 's', finger: 'ring', hand: 'left', row: 2, position: 'left' },
      { key: 'd', finger: 'middle', hand: 'left', row: 2, position: 'left' },
      { key: 'f', finger: 'index', hand: 'left', row: 2, position: 'left' },
      { key: 'g', finger: 'index', hand: 'left', row: 2, position: 'center' },
      { key: 'h', finger: 'index', hand: 'right', row: 2, position: 'center' },
      { key: 'j', finger: 'index', hand: 'right', row: 2, position: 'right' },
      { key: 'k', finger: 'middle', hand: 'right', row: 2, position: 'right' },
      { key: 'l', finger: 'ring', hand: 'right', row: 2, position: 'right' },
      { key: ';', finger: 'pinky', hand: 'right', row: 2, position: 'right', shiftKey: ':' },
      { key: "'", finger: 'pinky', hand: 'right', row: 2, position: 'far-right', shiftKey: '"' }
    ],
    // ZXCV row
    [
      { key: 'z', finger: 'pinky', hand: 'left', row: 3, position: 'left' },
      { key: 'x', finger: 'ring', hand: 'left', row: 3, position: 'left' },
      { key: 'c', finger: 'middle', hand: 'left', row: 3, position: 'left' },
      { key: 'v', finger: 'index', hand: 'left', row: 3, position: 'left' },
      { key: 'b', finger: 'index', hand: 'left', row: 3, position: 'center' },
      { key: 'n', finger: 'index', hand: 'right', row: 3, position: 'center' },
      { key: 'm', finger: 'index', hand: 'right', row: 3, position: 'right' },
      { key: ',', finger: 'middle', hand: 'right', row: 3, position: 'right', shiftKey: '<' },
      { key: '.', finger: 'ring', hand: 'right', row: 3, position: 'right', shiftKey: '>' },
      { key: '/', finger: 'pinky', hand: 'right', row: 3, position: 'right', shiftKey: '?' }
    ]
  ];

  // Special keys
  const spaceBar: KeyData = { key: ' ', finger: 'thumb', hand: 'left', row: 4, position: 'center' };

  // Get finger assignment for a character
  const getFingerForChar = (char: string): KeyData | null => {
    const lowerChar = char.toLowerCase();
    
    // Check space
    if (char === ' ') return spaceBar;
    
    // Check regular keys
    for (const row of keyboardLayout) {
      for (const keyData of row) {
        if (keyData.key === lowerChar || keyData.shiftKey === char) {
          return keyData;
        }
      }
    }
    
    return null;
  };

  // Update active fingers when characters change
  useEffect(() => {
    const newActiveFingers = new Set<string>();
    
    if (highlightMode === 'current' || highlightMode === 'both') {
      const currentKeyData = getFingerForChar(currentChar);
      if (currentKeyData) {
        newActiveFingers.add(`${currentKeyData.hand}-${currentKeyData.finger}`);
      }
    }
    
    if (highlightMode === 'next' || highlightMode === 'both') {
      const nextKeyData = getFingerForChar(nextChar);
      if (nextKeyData) {
        newActiveFingers.add(`${nextKeyData.hand}-${nextKeyData.finger}`);
      }
    }
    
    setActiveFingers(newActiveFingers);
  }, [currentChar, nextChar, highlightMode]);

  // Get key styling
  const getKeyStyle = (keyData: KeyData): string => {
    const isCurrentKey = keyData.key === currentChar.toLowerCase() || keyData.shiftKey === currentChar;
    const isNextKey = keyData.key === nextChar.toLowerCase() || keyData.shiftKey === nextChar;
    
    let baseClasses = "relative inline-block min-w-[2.5rem] h-10 m-0.5 rounded border-2 border-gray-300 dark:border-gray-600 text-center leading-8 text-sm font-mono transition-all duration-200 ";
    
    // Finger color coding
    const fingerColors = {
      'pinky': 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700',
      'ring': 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700',
      'middle': 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
      'index': 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700',
      'thumb': 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
    };
    
    if (showFingerPosition) {
      baseClasses += fingerColors[keyData.finger] + " ";
    } else {
      baseClasses += "bg-gray-50 dark:bg-gray-800 ";
    }
    
    // Highlight current/next keys
    if (isCurrentKey && (highlightMode === 'current' || highlightMode === 'both')) {
      baseClasses += "!bg-blue-500 !border-blue-600 text-white shadow-lg transform scale-110 ";
    } else if (isNextKey && (highlightMode === 'next' || highlightMode === 'both')) {
      baseClasses += "!bg-purple-400 !border-purple-500 text-white shadow-md transform scale-105 ";
    }
    
    // Home row indicators
    if (keyData.row === 2 && ['f', 'j'].includes(keyData.key)) {
      baseClasses += "border-b-4 border-b-gray-500 dark:border-b-gray-400 ";
    }
    
    return baseClasses;
  };

  // Hand visualization
  const HandVisualizer: React.FC<{ hand: 'left' | 'right' }> = ({ hand }) => {
    const handFingers = ['pinky', 'ring', 'middle', 'index', 'thumb'];
    if (hand === 'right') handFingers.reverse();
    
    return (
      <div className={`flex ${hand === 'right' ? 'flex-row-reverse' : ''} items-end space-x-1 mx-4`}>
        {handFingers.map((finger) => {
          const isActive = activeFingers.has(`${hand}-${finger}`);
          const fingerColors = {
            'pinky': 'bg-red-400',
            'ring': 'bg-orange-400',
            'middle': 'bg-yellow-400',
            'index': 'bg-green-400',
            'thumb': 'bg-blue-400'
          };
          
          return (
            <div
              key={finger}
              className={`w-3 rounded-t transition-all duration-200 ${
                isActive ? `${fingerColors[finger as keyof typeof fingerColors]} h-12 shadow-lg` : 'bg-gray-300 dark:bg-gray-600 h-8'
              }`}
              title={`${hand} ${finger}`}
            />
          );
        })}
      </div>
    );
  };

  if (!showKeyboard) {
    return (
      <div className="card p-4">
        <button
          onClick={() => setShowKeyboard(true)}
          className="btn btn-outline flex items-center"
        >
          <Eye className="w-4 h-4 mr-2" />
          Show Keyboard Guide
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          ⌨️ Keyboard Guide
        </h3>
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showFingerPosition}
              onChange={(e) => setShowFingerPosition(e.target.checked)}
              className="mr-2"
            />
            Color by finger
          </label>
          <button
            onClick={() => setShowKeyboard(false)}
            className="btn btn-outline btn-sm"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Hand visualizer */}
      {showFingerPosition && (
        <div className="flex justify-center items-end mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Left Hand</div>
            <HandVisualizer hand="left" />
          </div>
          <div className="mx-8 text-center">
            <div className="text-xs text-gray-500 mb-2">Finger Activity</div>
            <div className="w-px h-8 bg-gray-400"></div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Right Hand</div>
            <HandVisualizer hand="right" />
          </div>
        </div>
      )}
      
      {/* Keyboard layout */}
      <div className="select-none">
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center mb-1">
            {row.map((keyData, keyIndex) => (
              <div
                key={keyIndex}
                className={getKeyStyle(keyData)}
                title={`${keyData.hand} ${keyData.finger}${keyData.shiftKey ? ` (Shift: ${keyData.shiftKey})` : ''}`}
              >
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {keyData.shiftKey}
                </div>
                <div className="text-sm font-medium">
                  {keyData.key.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        ))}
        
        {/* Space bar */}
        <div className="flex justify-center mt-2">
          <div className={`${getKeyStyle(spaceBar)} w-64`} title="Both thumbs">
            <div className="text-sm font-medium mt-1">SPACE</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      {showFingerPosition && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Finger Color Guide:
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-red-400 rounded mr-1"></div>
              Pinky
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-orange-400 rounded mr-1"></div>
              Ring
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded mr-1"></div>
              Middle
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded mr-1"></div>
              Index
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-blue-400 rounded mr-1"></div>
              Thumb
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            💡 Position your fingers on the home row (ASDF - JKL;) and use the correct finger for each key
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardVisualizer;
