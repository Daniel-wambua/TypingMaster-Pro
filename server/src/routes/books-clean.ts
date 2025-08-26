import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookApiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Book search schema
const bookSearchSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).optional().default(10),
  offset: z.number().min(0).optional().default(0),
  type: z.enum(['title', 'author', 'subject']).optional().default('title')
});

// Apply rate limiting to book API routes
router.use(bookApiLimiter);

// Book title to Gutenberg ID mapping for popular books
const BOOK_TITLE_TO_GUTENBERG_ID: Record<string, string> = {
  'The Adventures of Tom Sawyer': '74',
  'Adventures of Tom Sawyer': '74',
  'Tom Sawyer': '74',
  'Adventures of Huckleberry Finn': '76',
  'The Adventures of Huckleberry Finn': '76',
  'Huckleberry Finn': '76',
  'Pride and Prejudice': '1342',
  'Jane Eyre': '1260',
  'Wuthering Heights': '768',
  'Great Expectations': '1400',
  'A Tale of Two Cities': '98',
  'Oliver Twist': '730',
  'David Copperfield': '766',
  'The Picture of Dorian Gray': '174',
  'Dracula': '345',
  'Frankenstein': '84',
  'Alice\'s Adventures in Wonderland': '11',
  'Alice in Wonderland': '11',
  'The Time Machine': '35',
  'The War of the Worlds': '36',
  'The Invisible Man': '5230',
  'Dr. Jekyll and Mr. Hyde': '43',
  'The Strange Case of Dr. Jekyll and Mr. Hyde': '43',
  'Treasure Island': '120',
  'Robinson Crusoe': '521',
  'Gulliver\'s Travels': '829',
  'The Count of Monte Cristo': '1184',
  'The Three Musketeers': '1257',
  'Around the World in Eighty Days': '103',
  'Twenty Thousand Leagues Under the Sea': '164',
  'Journey to the Center of the Earth': '18857',
  'From the Earth to the Moon': '83',
  'The Odyssey': '1727',
  'The Iliad': '6130',
  'Beowulf': '16328',
  'The Divine Comedy': '8800',
  'Romeo and Juliet': '1513',
  'Hamlet': '1524',
  'Macbeth': '1533',
  'A Midsummer Night\'s Dream': '1514',
  'The Tempest': '23042',
  'King Lear': '1128',
  'Othello': '1531',
  'Julius Caesar': '1120',
  'The Merchant of Venice': '1519',
  'Much Ado About Nothing': '1519',
  'As You Like It': '1121',
  'Twelfth Night': '1526',
  'The Taming of the Shrew': '1508',
  'Richard III': '1103',
  'Henry V': '1119',
  'The Canterbury Tales': '2383',
  'Paradise Lost': '26',
  'Don Quixote': '996',
  'The Scarlet Letter': '33',
  'Moby Dick': '2701',
  'Moby-Dick': '2701',
  'The White Whale': '2701',
  'The Call of the Wild': '215',
  'White Fang': '910',
  'The Jungle Book': '236',
  'The Second Jungle Book': '1937',
  'Kim': '2226',
  'Captains Courageous': '2186',
  'The Man Who Would Be King': '8492',
  'Heart of Darkness': '219',
  'Lord Jim': '5658',
  'The Secret Agent': '974',
  'Nostromo': '2021',
  'Under Western Eyes': '2480',
  'The Turn of the Screw': '209',
  'The Portrait of a Lady': '432',
  'The American': '432',
  'Daisy Miller': '2044',
  'Washington Square': '2054',
  'The Wings of the Dove': '30059',
  'The Golden Bowl': '7176',
  'The Ambassadors': '432',
  'Little Women': '514',
  'Good Wives': '37106',
  'Little Men': '8291',
  'Jo\'s Boys': '1924',
  'An Old-Fashioned Girl': '3785',
  'Eight Cousins': '1153',
  'Rose in Bloom': '1154',
  'Under the Lilacs': '1237',
  'Jack and Jill': '1237',
  'A Garland for Girls': '1237'
};

