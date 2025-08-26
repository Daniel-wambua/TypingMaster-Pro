import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Enhanced security headers configuration
export const securityHeaders = helmet({
  // Content Security Policy - prevents XSS attacks
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.gutenberg.org", "https://openlibrary.org"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // HTTP Strict Transport Security - forces HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Prevent MIME sniffing
  noSniff: true,
  
  // Disable X-Powered-By header
  hidePoweredBy: true,
  
  // Prevent opening in iframe
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Custom security middleware
export const customSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove potential script tags and dangerous HTML
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};
