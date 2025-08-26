import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    console.log(log);
  });

  next();
};
