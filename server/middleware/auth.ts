import { Request, Response, NextFunction } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import pool from '../db/pool';

export interface AuthRequest extends Request {
  userId?: number;
  clerkId?: string;
}

// Clerk-only authentication for bootstrap endpoints. Unlike requireAuth, this
// deliberately does not require a matching row in our users table: the sync
// endpoint is responsible for creating that row after a user's first sign-in.
export function requireClerkAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.clerkId = clerkId;
    next();
  } catch (err) {
    console.error('Clerk auth middleware error:', err);
    res.status(500).json({ error: 'Auth error' });
  }
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