// Function to get Gutenberg ID from book title
function getGutenbergIdFromTitle(title: string): string | null {
  // Direct match
  if (BOOK_TITLE_TO_GUTENBERG_ID[title]) {
    return BOOK_TITLE_TO_GUTENBERG_ID[title];
  }
  
  // Try variations (case insensitive, removing articles)
  const normalizedTitle = title.toLowerCase().replace(/^(the|a|an)\s+/i, '');
  
  for (const [mappedTitle, id] of Object.entries(BOOK_TITLE_TO_GUTENBERG_ID)) {
    const normalizedMappedTitle = mappedTitle.toLowerCase().replace(/^(the|a|an)\s+/i, '');
    if (normalizedTitle === normalizedMappedTitle) {
      return id;
    }
  }
  
  // Try partial matches for common variations
  for (const [mappedTitle, id] of Object.entries(BOOK_TITLE_TO_GUTENBERG_ID)) {
    if (title.toLowerCase().includes(mappedTitle.toLowerCase()) || 
        mappedTitle.toLowerCase().includes(title.toLowerCase())) {
      return id;
    }
  }
  
  return null;
}

// Simple validation middleware
const validateBookSearch = (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = bookSearchSchema.parse({
      query: req.query.query,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      type: req.query.type || 'title'
    });
    
    req.query = parsed as any;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid search parameters'
    });
  }
};

// Search books from Open Library API
router.get('/search', validateBookSearch, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, limit, offset, type } = req.query as any;
    
    // Construct Open Library API URL
    const apiUrl = new URL('https://openlibrary.org/search.json');
    
    switch (type) {
      case 'author':
        apiUrl.searchParams.set('author', query);
        break;
      case 'subject':
        apiUrl.searchParams.set('subject', query);
        break;
      default:
        apiUrl.searchParams.set('title', query);
    }
    
    apiUrl.searchParams.set('limit', limit.toString());
    apiUrl.searchParams.set('offset', offset.toString());
    apiUrl.searchParams.set('fields', 'title,author_name,first_publish_year,key,cover_i,subject,isbn');
    
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Open Library API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data to a more consistent format
    const books = data.docs.map((book: any) => ({
      title: book.title || 'Unknown Title',
      author: book.author_name ? book.author_name[0] : 'Unknown Author',
      year: book.first_publish_year || null,
      key: book.key,
      coverId: book.cover_i,
      subjects: book.subject ? book.subject.slice(0, 5) : [],
      isbn: book.isbn ? book.isbn[0] : null
    }));
    
    res.json({
      success: true,
      books,
      total: data.numFound,
      offset: data.start
    });
    
  } catch (error) {
    console.error('Book search error:', error);
    next(error);
  }
});

// Get book content
router.get('/content/:bookId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId } = req.params;
    const { chapter = 0, mode = 'excerpt' } = req.query;
    
    console.log(`📚 Fetching content for book ID: ${bookId}, mode: ${mode}, chapter: ${chapter}`);

    // Always try to get real content first
    const realContent = await Promise.race([
      fetchRealBookContent(bookId),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Content fetch timeout')), 30000)
      )
    ]).catch((error) => {
      console.log(`⏰ Content fetch timeout or error for book ${bookId}:`, error.message);
      return null;
    });

    if (!realContent || !realContent.content) {
      return res.status(404).json({
        success: false,
        message: `Real content not available for "${bookId}". Please try a different book from our catalog.`,
        availableBooks: [
          'The Adventures of Tom Sawyer',
          'Adventures of Huckleberry Finn', 
          'Pride and Prejudice',
          'Jane Eyre',
          'Great Expectations',
          'Alice in Wonderland',
          'Dracula',
          'Frankenstein'
        ]
      });
    }

    let content = realContent.content;
    const sourceUsed = realContent.source;
    const isRealContent = true;
    
    console.log(`🎉 Using REAL book content from: ${sourceUsed} (${content.length} characters)`);

    // Clean the content
    content = cleanGutenbergContent(content);
    
    if (!content || content.length < 100) {
      return res.status(404).json({
        success: false,
        message: `Content for "${bookId}" is too short or invalid after processing.`
      });
    }

    // Split content into chapters
    const chapters = splitIntoChapters(content);
    const totalChapters = chapters.length;
    
    console.log(`📖 Book has ${totalChapters} chapters`);

    // Determine what to return based on mode
    let responseContent = '';
    let fullContentAvailable = true;
    
    if (mode === 'full') {
      responseContent = content;
    } else if (mode === 'chapter' && chapters.length > 0) {
      const chapterIndex = Math.max(0, Math.min(parseInt(chapter.toString()) || 0, chapters.length - 1));
      responseContent = chapters[chapterIndex] || chapters[0];
    } else {
      // Default excerpt mode - first ~1000 characters
      responseContent = content.substring(0, 1000) + (content.length > 1000 ? '...' : '');
    }

    const response = {
      success: true,
      bookId,
      excerpt: responseContent,
      fullContentAvailable,
      totalChapters,
      currentChapter: mode === 'chapter' ? parseInt(chapter.toString()) || 0 : 0,
      source: sourceUsed,
      isRealContent,
      contentType: 'authentic-book',
      wordCount: content.split(/\s+/).length,
      characterCount: content.length
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Error in book content route:', error);
    next(error);
  }
});

