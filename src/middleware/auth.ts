import type { Request, Response, NextFunction } from 'express';
import { auth } from '../auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
};
