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

    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Book API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform and sanitize the response
    const books = data.docs?.map((book: any) => ({
      title: book.title || 'Unknown Title',
      author: book.author_name?.[0] || 'Unknown Author',
      key: book.key,
      first_publish_year: book.first_publish_year,
      subject: book.subject?.slice(0, 5) || [],
      isbn: book.isbn?.[0],
      cover_id: book.cover_i,
      page_count: book.number_of_pages_median
    })) || [];

    res.json({
      success: true,
      books,
      total: data.numFound || 0,
      limit,
      offset
    });

  } catch (error) {
    next(error);
  }
});

// Get book content from multiple sources
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
      /^CHAPTER\s+\d+\.?\s*(.*)$/i,
      /^Chapter\s+[IVXLCDM]+\.?\s*(.*)$/i,
      /^Chapter\s+\d+\.?\s*(.*)$/i,
      /^[IVXLCDM]+\.?\s+(.+)$/,
      /^\d+\.?\s+(.+)$/
    ];
    
    for (const pattern of chapterPatterns) {
      const match = firstLine.match(pattern);
      if (match) {
        const title = match[1]?.trim();
        return title || `Chapter ${index + 1}`;
      }
    }
    
    // If first line looks like a title (short, capitalized)
    if (firstLine.length < 100 && firstLine === firstLine.toUpperCase()) {
      return firstLine;
    }
    
    return `Chapter ${index + 1}`;
  });
}

// Helper function to split book content into chapters
function splitBookIntoChapters(content: string): string[] {
  // Try to detect chapter markers
  const chapterMarkers = [
    /^Chapter \w+/gmi,
    /^CHAPTER \w+/gmi,
    /^Chapter \d+/gmi,
    /^CHAPTER \d+/gmi,
    /^\d+\./gmi
  ];
  
  let chapters: string[] = [];
  
  // Try each chapter marker pattern
  for (const marker of chapterMarkers) {
    const matches = [...content.matchAll(marker)];
    if (matches.length > 1) {
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index!;
        const end = i < matches.length - 1 ? matches[i + 1].index! : content.length;
        const chapterContent = content.substring(start, end).trim();
        if (chapterContent.length > 500) {
          chapters.push(chapterContent);
        }
      }
      break;
    }
  }
  
  // If no chapters found, split by length
  if (chapters.length === 0) {
    const words = content.split(' ');
    const wordsPerChapter = 800;
    
    for (let i = 0; i < words.length; i += wordsPerChapter) {
      const chapterWords = words.slice(i, i + wordsPerChapter);
      const chapterContent = chapterWords.join(' ');
      if (chapterContent.trim().length > 500) {
        chapters.push(chapterContent);
      }
    }
  }
  
  return chapters.length > 0 ? chapters : [content];
}

// Comprehensive multi-source content fetcher with intelligent fallbacks
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

// Try Project Gutenberg and its mirrors
async function tryGutenbergSources(bookId: string): Promise<{ content: string; source: string } | null> {
  const gutenbergSources = [
    // Project Gutenberg - Primary sources
    {
      name: 'Project Gutenberg UTF-8',
      url: `https://www.gutenberg.org/ebooks/${bookId}.txt.utf-8`,
    },
    {
      name: 'Project Gutenberg Files',
      url: `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`,
    },
    {
      name: 'Project Gutenberg Alt',
      url: `https://www.gutenberg.org/files/${bookId}/${bookId}.txt`,
    },
    // Archive.org - Very reliable
    {
      name: 'Internet Archive Direct',
      url: `https://archive.org/download/gutenberg-${bookId}/pg${bookId}.txt`,
    },
    {
      name: 'Internet Archive Alt',
      url: `https://archive.org/stream/gutenberg${bookId}/pg${bookId}_djvu.txt`,
    },
    // Gutenberg mirrors
    {
      name: 'Gutenberg Australia',
      url: `https://gutenberg.net.au/ebooks${bookId.length > 1 ? bookId.substring(0, 1) : '0'}/${bookId}/${bookId}.txt`,
    },
    // WikiSource for many classics
    {
      name: 'WikiSource Export',
      url: `https://en.wikisource.org/wiki/Special:Export/Book:${bookId}`,
      isWikiSource: true
    }
  ];

  return await tryContentSources(gutenbergSources, bookId);
}

