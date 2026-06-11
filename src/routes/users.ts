import { Router } from 'express';
import type { Response } from 'express';
import { db as prisma } from '../db';
import type { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '../types';
import { asyncHandler } from '../middleware/async-handler';

export const userRouter = Router();

// GET /api/users
userRouter.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // 1. Authorization Check: Only ADMIN can access this endpoint
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({ error: 'Forbidden: Administrator access required' });
    return;
  }

  // 2. Fetch users from database
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(users);
}));