// Helper function to clean Gutenberg content
function cleanGutenbergContent(content: string): string {
  const startMarkers = [
    /\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*/i,
    /\*\*\*START OF THE PROJECT GUTENBERG EBOOK .* \*\*\*/i,
    /START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i,
    /\*\*\*START OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*/i
  ];
  
  const endMarkers = [
    /\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*/i,
    /\*\*\*END OF THE PROJECT GUTENBERG EBOOK .* \*\*\*/i,
    /END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i,
    /\*\*\*END OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*/i
  ];
  
  let startIndex = 0;
  let endIndex = content.length;
  
  // Find start marker
  for (const marker of startMarkers) {
    const match = content.match(marker);
    if (match) {
      startIndex = match.index! + match[0].length;
      console.log(`📍 Found start marker at position ${startIndex}`);
      break;
    }
  }
  
  // Find end marker
  for (const marker of endMarkers) {
    const match = content.match(marker);
    if (match) {
      endIndex = match.index!;
      console.log(`📍 Found end marker at position ${endIndex}`);
      break;
    }
  }
  
  content = content.substring(startIndex, endIndex).trim();
  
  // Further clean up
  content = content
    .replace(/^\s*\n+/, '') // Remove leading whitespace and newlines
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\s+$/gm, '') // Remove trailing spaces from lines
    .trim();
    
  return content;
}

// Helper function to split content into chapters
function splitIntoChapters(content: string): string[] {
  // Split by common chapter markers
  const chapterPatterns = [
    /CHAPTER\s+[IVXLCDM\d]+/gi,
    /Chapter\s+\d+/gi,
    /^[IVXLCDM]+\./gm,
    /^\d+\./gm
  ];
  
  // Try each pattern to find the best split
  for (const pattern of chapterPatterns) {
    const matches = [...content.matchAll(pattern)];
    if (matches.length > 1) {
      const chapters = [];
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index!;
        const end = matches[i + 1]?.index || content.length;
        const chapterContent = content.substring(start, end).trim();
        if (chapterContent.length > 500) { // Only include substantial chapters
          chapters.push(chapterContent);
        }
      }
      if (chapters.length > 1) {
        return chapters;
      }
    }
  }
  
  // Fallback: split by double line breaks into sections
  const sections = content.split(/\n\s*\n\s*\n/).filter(section => section.trim().length > 1000);
  return sections.length > 1 ? sections : [content];
}

async function fetchRealBookContent(bookId: string): Promise<{ content: string; source: string } | null> {
  console.log(`🔍 Starting multi-source content search for book ID: ${bookId}`);

  let gutenbergId = bookId;
  
  // If it's not a numeric Gutenberg ID, try to map from title
  if (!/^\d+$/.test(bookId)) {
    const mappedId = getGutenbergIdFromTitle(bookId);
    if (mappedId) {
      gutenbergId = mappedId;
      console.log(`📚 Mapped "${bookId}" to Gutenberg ID: ${gutenbergId}`);
    } else {
      console.log(`❌ No Gutenberg ID mapping found for: ${bookId}`);
      return null;
    }
  }

  // Try multiple Gutenberg sources with the resolved ID
  const gutenbergSources = [
    {
      name: 'Project Gutenberg Files',
      url: `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}-0.txt`,
    },
    {
      name: 'Project Gutenberg UTF-8',
      url: `https://www.gutenberg.org/ebooks/${gutenbergId}.txt.utf-8`,
    },
    {
      name: 'Project Gutenberg Plain',
      url: `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}.txt`,
    }
  ];

  for (const source of gutenbergSources) {
    try {
      console.log(`🔍 Trying ${source.name} for book ${gutenbergId} (${bookId})`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TypingSpeedApp/1.0)' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const content = await response.text();
        if (content.length > 2000 && !content.includes('404') && !content.includes('Not Found')) {
          console.log(`✅ Successfully fetched from ${source.name} (${content.length} chars)`);
          return { content, source: source.name };
        } else {
          console.log(`⚠️ ${source.name} returned content but quality insufficient`);
        }
      } else {
        console.log(`❌ ${source.name} returned status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${source.name} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`❌ Could not find real content for book ${bookId} (Gutenberg ID: ${gutenbergId})`);
  return null;
}

export default router;