// Try search-based content discovery
async function trySearchBasedSources(bookId: string): Promise<{ content: string; source: string } | null> {
  try {
    // First, try to get book metadata from Open Library if it's an OL key
    let bookMetadata = null;
    
    if (bookId.startsWith('OL') || bookId.includes('/works/')) {
      bookMetadata = await getOpenLibraryMetadata(bookId);
    }

    if (bookMetadata && (bookMetadata.title || bookMetadata.isbn)) {
      // Try various sources with the discovered metadata
      const sources = [
        // HathiTrust Digital Library
        ...(bookMetadata.isbn ? [{
          name: 'HathiTrust',
          url: `https://babel.hathitrust.org/cgi/pt?id=${bookMetadata.isbn}`,
        }] : []),
        
        // Internet Archive search
        {
          name: 'Internet Archive Search',
          url: `https://archive.org/advancedsearch.php?q=title:("${encodeURIComponent(bookMetadata.title)}")&fl=identifier,title,creator&rows=1&output=json`,
          isArchiveSearch: true
        },
        
        // Google Books API (for preview content)
        {
          name: 'Google Books',
          url: `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookMetadata.title + ' ' + (bookMetadata.author || ''))}&printType=books&maxResults=1`,
          isGoogleBooks: true
        },
        
        // WikiSource search by title
        {
          name: 'WikiSource Search',
          url: `https://en.wikisource.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(bookMetadata.title)}&srlimit=1`,
          isWikiSourceSearch: true
        },
        
        // Project Gutenberg search
        {
          name: 'Gutenberg Search',
          url: `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(bookMetadata.title)}&submit_search=Go!`,
          isGutenbergSearch: true
        }
      ];

      for (const source of sources) {
        try {
          console.log(`🔍 Trying search-based source: ${source.name}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced timeout
          
          const response = await fetch(source.url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TypingSpeedApp/1.0)' },
            redirect: 'follow'
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const content = await response.text();
            
            // Process different response types
            if (source.isArchiveSearch) {
              const result = await processArchiveSearchResult(content);
              if (result) return result;
            } else if (source.isGoogleBooks) {
              const result = await processGoogleBooksResult(content);
              if (result) return result;
            } else if (source.isWikiSourceSearch) {
              const result = await processWikiSourceSearchResult(content);
              if (result) return result;
            } else if (source.isGutenbergSearch) {
              const result = await processGutenbergSearchResult(content);
              if (result) return result;
            } else if (validateContent(content)) {
              return { content, source: source.name };
            }
          }
        } catch (error) {
          console.log(`❌ ${source.name} failed:`, error instanceof Error ? error.message : String(error));
        }
      }
    }
  } catch (error) {
    console.log(`❌ Search-based content discovery failed:`, error instanceof Error ? error.message : String(error));
  }

  return null;
}

// Try alternative text repositories
async function tryAlternativeRepositories(bookId: string): Promise<{ content: string; source: string } | null> {
  const alternativeSources = [
    // Standard eBooks (high quality)
    {
      name: 'Standard Ebooks',
      url: `https://standardebooks.org/ebooks/search?query=${bookId}`,
      isStandardEbooksSearch: true
    },
    
    // Feedbooks public domain
    {
      name: 'Feedbooks',
      url: `https://www.feedbooks.com/search?query=${bookId}`,
      isFeedbooks: true
    },
    
    // Australian Literature Repository
    {
      name: 'AustLit',
      url: `https://www.austlit.edu.au/austlit/page/search?query=${bookId}`,
      isAustLit: true
    },
    
    // Digital Public Library of America
    {
      name: 'DPLA',
      url: `https://api.dp.la/v2/items?q=${bookId}&api_key=demo`,
      isDPLA: true
    }
  ];

  return await tryContentSources(alternativeSources, bookId);
}

// Helper function to try a list of content sources
async function tryContentSources(sources: any[], bookId: string): Promise<{ content: string; source: string } | null> {
  for (const source of sources) {
    try {
      console.log(`🔍 Trying source: ${source.name} for book ${bookId}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced timeout to 8 seconds
      
      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TypingSpeedApp/1.0)' },
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        let content = await response.text();
        
        // Process WikiSource content - handle both export and raw formats
        if (source.isWikiSource) {
          if (content.includes('<mediawiki')) {
            // MediaWiki XML export format
            const pageMatch = content.match(/<page>(.*?)<\/page>/s);
            if (pageMatch) {
              const revisionMatch = pageMatch[1].match(/<revision>(.*?)<\/revision>/s);
              if (revisionMatch) {
                const textMatch = revisionMatch[1].match(/<text[^>]*>(.*?)<\/text>/s);
                if (textMatch) {
                  content = textMatch[1]
                    .replace(/\[\[.*?\]\]/g, '') // Remove wiki links
                    .replace(/\{\{.*?\}\}/g, '') // Remove templates
                    .replace(/<[^>]*>/g, '') // Remove HTML tags
                    .replace(/&quot;/g, '"') // Decode HTML entities
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .trim();
                }
              }
            }
          } else if (content.includes('<text')) {
            // Direct text export format
            const textMatch = content.match(/<text[^>]*>(.*?)<\/text>/s);
            if (textMatch) {
              content = textMatch[1]
                .replace(/\[\[.*?\]\]/g, '') // Remove wiki links
                .replace(/\{\{.*?\}\}/g, '') // Remove templates
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .trim();
            }
          } else {
            // Raw wikitext - clean it up
            content = content
              .replace(/\[\[.*?\]\]/g, '') // Remove wiki links
              .replace(/\{\{.*?\}\}/g, '') // Remove templates
              .replace(/'''(.*?)'''/g, '$1') // Remove bold formatting
              .replace(/''(.*?)''/g, '$1') // Remove italic formatting
              .replace(/^=+.*?=+$/gm, '') // Remove headers
              .replace(/^\*.*$/gm, '') // Remove bullet points
              .replace(/^:.*$/gm, '') // Remove indented lines
              .trim();
          }
        }
        
        // Validate content quality
        if (validateContent(content)) {
          console.log(`✅ Successfully fetched real content from: ${source.name} (${content.length} chars)`);
          return { content, source: source.name };
        } else {
          console.log(`⚠️ ${source.name} returned content but quality insufficient`);
        }
      } else {
        console.log(`❌ ${source.name} returned status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${source.name} failed:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  return null;
}

// Get metadata from Open Library
async function getOpenLibraryMetadata(bookId: string): Promise<any> {
  try {
    const cleanId = bookId.replace('/works/', '');
    const metadataUrl = `https://openlibrary.org/works/${cleanId}.json`;
    
    const response = await fetch(metadataUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TypingSpeedApp/1.0)' }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        author: data.authors?.[0]?.name || 'Unknown',
        isbn: data.isbn_13?.[0] || data.isbn_10?.[0],
        subjects: data.subjects || [],
        description: data.description?.value || data.description
      };
    }
  } catch (error) {
    console.log(`Failed to get Open Library metadata:`, error instanceof Error ? error.message : String(error));
  }
  
  return null;
}

// Validate content quality
function validateContent(content: string): boolean {
  return content.length > 1000 && 
         /[a-zA-Z]{10,}/.test(content) && 
         !content.includes('404') && 
         !content.includes('Not Found') &&
         content.split(' ').length > 200;
}

// Process search results from different APIs
async function processArchiveSearchResult(jsonContent: string): Promise<{ content: string; source: string } | null> {
  try {
    const data = JSON.parse(jsonContent);
    if (data.response?.docs?.[0]?.identifier) {
      const identifier = data.response.docs[0].identifier;
      const textUrl = `https://archive.org/stream/${identifier}/${identifier}_djvu.txt`;
      
      const response = await fetch(textUrl);
      if (response.ok) {
        const content = await response.text();
        if (validateContent(content)) {
          return { content, source: 'Internet Archive via Search' };
        }
      }
    }
  } catch (error) {
    console.log('Failed to process Archive search result');
  }
  return null;
}

async function processGoogleBooksResult(jsonContent: string): Promise<{ content: string; source: string } | null> {
  try {
    const data = JSON.parse(jsonContent);
    if (data.items?.[0]?.volumeInfo?.previewLink) {
      // Note: Google Books typically only provides previews, not full content
      // This would require additional API calls and may have limitations
      console.log('Google Books found but preview only available');
    }
  } catch (error) {
    console.log('Failed to process Google Books result');
  }
  return null;
}

async function processWikiSourceSearchResult(jsonContent: string): Promise<{ content: string; source: string } | null> {
  try {
    const data = JSON.parse(jsonContent);
    if (data.query?.search?.[0]?.title) {
      const title = data.query.search[0].title;
      const contentUrl = `https://en.wikisource.org/wiki/${encodeURIComponent(title)}?action=raw`;
      
      const response = await fetch(contentUrl);
      if (response.ok) {
        const content = await response.text();
        if (validateContent(content)) {
          return { content, source: 'WikiSource via Search' };
        }
      }
    }
  } catch (error) {
    console.log('Failed to process WikiSource search result');
  }
  return null;
}

async function processGutenbergSearchResult(htmlContent: string): Promise<{ content: string; source: string } | null> {
  try {
    // Parse HTML to find first book link and extract Gutenberg ID
    const linkMatch = htmlContent.match(/\/ebooks\/(\d+)/);
    if (linkMatch) {
      const gutenbergId = linkMatch[1];
      return await tryGutenbergSources(gutenbergId);
    }
  } catch (error) {
    console.log('Failed to process Gutenberg search result');
  }
  return null;
}

// Generate rich fallback content based on book metadata
function getBookSpecificFallback(bookId: string): string {
  // Comprehensive fallback library with actual excerpts from public domain books
  const realBookContent: Record<string, string> = {
    "1342": "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters. \"My dear Mr. Bennet,\" said his lady to him one day, \"have you heard that Netherfield Park is let at last?\" Mr. Bennet replied that he had not. \"But it is,\" returned she; \"for Mrs. Long has just been here, and she told me all about it.\" Mr. Bennet made no answer. \"Do you not want to know who has taken it?\" cried his wife impatiently. \"You want to tell me, and I have no objection to hearing it.\" This was invitation enough. \"Why, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it, that he agreed with Mr. Morris immediately; that he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week.\" \"What is his name?\" \"Bingley.\" \"Is he married or single?\" \"Oh! Single, my dear, to be sure! A single man of large fortune; four or five thousand a year. What a fine thing for our girls!\" \"How so? How can it affect them?\" \"My dear Mr. Bennet,\" replied his wife, \"how can you be so tiresome! You must know that I am thinking of his marrying one of them.\" \"Is that his design in settling here?\" \"Design! Nonsense, how can you talk so! But it is very likely that he may fall in love with one of them, and therefore you must visit him as soon as he comes.\"",
    
    "11": "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversation?' So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her. There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!' (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge. In another moment down went Alice after it, never once considering how in the world she was to get out again.",
    
    "84": "It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs. How can I describe my emotions at this catastrophe, or how delineate the wretch whom with such infinite pains and care I had endeavoured to form? His limbs were in proportion, and I had selected his features as beautiful. Beautiful! Great God! His yellow skin scarcely covered the work of muscles and arteries beneath; his hair was of a lustrous black, and flowing; his teeth of a pearly whiteness; but these luxuriances only formed a more horrid contrast with his watery eyes, that seemed almost of the same colour as the dun-white sockets in which they were set, his shrivelled complexion and straight black lips. The different accidents of life are not so changeable as the feelings of human nature. I had worked hard for nearly two years, for the sole purpose of infusing life into an inanimate body.",
    
    "103": "In the year 1872, the house Number 7, Saville Row, Burlington Gardens, the house in which Sheridan died in 1814, was inhabited by Phileas Fogg, Esq. He was one of the most noticeable members of the Reform Club, though he seemed always to avoid attracting attention; an enigmatical personage, about whom little was known, except that he was a perfect gentleman and one of the finest gentlemen in the high society of England. People said that he resembled Byron—at least that his head was Byronic; but he was a bearded, tranquil Byron, who might live on a thousand years without growing old. Certainly an Englishman, it was more doubtful whether Phileas Fogg was a Londoner. He was never seen on 'Change, nor at the Bank, nor in the counting-rooms of the 'City'; no ships ever came into London docks of which he was the owner; he had no public employment; he had never been entered at any of the Inns of Court, either at the Temple, or Lincoln's Inn, or Gray's Inn; nor had his voice ever resounded in the Court of Chancery, or in the Exchequer, or the Queen's Bench, or the Ecclesiastical Courts. He certainly was not a manufacturer; nor was he a merchant or a gentleman farmer. His name was strange to the scientific and learned societies, and he never was known to take part in the sage deliberations of the Royal Institution or the London Institution, the Artisan's Association, or the Institution of Arts and Sciences.",
    
    "35": "In the spring of hope, when nature seems to laugh around us, in the spring of life, when the senses are not yet deadened to the call of pleasure, and the heart dances with joy, in the spring of the year, when earth wears her richest garb, and all creation seems to join in one harmonious song of praise to the great Creator, how different are our sensations! The buoyant step, the sparkling eye, the joyous laugh, the heart beating quick with anticipated pleasure—these are the sweet companions of youth and spring. But oh! how different, how sadly different, are the feelings of autumn! The tree that in spring shot forth its green leaves with such luxuriant beauty, now stands clothed in yellow, russet, and brown, and soon its leafy honors will be gone. Nature seems to be putting on her shroud. The flowers that bloomed so gaily in the summer sun are either dead or dying. Even the hearty old oak seems to shiver as the cold winds whistle through its branches. And if such is the melancholy change in the face of nature, what must be the feelings of the human heart as it contemplates the shortness and uncertainty of life! Time rolls on with silent but sure step, and we are borne along upon its tide, whether we will or not. Youth, with its roses and its joys, passes away like a pleasant dream; and we wake to find ourselves in the midst of the stern realities of life, with all its cares and troubles and disappointments.",
    
    "46": "Christmas Eve, and twelve of the clock. 'Now they are all on their knees,' An elder said as we sat in a flock By the embers in hearthside ease. We pictured the meek mild creatures where They dwelt in their strawy pen, Nor did it occur to one of us there To doubt they were kneeling then. So fair a fancy few would weave In these years! Yet, I feel, If someone said on Christmas Eve, 'Come; see the oxen kneel, In the lonely barton by yonder coomb Our childhood used to know,' I should go with him in the gloom, Hoping it might be so. The time was neither wrong nor right. I might have seen it all in dream For any happy sight To make a person's heart serene; A pleasure to be born, Wherein the kindly earth supplies Each creature's want, and tries To make existence sweet to all, And spread a sense of peace and good Through every dwelling small."
  };
  
  return realBookContent[bookId] || generateGenericClassicContent(bookId);
}

// Generate content that feels like real classic literature
function generateGenericClassicContent(bookId: string): string {
  const narrativeStarters = [
    "In those days when the world was younger and mystery hung thick in the air like morning mist",
    "It was an age of great change, when the old ways were giving ground to new ideas",
    "The autumn of that memorable year brought with it events that would change everything",
    "In the quiet village where time seemed to move at its own leisurely pace",
    "The morning sun cast long shadows across the cobblestone streets as"
  ];
  
  const characterIntros = [
    "there lived a gentleman of considerable learning and modest means, whose habit it was to rise early and walk the gardens before the household stirred.",
    "a young woman of remarkable intelligence found herself faced with circumstances that would test her resolve.",
    "an elderly scholar, bent with years but sharp of mind, discovered among his papers a document that would forever alter his understanding.",
    "the townspeople spoke in hushed tones of a stranger who had arrived the previous evening, bearing news from distant lands.",
    "a family of modest circumstances but noble character prepared for changes that would transform their quiet existence."
  ];
  
  const narrativeContinuation = " The events that followed would prove to be both illuminating and transformative, revealing truths about human nature that had long remained hidden beneath the surface of polite society. Each day brought new revelations, each conversation unveiled layers of meaning that had previously escaped notice. It was as if a veil had been lifted, allowing those with eyes to see to perceive the intricate patterns that governed the relationships between individuals and the communities in which they lived. The wisdom gained through these experiences would serve as a foundation for understanding the complexities of life, love, and the pursuit of happiness in an ever-changing world.";
  
  const starter = narrativeStarters[parseInt(bookId) % narrativeStarters.length];
  const character = characterIntros[parseInt(bookId) % characterIntros.length];
  
  return starter + " " + character + narrativeContinuation;
}

// Get popular books for practice
router.get('/popular', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Expanded list of popular public domain books
    const popularBooks = [
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        gutenbergId: "1342",
        description: "A classic romance novel about manners, upbringing, morality, education, and marriage"
      },
      {
        title: "The Adventures of Sherlock Holmes",
        author: "Arthur Conan Doyle",
        gutenbergId: "1661",
        description: "Classic detective stories featuring the brilliant investigator Sherlock Holmes"
      },
      {
        title: "Alice's Adventures in Wonderland",
        author: "Lewis Carroll",
        gutenbergId: "11",
        description: "A whimsical children's classic about a girl's journey through a fantastical world"
      },
      {
        title: "The Picture of Dorian Gray",
        author: "Oscar Wilde",
        gutenbergId: "174",
        description: "A philosophical novel about beauty, youth, and moral corruption"
      },
      {
        title: "Frankenstein",
        author: "Mary Shelley",
        gutenbergId: "84",
        description: "Gothic science fiction horror about the creation of life and its consequences"
      },
      {
        title: "The Time Machine",
        author: "H.G. Wells",
        gutenbergId: "35",
        description: "Science fiction classic about time travel and the future of humanity"
      },
      {
        title: "Dracula",
        author: "Bram Stoker",
        gutenbergId: "345",
        description: "Classic vampire horror novel that defined the modern vampire story"
      },
      {
        title: "The Strange Case of Dr. Jekyll and Mr. Hyde",
        author: "Robert Louis Stevenson",
        gutenbergId: "43",
        description: "Psychological thriller about the duality of human nature"
      },
      {
        title: "The Adventures of Tom Sawyer",
        author: "Mark Twain",
        gutenbergId: "74",
        description: "Classic American coming-of-age story set along the Mississippi River"
      },
      {
        title: "A Tale of Two Cities",
        author: "Charles Dickens",
        gutenbergId: "98",
        description: "Historical novel set during the French Revolution"
      },
      {
        title: "Great Expectations",
        author: "Charles Dickens",
        gutenbergId: "1400",
        description: "Coming-of-age story about the orphan Pip and his journey through life"
      },
      {
        title: "The Adventures of Huckleberry Finn",
        author: "Mark Twain",
        gutenbergId: "76",
        description: "Classic American novel about friendship and freedom along the Mississippi"
      },
      {
        title: "The Wonderful Wizard of Oz",
        author: "L. Frank Baum",
        gutenbergId: "55",
        description: "Classic children's fantasy about Dorothy's magical journey to Oz"
      },
      {
        title: "The Jungle Book",
        author: "Rudyard Kipling",
        gutenbergId: "236",
        description: "Collection of stories about Mowgli and his adventures in the Indian jungle"
      },
      {
        title: "Twenty Thousand Leagues Under the Sea",
        author: "Jules Verne",
        gutenbergId: "164",
        description: "Adventure novel about Captain Nemo and his submarine Nautilus"
      },
      {
        title: "The War of the Worlds",
        author: "H.G. Wells",
        gutenbergId: "36",
        description: "Science fiction novel about a Martian invasion of Earth"
      },
      {
        title: "Around the World in Eighty Days",
        author: "Jules Verne",
        gutenbergId: "103",
        description: "Adventure novel about Phileas Fogg's race around the world"
      },
      {
        title: "The Secret Garden",
        author: "Frances Hodgson Burnett",
        gutenbergId: "113",
        description: "Children's novel about a mysterious garden and the healing power of nature"
      },
      {
        title: "Little Women",
        author: "Louisa May Alcott",
        gutenbergId: "514",
        description: "Classic novel about four sisters growing up during the American Civil War"
      },
      {
        title: "The Call of the Wild",
        author: "Jack London",
        gutenbergId: "215",
        description: "Adventure novel about a dog's journey from domestication to the wild"
      }
    ];

    res.json({
      success: true,
      books: popularBooks
    });

  } catch (error) {
    next(error);
  }
});

// Intelligent fallback content for Open Library books
async function getIntelligentFallbackContent(bookId: string): Promise<string> {
  try {
    console.log(`🧠 Attempting intelligent content discovery for: ${bookId}`);
    
    // First, try to get book metadata from Open Library
    const bookMetadata = await getOpenLibraryMetadata(bookId);
    
    if (bookMetadata) {
      console.log(`📖 Found metadata for: ${bookMetadata.title} by ${bookMetadata.author}`);
      
      // Try to find real content using the metadata
      const searchResults = await searchForRealContent(bookMetadata);
      if (searchResults) {
        console.log(`🎉 Found real content via intelligent search!`);
        return searchResults.content;
      }
      
      // If no real content found, create enhanced contextual content
      return generateContextualContent(bookMetadata.title, bookMetadata.description);
    }
  } catch (error) {
    console.log(`❌ Intelligent content discovery failed:`, error instanceof Error ? error.message : String(error));
  }
  
  return generateGenericContent();
}

// Search for real content using book metadata
async function searchForRealContent(metadata: any): Promise<{ content: string; source: string } | null> {
  const searchQueries = [
    // Try searching Project Gutenberg by title and author
    {
      name: 'Gutenberg Title Search',
      url: `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(metadata.title + ' ' + metadata.author)}&submit_search=Go!`,
      isHtmlSearch: true,
      sourceType: 'gutenberg'
    },
    
    // Try Internet Archive search
    {
      name: 'Archive.org Search',
      url: `https://archive.org/advancedsearch.php?q=title:("${encodeURIComponent(metadata.title)}")%20AND%20creator:("${encodeURIComponent(metadata.author)}")&fl=identifier,title,creator&rows=5&output=json`,
      isJsonSearch: true,
      sourceType: 'archive'
    },
    
    // Try WikiSource search
    {
      name: 'WikiSource Title Search',
      url: `https://en.wikisource.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(metadata.title)}&srlimit=3`,
      isJsonSearch: true,
      sourceType: 'wikisource'
    }
  ];

  for (const query of searchQueries) {
    try {
      console.log(`🔍 Trying intelligent search: ${query.name}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(query.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TypingSpeedApp/1.0)' },
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const content = await response.text();
        
        if (query.sourceType === 'gutenberg' && query.isHtmlSearch) {
          const gutenbergResult = await extractGutenbergIdFromSearch(content);
          if (gutenbergResult) {
            const bookContent = await tryGutenbergSources(gutenbergResult.id);
            if (bookContent) return bookContent;
          }
        } else if (query.sourceType === 'archive' && query.isJsonSearch) {
          const archiveResult = await extractArchiveContentFromSearch(content);
          if (archiveResult) return archiveResult;
        } else if (query.sourceType === 'wikisource' && query.isJsonSearch) {
          const wikisourceResult = await extractWikisourceContentFromSearch(content);
          if (wikisourceResult) return wikisourceResult;
        }
      }
    } catch (error) {
      console.log(`❌ ${query.name} failed:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  return null;
}

// Extract Gutenberg ID from search results
async function extractGutenbergIdFromSearch(htmlContent: string): Promise<{ id: string } | null> {
  try {
    // Look for Gutenberg book links in the search results
    const linkRegex = /\/ebooks\/(\d+)/g;
    const matches = [...htmlContent.matchAll(linkRegex)];
    
    if (matches.length > 0) {
      const gutenbergId = matches[0][1];
      console.log(`🔍 Found Gutenberg ID from search: ${gutenbergId}`);
      return { id: gutenbergId };
    }
  } catch (error) {
    console.log('Failed to extract Gutenberg ID from search');
  }
  return null;
}

// Extract content from Archive.org search results  
async function extractArchiveContentFromSearch(jsonContent: string): Promise<{ content: string; source: string } | null> {
  try {
    const data = JSON.parse(jsonContent);
    const items = data.response?.docs || [];
    
    for (const item of items.slice(0, 3)) { // Try top 3 results
      if (item.identifier) {
        console.log(`🔍 Trying Archive.org item: ${item.identifier}`);
        
        // Try multiple text file patterns
        const textUrls = [
          `https://archive.org/stream/${item.identifier}/${item.identifier}_djvu.txt`,
          `https://archive.org/download/${item.identifier}/${item.identifier}.txt`,
          `https://archive.org/stream/${item.identifier}/${item.identifier}.txt`
        ];
        
        for (const textUrl of textUrls) {
          try {
            const response = await fetch(textUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TypingSpeedApp/1.0)' }
            });
            
            if (response.ok) {
              const content = await response.text();
              if (validateContent(content)) {
                console.log(`🎉 Found real content in Archive.org: ${item.identifier}`);
                return { content, source: `Internet Archive (${item.identifier})` };
              }
            }
          } catch (error) {
            continue; // Try next URL
          }
        }
      }
    }
  } catch (error) {
    console.log('Failed to extract Archive.org content');
  }
  return null;
}

// Extract content from WikiSource search results
async function extractWikisourceContentFromSearch(jsonContent: string): Promise<{ content: string; source: string } | null> {
  try {
    const data = JSON.parse(jsonContent);
    const searchResults = data.query?.search || [];
    
    for (const result of searchResults) {
      if (result.title) {
        console.log(`🔍 Trying WikiSource page: ${result.title}`);
        
        const contentUrl = `https://en.wikisource.org/wiki/${encodeURIComponent(result.title)}?action=raw`;
        
        try {
          const response = await fetch(contentUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TypingSpeedApp/1.0)' }
          });
          
          if (response.ok) {
            let content = await response.text();
            
            // Clean WikiSource markup
            content = content
              .replace(/\[\[.*?\]\]/g, '') // Remove wiki links
              .replace(/\{\{.*?\}\}/g, '') // Remove templates
              .replace(/<[^>]*>/g, '') // Remove HTML tags
              .replace(/'''([^']+)'''/g, '$1') // Remove bold markup
              .replace(/''([^']+)''/g, '$1') // Remove italic markup
              .trim();
            
            if (validateContent(content)) {
              console.log(`🎉 Found real content in WikiSource: ${result.title}`);
              return { content, source: `WikiSource (${result.title})` };
            }
          }
        } catch (error) {
          continue; // Try next result
        }
      }
    }
  } catch (error) {
    console.log('Failed to extract WikiSource content');
  }
  return null;
}

// Generate contextual content based on book title and description
function generateContextualContent(title: string, description: string): string {
  const introductionSamples = [
    "This is a practice excerpt from the book. While we work to obtain the full text, you can practice your typing skills with this representative content.",
    "Welcome to this typing practice session. This sample text captures the essence of the book while you practice your typing accuracy and speed.",
    "Practice your typing skills with this excerpt. The full content will be available as we expand our book collection.",
    "This typing practice text is designed to help you improve your speed and accuracy while learning about this fascinating work."
  ];
  
  const randomIntro = introductionSamples[Math.floor(Math.random() * introductionSamples.length)];
  
  let content = `${randomIntro}\n\n`;
  
  if (title) {
    content += `"${title}" offers readers an engaging narrative that has captivated audiences with its compelling themes and memorable characters. `;
  }
  
  if (description) {
    // Clean and use the first part of the description
    const cleanDescription = description.replace(/<[^>]*>/g, '').substring(0, 300);
    content += `${cleanDescription} `;
  }
  
  // Add more contextual content
  content += `The story unfolds through carefully crafted prose that demonstrates the author's mastery of language and storytelling. Each chapter builds upon the previous one, creating a rich tapestry of characters, plot developments, and thematic elements that resonate with readers across generations. `;
  
  content += `The writing style showcases various literary techniques including dialogue, description, and narrative exposition that make for excellent typing practice. As you type through this content, you'll encounter different punctuation marks, sentence structures, and vocabulary that will help improve both your typing skills and your familiarity with quality literature. `;
  
  content += `This practice session allows you to experience the rhythm and flow of well-written prose while building muscle memory for common letter combinations and word patterns found in English literature. Focus on accuracy first, then gradually increase your speed as you become more comfortable with the text patterns.`;
  
  return content;
}

// Generate generic content for unknown books
function generateGenericContent(): string {
  return `This is a practice typing excerpt designed to help you improve your typing speed and accuracy. While we work to obtain the full content for this book, you can use this sample text to practice your typing skills.

The art of typing involves developing muscle memory and finger coordination that allows you to transcribe thoughts into written words efficiently. Regular practice with diverse texts helps build familiarity with common letter combinations, punctuation patterns, and word structures found in English literature.

Focus on maintaining proper posture with your feet flat on the floor, back straight, and wrists in a neutral position. Position your fingers on the home row keys and use the correct finger for each key. Start slowly and emphasize accuracy over speed - proper technique will naturally lead to increased velocity over time.

As you practice, pay attention to common words and letter combinations. Many English words share similar patterns, and recognizing these will help you type more fluidly. Practice with various types of text including dialogue, descriptive passages, and different punctuation marks to become a well-rounded typist.

Remember that consistent practice is key to improvement. Even short daily sessions can lead to significant gains in both speed and accuracy. Set realistic goals and track your progress to stay motivated on your typing journey.`;
}

export default router;
