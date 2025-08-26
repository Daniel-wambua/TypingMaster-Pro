import express from 'express';

const router = express.Router();

// Sample text content for different levels
const sampleTexts = {
  beginner: {
    words: ['the', 'and', 'you', 'for', 'are', 'with', 'his', 'they', 'have', 'this'],
    sentences: [
      'The quick brown fox jumps over the lazy dog.',
      'A journey of a thousand miles begins with a single step.',
      'Practice makes perfect when you keep trying.'
    ]
  },
  intermediate: {
    sentences: [
      'Technology has revolutionized the way we communicate and work in the modern world.',
      'The development of artificial intelligence continues to advance at an unprecedented pace.',
      'Programming requires logical thinking and attention to detail for success.'
    ]
  },
  advanced: {
    paragraphs: [
      'In the rapidly evolving landscape of technology, the ability to type efficiently has become more crucial than ever before. Whether you are a student, professional, or simply someone who spends considerable time on a computer, improving your typing speed and accuracy can significantly enhance your productivity and overall digital experience.'
    ]
  }
};

// Get text content for typing test
router.get('/content', (req, res) => {
  const { type = 'words', difficulty = 'beginner' } = req.query;
  
  let content = '';
  
  if (type === 'words' && sampleTexts.beginner.words) {
    content = sampleTexts.beginner.words.slice(0, 50).join(' ');
  } else if (type === 'sentences') {
    const difficultyData = sampleTexts[difficulty as keyof typeof sampleTexts];
    const sentences = (difficultyData && 'sentences' in difficultyData) 
      ? difficultyData.sentences 
      : sampleTexts.beginner.sentences;
    content = sentences.join(' ');
  } else if (type === 'paragraphs' && sampleTexts.advanced.paragraphs) {
    content = sampleTexts.advanced.paragraphs[0];
  } else {
    content = sampleTexts.beginner.sentences.join(' ');
  }

  res.json({ content, type, difficulty });
});

export default router;
