import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/follows/:username — follow a user
router.post('/:username', requireAuth, async (req: AuthRequest, res: Response) => {
  const { username } = req.params;
  const target = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (target.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  const targetId = target.rows[0].id;
  if (targetId === req.userId) return res.status(400).json({ error: "Can't follow yourself" });

  await pool.query(
    'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.userId, targetId]
  );
  // Notify
  await pool.query(
    `INSERT INTO notifications (user_id, type, actor_id) VALUES ($1, 'follow', $2)`,
    [targetId, req.userId]
  );
  res.json({ following: true });
});

// DELETE /api/follows/:username — unfollow
router.delete('/:username', requireAuth, async (req: AuthRequest, res: Response) => {
  const { username } = req.params;
  const target = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (target.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  await pool.query(
    'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
    [req.userId, target.rows[0].id]
  );
  res.json({ following: false });
});

// GET /api/follows/:username/followers
router.get('/:username/followers', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.species
     FROM follows f JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = (SELECT id FROM users WHERE username = $1)
     ORDER BY f.created_at DESC LIMIT 50`,
    [req.params.username]
  );
  res.json(result.rows);
});

// GET /api/follows/:username/following
router.get('/:username/following', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.species
     FROM follows f JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = (SELECT id FROM users WHERE username = $1)
     ORDER BY f.created_at DESC LIMIT 50`,
    [req.params.username]
  );
  res.json(result.rows);
});

// GET /api/follows/suggestions — who to follow
router.get('/suggestions/list', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.species,
       (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count
     FROM users u
     WHERE u.id <> $1
       AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = $1)
     ORDER BY follower_count DESC
     LIMIT 10`,
    [req.userId]
  );
  res.json(result.rows);
});

export default router;
