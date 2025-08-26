import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Input validation schemas with strict security rules
export const authValidation = {
  register: z.object({
    email: z.string()
      .email('Invalid email format')
      .max(254, 'Email too long') // RFC 5321 limit
      .trim()
      .toLowerCase(),
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
      .trim(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    firstName: z.string()
      .max(50, 'First name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters')
      .trim()
      .optional(),
    lastName: z.string()
      .max(50, 'Last name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters')
      .trim()
      .optional()
  }),

  login: z.object({
    email: z.string()
      .email('Invalid email format')
      .max(254, 'Email too long')
      .trim()
      .toLowerCase(),
    password: z.string()
      .min(1, 'Password is required')
      .max(128, 'Password too long')
  })
};

export const testValidation = {
  result: z.object({
    testType: z.enum(['words', 'sentences', 'paragraphs', 'code', 'book'], {
      errorMap: () => ({ message: 'Invalid test type' })
    }),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'professional'], {
      errorMap: () => ({ message: 'Invalid difficulty level' })
    }),
    duration: z.number()
      .int('Duration must be an integer')
      .min(15, 'Minimum duration is 15 seconds')
      .max(1800, 'Maximum duration is 30 minutes'), // 30 minutes max
    textContent: z.string()
      .min(1, 'Text content is required')
      .max(10000, 'Text content too long'), // Prevent DoS
    wpm: z.number()
      .min(0, 'WPM cannot be negative')
      .max(500, 'WPM seems unrealistic'), // Prevent fake scores
    accuracy: z.number()
      .min(0, 'Accuracy cannot be negative')
      .max(100, 'Accuracy cannot exceed 100%'),
    errors: z.number()
      .int('Errors must be an integer')
      .min(0, 'Errors cannot be negative')
      .max(10000, 'Too many errors'),
    consistency: z.number()
      .min(0, 'Consistency cannot be negative')
      .max(100, 'Consistency cannot exceed 100%'),
    wordsTyped: z.number()
      .int('Words typed must be an integer')
      .min(0, 'Words typed cannot be negative')
      .max(5000, 'Too many words'),
    timeSpent: z.number()
      .int('Time spent must be an integer')
      .min(1, 'Time spent must be at least 1 second')
      .max(1800, 'Time spent cannot exceed 30 minutes'),
    keystrokeData: z.string().optional(),
    errorData: z.string().optional()
  })
};

export const bookValidation = {
  search: z.object({
    query: z.string()
      .min(1, 'Search query is required')
      .max(100, 'Search query too long')
      .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Search query contains invalid characters')
      .trim(),
    limit: z.number()
      .int('Limit must be an integer')
      .min(1, 'Minimum limit is 1')
      .max(20, 'Maximum limit is 20')
      .optional()
      .default(10)
  }),

  content: z.object({
    bookId: z.string()
      .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid book ID format')
      .max(50, 'Book ID too long'),
    startPage: z.number()
      .int('Start page must be an integer')
      .min(1, 'Start page must be at least 1')
      .max(10000, 'Start page too high')
      .optional()
      .default(1),
    pageCount: z.number()
      .int('Page count must be an integer')
      .min(1, 'Page count must be at least 1')
      .max(10, 'Maximum 10 pages per request') // Prevent large responses
      .optional()
      .default(1)
  })
};

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      // Replace req.body with sanitized data
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};
