import { Request, Response, NextFunction } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import pool from '../db/pool';

export interface AuthRequest extends Request {
  userId?: number;
  clerkId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Look up internal user id
    const result = await pool.query(
      'SELECT id FROM users WHERE clerk_id = $1',
      [clerkId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found. Please complete setup.' });
    }
    req.userId = result.rows[0].id;
    req.clerkId = clerkId;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Auth error' });
  }
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (clerkId) {
      const result = await pool.query(
        'SELECT id FROM users WHERE clerk_id = $1',
        [clerkId]
      );
      if (result.rows.length > 0) {
        req.userId = result.rows[0].id;
        req.clerkId = clerkId;
      }
    }
    next();
  } catch {
    next();
  }
}
