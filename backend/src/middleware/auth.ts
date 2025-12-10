import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header missing' });
    return;
  }

  const [type, credentials] = authHeader.split(' ');

  if (type !== 'Basic' || !credentials) {
    res.status(401).json({ message: 'Invalid authorization format' });
    return;
  }

  const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');

  if (username === config.admin.username && password === config.admin.password) {
    next();
  } else {
    res.status(403).json({ message: 'Invalid credentials' });
  }
};
