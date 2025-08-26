import React, { useState, useEffect } from 'react';
import { Search, Book, RefreshCw, ChevronLeft, ChevronRight, BookOpen, Bookmark, Download } from 'lucide-react';
import TypingTestComponent from './TypingTestComponent';
import { API_BASE_URL } from '../../config/api';

interface Book {
  title: string;
  author: string;
  gutenbergId?: string;
  key?: string;
  description?: string;
  subject?: string[];
  cover_id?: number;
}

interface BookContent {
  success: boolean;
  bookId: string;
  excerpt?: string;
  content?: string;
  fullContentAvailable: boolean;
  totalChapters?: number;
  currentChapter?: number;
  chapterTitles?: string[];
  source?: string;
  isRealContent?: boolean;
  contentType?: 'authentic' | 'enhanced-sample';
}

interface BookProgress {
  bookId: string;
  bookTitle: string;
  currentChapter: number;
  currentPosition: number;
  completedChapters: number[];
  totalChapters: number;
  totalWordsTyped: number;
  averageWpm: number;
  startedAt: Date;
  lastUpdated: Date;
  progressPercentage: number;
}

const BookPracticeComponent: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookContent, setBookContent] = useState<string>('');
  const [fullBookContent, setFullBookContent] = useState<string[]>([]);
  const [chapterTitles, setChapterTitles] = useState<string[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [bookProgress, setBookProgress] = useState<BookProgress | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'title' | 'author' | 'subject'>('title');
  const [isFullBookMode, setIsFullBookMode] = useState(false);
  const [contentSource, setContentSource] = useState<string>('');
  const [isRealContent, setIsRealContent] = useState<boolean>(false);

  // Load popular books on component mount
  useEffect(() => {
    loadPopularBooks();
  }, []);

  // Save book progress to localStorage
  const saveBookProgress = (progress: BookProgress) => {
    localStorage.setItem('bookTypingProgress', JSON.stringify(progress));
    setBookProgress(progress);
  };

  const loadPopularBooks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/books/popular`);
      
      if (!response.ok) {
        throw new Error('Failed to load popular books');
      }
      
      const data = await response.json();
      if (data.success) {
        setBooks(data.books);
      }
    } catch (err) {
      console.error('Error loading popular books, using fallback content:', err);
      // Show a good selection of popular books when backend is unavailable
      setBooks([
        {
          title: "Pride and Prejudice",
          author: "Jane Austen",
          description: "A classic romance novel about Elizabeth Bennet and Mr. Darcy",
          gutenbergId: "1342",
          subject: ["Romance", "Classic Literature", "British Literature"]
        },
        {
          title: "The Adventures of Alice in Wonderland",
          author: "Lewis Carroll",
          description: "A whimsical tale of a girl who falls down a rabbit hole",
          gutenbergId: "11",
          subject: ["Fantasy", "Children's Literature", "Adventure"]
        },
        {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          description: "A story of the Jazz Age and the American Dream",
          gutenbergId: "64317",
          subject: ["Classic Literature", "American Literature", "Drama"]
        },
        {
          title: "The Adventures of Sherlock Holmes",
          author: "Arthur Conan Doyle",
          description: "Classic detective stories featuring Sherlock Holmes",
          gutenbergId: "1661",
          subject: ["Mystery", "Detective Fiction", "Classic Literature"]
        },
        {
          title: "Frankenstein",
          author: "Mary Shelley",
          description: "The original science fiction novel about creating life",
          gutenbergId: "84",
          subject: ["Science Fiction", "Gothic Fiction", "Horror"]
        },
        {
          title: "The Time Machine",
          author: "H. G. Wells",
          description: "A journey through time to the distant future",
          gutenbergId: "35",
          subject: ["Science Fiction", "Time Travel", "Classic Literature"]
        },
        {
          title: "Little Women",
          author: "Louisa May Alcott",
          description: "The story of the four March sisters growing up during the Civil War",
          gutenbergId: "514",
          subject: ["Family", "Coming of Age", "American Literature"]
        },
        {
          title: "The Adventures of Tom Sawyer",
          author: "Mark Twain",
          description: "A boy's adventures along the Mississippi River",
          gutenbergId: "74",
          subject: ["Adventure", "Coming of Age", "American Literature"]
        }
      ]);
      setError(null); // Clear error since we have fallback content
    } finally {
      setIsLoading(false);
    }
  };

  const searchBooks = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        query: searchQuery,
        type: searchType,
        limit: '20'
      });
      
      const response = await fetch(`${API_BASE_URL}/api/books/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to search books');
      }
      
      const data = await response.json();
      if (data.success) {
        setBooks(data.books);
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (err) {
      console.error('Error searching books, using fallback search:', err);
      // Fallback search using local book library
      const results = performFallbackSearch(searchQuery, searchType);
      setBooks(results);
      setError(null); // Clear error since we have fallback results
    } finally {
      setIsLoading(false);
    }
  };

  const performFallbackSearch = (query: string, type: string): Book[] => {
    const fallbackBooks: Book[] = [
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        description: "A classic romance novel about Elizabeth Bennet and Mr. Darcy",
        gutenbergId: "1342",
        subject: ["Romance", "Classic Literature", "British Literature"]
      },
      {
        title: "The Adventures of Alice in Wonderland",
        author: "Lewis Carroll",
        description: "A whimsical tale of a girl who falls down a rabbit hole",
        gutenbergId: "11",
        subject: ["Fantasy", "Children's Literature", "Adventure"]
      },
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        description: "A story of the Jazz Age and the American Dream",
        gutenbergId: "64317",
        subject: ["Classic Literature", "American Literature", "Drama"]
      },
      {
        title: "Moby Dick",
        author: "Herman Melville",
        description: "The epic tale of Captain Ahab's quest for the white whale",
        gutenbergId: "2701",
        subject: ["Adventure", "Classic Literature", "Maritime"]
      },
      {
        title: "A Tale of Two Cities",
        author: "Charles Dickens",
        description: "Set against the backdrop of the French Revolution",
        gutenbergId: "98",
        subject: ["Historical Fiction", "Classic Literature", "British Literature"]
      },
      {
        title: "The Adventures of Sherlock Holmes",
        author: "Arthur Conan Doyle",
        description: "Classic detective stories featuring Sherlock Holmes",
        gutenbergId: "1661",
        subject: ["Mystery", "Detective Fiction", "Classic Literature"]
      },
      {
        title: "Jane Eyre",
        author: "Charlotte Brontë",
        description: "The story of an orphaned girl who becomes a governess",
        gutenbergId: "1260",
        subject: ["Romance", "Gothic Fiction", "Classic Literature"]
      },
      {
        title: "Wuthering Heights",
        author: "Emily Brontë",
        description: "A dark tale of passion and revenge on the Yorkshire moors",
        gutenbergId: "768",
        subject: ["Romance", "Gothic Fiction", "Classic Literature"]
      },
      {
        title: "The Picture of Dorian Gray",
        author: "Oscar Wilde",
        description: "A philosophical novel about beauty, youth, and moral corruption",
        gutenbergId: "174",
        subject: ["Philosophy", "Gothic Fiction", "Classic Literature"]
      },
      {
        title: "Frankenstein",
        author: "Mary Shelley",
        description: "The original science fiction novel about creating life",
        gutenbergId: "84",
        subject: ["Science Fiction", "Gothic Fiction", "Horror"]
      },
      {
        title: "Dracula",
        author: "Bram Stoker",
        description: "The classic vampire novel that defined the genre",
        gutenbergId: "345",
        subject: ["Horror", "Gothic Fiction", "Classic Literature"]
      },
      {
        title: "The Time Machine",
        author: "H. G. Wells",
        description: "A journey through time to the distant future",
        gutenbergId: "35",
        subject: ["Science Fiction", "Time Travel", "Classic Literature"]
      },
      {
        title: "War of the Worlds",
        author: "H. G. Wells",
        description: "Humanity's struggle against an alien invasion",
        gutenbergId: "36",
        subject: ["Science Fiction", "Aliens", "Classic Literature"]
      },
      {
        title: "Little Women",
        author: "Louisa May Alcott",
        description: "The story of the four March sisters growing up during the Civil War",
        gutenbergId: "514",
        subject: ["Family", "Coming of Age", "American Literature"]
      },
      {
        title: "The Adventures of Tom Sawyer",
        author: "Mark Twain",
        description: "A boy's adventures along the Mississippi River",
        gutenbergId: "74",
        subject: ["Adventure", "Coming of Age", "American Literature"]
      },
      {
        title: "Adventures of Huckleberry Finn",
        author: "Mark Twain",
        description: "Huck's journey down the Mississippi River",
        gutenbergId: "76",
        subject: ["Adventure", "American Literature", "Social Commentary"]
      },
      {
        title: "The Count of Monte Cristo",
        author: "Alexandre Dumas",
        description: "A tale of wrongful imprisonment, escape, and revenge",
        gutenbergId: "1184",
        subject: ["Adventure", "Revenge", "Classic Literature"]
      },
      {
        title: "The Three Musketeers",
        author: "Alexandre Dumas",
        description: "The adventures of D'Artagnan and his musketeer friends",
        gutenbergId: "1257",
        subject: ["Adventure", "Historical Fiction", "Classic Literature"]
      },
      {
        title: "Romeo and Juliet",
        author: "William Shakespeare",
        description: "The tragic love story of two young star-crossed lovers",
        gutenbergId: "1112",
        subject: ["Romance", "Tragedy", "Classic Literature", "Drama"]
      },
      {
        title: "Hamlet",
        author: "William Shakespeare",
        description: "The story of the Prince of Denmark's quest for revenge",
        gutenbergId: "1524",
        subject: ["Tragedy", "Classic Literature", "Drama"]
      },
      {
        title: "The Wizard of Oz",
        author: "L. Frank Baum",
        description: "Dorothy's magical journey to the Land of Oz",
        gutenbergId: "55",
        subject: ["Fantasy", "Adventure", "Children's Literature"]
      },
      {
        title: "Alice's Adventures in Wonderland",
        author: "Lewis Carroll",
        description: "A girl's surreal journey through Wonderland",
        gutenbergId: "11",
        subject: ["Fantasy", "Children's Literature", "Adventure"]
      },
      {
        title: "The Secret Garden",
        author: "Frances Hodgson Burnett",
        description: "A young girl discovers a hidden garden that changes her life",
        gutenbergId: "17396",
        subject: ["Children's Literature", "Coming of Age", "Garden"]
      },
      {
        title: "Treasure Island",
        author: "Robert Louis Stevenson",
        description: "A young boy's adventure searching for pirate treasure",
        gutenbergId: "120",
        subject: ["Adventure", "Pirates", "Coming of Age"]
      },
      {
        title: "The Strange Case of Dr. Jekyll and Mr. Hyde",
        author: "Robert Louis Stevenson",
        description: "A doctor's experiments with human nature go terribly wrong",
        gutenbergId: "43",
        subject: ["Horror", "Psychology", "Classic Literature"]
      },
      {
        title: "Heart of Darkness",
        author: "Joseph Conrad",
        description: "A journey into the Congo and the darkness of human nature",
        gutenbergId: "219",
        subject: ["Classic Literature", "Adventure", "Psychology"]
      },
      {
        title: "The Call of the Wild",
        author: "Jack London",
        description: "A domesticated dog's journey back to the wild",
        gutenbergId: "215",
        subject: ["Adventure", "Nature", "Animals"]
      },
      {
        title: "White Fang",
        author: "Jack London",
        description: "A wolf-dog's journey from the wild to civilization",
        gutenbergId: "910",
        subject: ["Adventure", "Nature", "Animals"]
      },
      {
        title: "The Jungle Book",
        author: "Rudyard Kipling",
        description: "Stories of Mowgli, a boy raised by wolves in the Indian jungle",
        gutenbergId: "236",
        subject: ["Adventure", "Children's Literature", "Animals"]
      },
      {
        title: "Around the World in Eighty Days",
        author: "Jules Verne",
        description: "Phileas Fogg's race around the world in 80 days",
        gutenbergId: "103",
        subject: ["Adventure", "Travel", "Classic Literature"]
      }
    ];

    const searchTerm = query.toLowerCase();
    
    return fallbackBooks.filter(book => {
      switch (type) {
        case 'title':
          return book.title.toLowerCase().includes(searchTerm);
        case 'author':
          return book.author.toLowerCase().includes(searchTerm);
        case 'subject':
          return book.subject?.some(s => s.toLowerCase().includes(searchTerm)) || false;
        default:
          return book.title.toLowerCase().includes(searchTerm) || 
                 book.author.toLowerCase().includes(searchTerm) ||
                 book.description?.toLowerCase().includes(searchTerm) ||
                 book.subject?.some(s => s.toLowerCase().includes(searchTerm));
      }
    });
  };

  const loadBookContent = async (book: Book) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedBook(book);
      setIsFullBookMode(false);
      
      // Use gutenbergId if available, otherwise use the key from Open Library
      const bookId = book.gutenbergId || book.key?.replace('/works/', '') || '';
      
      if (!bookId) {
        throw new Error('Book ID not available');
      }
      
      console.log(`📚 Loading content for "${book.title}" (ID: ${bookId})`);
      
      // Try to fetch content from our enhanced API
      const response = await fetch(`${API_BASE_URL}/api/books/content/${bookId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: BookContent = await response.json();
      
      if (data.success && data.excerpt) {
        setBookContent(data.excerpt);
        setContentSource(data.source || 'unknown');
        setIsRealContent(data.isRealContent || false);
        setFullBookContent([]);
        
        // Update progress tracking for this book
        updateBookProgress(book, 0, 0);
        
        // Show content type to user
        if (data.isRealContent) {
          console.log(`🎉 Real book content loaded from: ${data.source}`);
          setError(null);
        } else {
          console.log(`📚 Sample content loaded from: ${data.source}`);
          // Show informative message instead of error for sample content
          if (data.source === 'intelligent-sample') {
            setError(`📖 This book uses enhanced sample content for typing practice. We're working to add more books with full text content.`);
          } else if (!book.gutenbergId) {
            setError(`📚 This search result uses sample content for typing practice. Try searching for classic literature titles for full book content.`);
          } else {
            setError(null);
          }
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error loading book content:', err);
      setError(`Failed to load "${book.title}". Using sample content for typing practice.`);
      setContentSource('fallback');
      
      // Provide book-specific sample content as fallback
      const sampleContent = getBookSampleContent(book.title);
      setBookContent(sampleContent);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFullBook = async (book: Book | null, chapterIndex: number = 0) => {
    if (!book) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setSelectedBook(book);
      setIsFullBookMode(true);
      
      // Use gutenbergId if available, otherwise use the key from Open Library
      const bookId = book.gutenbergId || book.key?.replace('/works/', '') || '';
      
      if (!bookId) {
        throw new Error('Book ID not available');
      }
      
      console.log(`📖 Loading full book "${book.title}" chapter ${chapterIndex + 1}`);
      
      // Fetch full book content with chapter navigation
      const response = await fetch(`${API_BASE_URL}/api/books/content/${bookId}?mode=full&chapter=${chapterIndex}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: BookContent = await response.json();
      
      if (data.success && data.content) {
        setBookContent(data.content);
        setCurrentChapter(data.currentChapter || 0);
        setTotalChapters(data.totalChapters || 1);
        setContentSource(data.source || 'unknown');
        setIsRealContent(data.isRealContent || false);
        
        // Store chapter titles for navigation
        if (data.chapterTitles) {
          setChapterTitles(data.chapterTitles);
        } else {
          const chapters = Array.from({ length: data.totalChapters || 1 }, (_, i) => `Chapter ${i + 1}`);
          setChapterTitles(chapters);
        }
        
        // Update progress tracking
        updateBookProgress(book, data.currentChapter || 0, 0);
        
        if (data.isRealContent) {
          console.log(`✅ Loaded chapter ${(data.currentChapter || 0) + 1} of ${data.totalChapters} from: ${data.source}`);
          setError(null);
        } else {
          console.log(`📚 Loaded sample chapter ${(data.currentChapter || 0) + 1} of ${data.totalChapters} from: ${data.source}`);
          if (!book.gutenbergId) {
            setError(`📚 Full book mode is using sample content. For complete books with chapter navigation, try classic literature titles from Project Gutenberg.`);
          }
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error loading full book:', err);
      setError(`Failed to load full book content for "${book.title}". Try the excerpt mode instead.`);
      setContentSource('fallback');
      
      // Fallback to regular excerpt mode
      await loadBookContent(book);
      setIsFullBookMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Progress tracking functions
  const updateBookProgress = (book: Book, chapter: number, position: number) => {
    const progress: BookProgress = {
      bookId: book.gutenbergId || book.key?.replace('/works/', '') || '',
      bookTitle: book.title,
      currentChapter: chapter,
      currentPosition: position,
      completedChapters: bookProgress?.completedChapters || [],
      totalChapters: totalChapters || 1,
      totalWordsTyped: bookProgress?.totalWordsTyped || 0,
      averageWpm: bookProgress?.averageWpm || 0,
      startedAt: bookProgress?.startedAt || new Date(),
      lastUpdated: new Date(),
      progressPercentage: totalChapters > 0 ? Math.round((chapter / totalChapters) * 100) : 0
    };
    
    setBookProgress(progress);
    
    // Store in localStorage for persistence
    localStorage.setItem(`bookProgress_${progress.bookId}`, JSON.stringify(progress));
  };

  const loadBookProgress = (bookId: string): BookProgress | null => {
    try {
      const stored = localStorage.getItem(`bookProgress_${bookId}`);
      if (stored) {
        const progress = JSON.parse(stored);
        // Convert date strings back to Date objects
        progress.startedAt = new Date(progress.startedAt);
        progress.lastUpdated = new Date(progress.lastUpdated);
        return progress;
      }
    } catch (err) {
      console.error('Error loading book progress:', err);
    }
    return null;
  };

  // const markChapterComplete = (chapterIndex: number) => {
  //   if (bookProgress && !bookProgress.completedChapters.includes(chapterIndex)) {
  //     const updatedProgress = {
  //       ...bookProgress,
  //       completedChapters: [...bookProgress.completedChapters, chapterIndex],
  //       lastUpdated: new Date(),
  //       progressPercentage: Math.round(((bookProgress.completedChapters.length + 1) / totalChapters) * 100)
  //     };
  //     setBookProgress(updatedProgress);
  //     localStorage.setItem(`bookProgress_${updatedProgress.bookId}`, JSON.stringify(updatedProgress));
  //   }
  // };

  // Load progress when book is selected
  useEffect(() => {
    if (selectedBook) {
      const bookId = selectedBook.gutenbergId || selectedBook.key?.replace('/works/', '');
      if (bookId) {
        const progress = loadBookProgress(bookId);
        setBookProgress(progress);
      }
    }
  }, [selectedBook]);

  const getBookSampleContent = (bookTitle: string): string => {
    const samples: Record<string, string> = {
      "Pride and Prejudice": "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.",
      
      "The Adventures of Alice in Wonderland": "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversation?' So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies.",
      
      "The Great Gatsby": "In my younger and more vulnerable years my father gave me some advice that I've carried with me ever since. 'Whenever you feel like criticizing any one,' he told me, 'just remember that all the people in this world haven't had the advantages that you've had.' He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that.",
      
      "The Adventures of Sherlock Holmes": "To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind.",
      
      "Frankenstein": "It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.",
      
      "The Time Machine": "The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burned brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses. Our chairs, being his patents, embraced and caressed us rather than submitted to be sat upon, and there was that luxurious after-dinner atmosphere when thought runs gracefully free of the trammels of precision.",
      
      "Little Women": "'Christmas won't be Christmas without any presents,' grumbled Jo, lying on the rug. 'It's so dreadful to be poor!' sighed Meg, looking down at her old dress. 'I don't think it's fair for some girls to have plenty of pretty things, and other girls nothing at all,' added little Amy, with an injured sniff. 'We've got Father and Mother, and each other,' said Beth contentedly from her corner.",
      
      "The Adventures of Tom Sawyer": "Tom! No answer. Tom! No answer. What's gone with that boy, I wonder? You Tom! No answer. The old lady pulled her spectacles down and looked over them about the room; then she put them up and looked out under them. She seldom or never looked through them for so small a thing as a boy; they were her state pair, the pride of her heart, and were built for 'style,' not service."
    };

    return samples[bookTitle] || "This is sample content for typing practice. The book content is currently unavailable, but you can practice your typing skills with this text. Focus on accuracy and proper finger placement while typing. Regular practice will help improve your speed and accuracy over time.";
  };

  // Chapter/Page Navigation Functions
  const goToPreviousChapter = async () => {
    if (!selectedBook || !isFullBookMode || currentChapter <= 0) return;
    
    const previousChapter = currentChapter - 1;
    await loadFullBook(selectedBook, previousChapter);
  };

  const goToNextChapter = async () => {
    if (!selectedBook || !isFullBookMode || currentChapter >= totalChapters - 1) return;
    
    const nextChapter = currentChapter + 1;
    await loadFullBook(selectedBook, nextChapter);
  };

  const goToSpecificChapter = async (chapterIndex: number) => {
    if (!selectedBook || !isFullBookMode || chapterIndex < 0 || chapterIndex >= totalChapters) return;
    
    await loadFullBook(selectedBook, chapterIndex);
  };

  // const splitIntoChapters = (content: string): string[] => {
  //   // Split content into manageable chunks (approximately 500-800 words per chunk)
  //   const words = content.split(' ');
  //   const chapters: string[] = [];
  //   const wordsPerChapter = 600;
    
  //   for (let i = 0; i < words.length; i += wordsPerChapter) {
  //     const chapterWords = words.slice(i, i + wordsPerChapter);
  //     chapters.push(chapterWords.join(' '));
  //   }
    
  //   return chapters.length > 0 ? chapters : [content];
  // };

  // Save book test results to localStorage
  const saveBookTestResults = (results: any, bookTitle: string, isChapter: boolean = false) => {
    try {
      const testResult = {
        id: Date.now().toString(),
        testType: 'book',
        bookTitle,
        isChapter,
        currentChapter: isChapter ? currentChapter : undefined,
        date: new Date().toISOString(),
        wpm: results.wpm,
        accuracy: results.accuracy,
        errors: results.errors || 0,
        wordsTyped: results.correctWords || results.wordsTyped || 0,
        duration: results.duration || 120,
        ...results
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
    } catch (error) {
      console.error('Failed to save book test results:', error);
    }
  };

  const handleChapterComplete = (results: any) => {
    // Save test results locally
    if (selectedBook) {
      saveBookTestResults(results, selectedBook.title, true);
    }
    
    if (bookProgress && isFullBookMode) {
      const updatedProgress = {
        ...bookProgress,
        completedChapters: [...bookProgress.completedChapters, currentChapter],
        totalWordsTyped: bookProgress.totalWordsTyped + results.wordsTyped,
        averageWpm: (bookProgress.averageWpm + results.wpm) / 2
      };
      saveBookProgress(updatedProgress);
      
      // Auto-advance to next chapter
      setTimeout(() => {
        goToNextChapter();
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      searchBooks();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📚 Book Typing Practice
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Improve your typing skills while reading classic literature and educational content
        </p>
      </div>

      {/* Progress Display for Full Book Mode */}
      {isFullBookMode && bookProgress && fullBookContent.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Reading Progress Dashboard
          </h2>
          
          {/* Book Title and Source */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              {bookProgress.bookTitle}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Content source: {
                isRealContent 
                  ? `✅ Authentic text (${contentSource})` 
                  : `📚 Enhanced sample content (${contentSource})`
              }
            </p>
          </div>
          
          {/* Progress Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {currentChapter + 1} / {totalChapters}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Chapter</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {bookProgress.completedChapters.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(bookProgress.averageWpm)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg WPM</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {bookProgress.progressPercentage}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Book Progress</span>
              <span>{bookProgress.progressPercentage}% complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${bookProgress.progressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Chapter Progress Visualization */}
          {totalChapters > 1 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chapter Progress</h4>
              <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1">
                {Array.from({ length: Math.min(totalChapters, 32) }, (_, i) => (
                  <div
                    key={i}
                    className={`h-4 rounded ${
                      bookProgress.completedChapters.includes(i)
                        ? 'bg-green-500'
                        : i === currentChapter
                        ? 'bg-blue-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    title={`Chapter ${i + 1}${
                      bookProgress.completedChapters.includes(i) 
                        ? ' (Completed)' 
                        : i === currentChapter 
                        ? ' (Current)' 
                        : ''
                    }`}
                  />
                ))}
              </div>
              {totalChapters > 32 && (
                <p className="text-xs text-gray-500 mt-1">
                  Showing first 32 of {totalChapters} chapters
                </p>
              )}
            </div>
          )}
          
          {/* Reading Session Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Started: {bookProgress.startedAt.toLocaleDateString()} • 
            Last updated: {bookProgress.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Chapter Navigation for Full Book Mode */}
      {isFullBookMode && totalChapters > 1 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousChapter}
              disabled={currentChapter === 0}
              className="btn btn-outline flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous Chapter
            </button>
            
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Chapter {currentChapter + 1} of {totalChapters}
              </h3>
              <p className="text-sm text-gray-500">
                {Math.round((bookContent.split(' ').length / 5) * 60)} words (~{Math.ceil(bookContent.split(' ').length / 200)} min read)
              </p>
            </div>
            
            <button
              onClick={goToNextChapter}
              disabled={currentChapter === totalChapters - 1}
              className="btn btn-outline flex items-center"
            >
              Next Chapter
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Search Section - Always visible */}
      {!selectedBook && (
        <>
          <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Search Books
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'title' | 'author' | 'subject')}
            className="input sm:w-32"
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="subject">Subject</option>
          </select>
          
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Search by ${searchType}...`}
              className="input flex-1"
            />
            <button
              onClick={searchBooks}
              disabled={isLoading || !searchQuery.trim()}
              className="btn btn-primary px-4"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <button
          onClick={loadPopularBooks}
          className="btn btn-outline"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Load Popular Books
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Books Grid */}
      {books.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Available Books
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <Book className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {book.title}
                      </h3>
                      {/* Content availability indicator */}
                      {book.gutenbergId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                          Full Content
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1"></div>
                          Sample
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      by {book.author}
                    </p>
                    {book.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                        {book.description}
                      </p>
                    )}
                    {book.subject && book.subject.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {book.subject.slice(0, 2).map((subject, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => loadBookContent(book)}
                        className="btn btn-primary text-xs px-3 py-1"
                      >
                        Quick Practice
                      </button>
                      {/* Only show full book mode for books with real content */}
                      {book.gutenbergId && (
                        <button
                          onClick={() => loadFullBook(book, 0)}
                          className="btn btn-outline text-xs px-3 py-1 flex items-center"
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          Full Book
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {/* Selected Book and Typing Test */}
      {selectedBook && bookContent && (
        <div className="space-y-6">
          {/* Book Header */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedBook.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  by {selectedBook.author}
                </p>
                {isFullBookMode && (
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <Bookmark className="w-4 h-4 mr-1" />
                    Full Book Mode - Chapter {currentChapter + 1}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => isFullBookMode ? loadFullBook(selectedBook, currentChapter) : loadBookContent(selectedBook)}
                  className="btn btn-outline"
                  disabled={isLoading}
                >
                  <Download className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Reload {isFullBookMode ? 'Chapter' : 'Excerpt'}
                </button>
                {!isFullBookMode && (
                  <button
                    onClick={() => loadFullBook(selectedBook, 0)}
                    className="btn btn-primary"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Switch to Full Book
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Chapter/Page Navigation */}
          {isFullBookMode && totalChapters > 1 && (
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={goToPreviousChapter}
                    disabled={currentChapter <= 0 || isLoading}
                    className="btn btn-outline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Chapter:
                    </span>
                    <select
                      value={currentChapter}
                      onChange={(e) => goToSpecificChapter(parseInt(e.target.value))}
                      disabled={isLoading}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                      {chapterTitles.map((title, index) => (
                        <option key={index} value={index}>
                          {index + 1}. {title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={goToNextChapter}
                    disabled={currentChapter >= totalChapters - 1 || isLoading}
                    className="btn btn-outline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    {currentChapter + 1} of {totalChapters} chapters
                  </span>
                  {bookProgress && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      {Math.round(((currentChapter + 1) / totalChapters) * 100)}% complete
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content Source Info */}
          {contentSource && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 dark:text-green-400">
                  {isRealContent ? '✅ Authentic content' : '📚 Enhanced sample content'} 
                  loaded from: <strong>{contentSource}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Typing Test */}
                    {/* Typing Test */}
          <TypingTestComponent
            text={bookContent}
            duration={isFullBookMode ? 300 : 120} // 5 minutes for chapters, 2 for excerpts
            onComplete={isFullBookMode ? handleChapterComplete : (results) => {
              console.log('Book typing test completed:', results);
              // Save test results locally for excerpts
              if (selectedBook) {
                saveBookTestResults(results, selectedBook.title, false);
              }
            }}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default BookPracticeComponent;
