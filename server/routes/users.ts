import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, requireClerkAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/users/sync — called after sign-in to upsert user
router.post('/sync', requireClerkAuth, async (req: AuthRequest, res: Response) => {
  const { username, display_name, avatar_url, bio, species } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO users (clerk_id, username, display_name, avatar_url, bio, species)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (clerk_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         avatar_url   = EXCLUDED.avatar_url,
         bio          = COALESCE(NULLIF(EXCLUDED.bio, ''), users.bio),
         species      = COALESCE(NULLIF(EXCLUDED.species, ''), users.species)
       RETURNING *`,
      [req.clerkId, username, display_name, avatar_url || '', bio || '', species || 'cat']
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      // username conflict
      const existing = await pool.query('SELECT * FROM users WHERE clerk_id = $1', [req.clerkId]);
      res.json(existing.rows[0]);
    } else {
      console.error('User sync error:', err);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  }
});

// GET /api/users/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT u.*,
       (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
       (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
       (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count
     FROM users u WHERE u.id = $1`,
    [req.userId]
  );
  res.json(result.rows[0]);
});

// GET /api/users/:username
router.get('/:username', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { username } = req.params;
  const result = await pool.query(
    `SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, u.species, u.created_at,
       (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
       (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
       (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count
     FROM users u WHERE u.username = $1`,
    [username]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

  const user = result.rows[0];
  if (req.userId) {
    const followCheck = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.userId, user.id]
    );
    user.is_following = followCheck.rows.length > 0;
  }
  res.json(user);
});

// PUT /api/users/me — update profile
router.put('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const { display_name, bio, avatar_url } = req.body;
  const result = await pool.query(
    `UPDATE users SET
       display_name = COALESCE($1, display_name),
       bio          = COALESCE($2, bio),
       avatar_url   = COALESCE($3, avatar_url)
     WHERE id = $4 RETURNING *`,
    [display_name, bio, avatar_url, req.userId]
  );
  res.json(result.rows[0]);
});

// GET /api/users/:username/posts
router.get('/:username/posts', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { username } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await pool.query(
    `SELECT p.*, u.username, u.display_name, u.avatar_url, u.species AS user_species,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
       ${req.userId ? `(SELECT id FROM likes WHERE post_id = p.id AND user_id = $4) IS NOT NULL AS liked_by_me,
       EXISTS (SELECT 1 FROM follows WHERE follower_id = $4 AND following_id = p.user_id) AS author_is_following` : 'false AS liked_by_me, false AS author_is_following'}
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE u.username = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    req.userId ? [username, limit, offset, req.userId] : [username, limit, offset]
  );
  res.json(result.rows);
});

// GET /api/users/search?q=
router.get('/search/query', optionalAuth, async (req: AuthRequest, res: Response) => {
  const q = `%${(req.query.q as string) || ''}%`;
  const result = await pool.query(
    `SELECT id, username, display_name, avatar_url, species,
       ${req.userId ? 'EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = users.id) AS is_following' : 'false AS is_following'}
     FROM users
     WHERE (username ILIKE $1 OR display_name ILIKE $1)
       ${req.userId ? 'AND id <> $2' : ''}
     LIMIT 20`,
    req.userId ? [q, req.userId] : [q]
  );
  res.json(result.rows);
});

export default router;
