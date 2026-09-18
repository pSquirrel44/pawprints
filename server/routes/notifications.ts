import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT n.*,
       u.username AS actor_username, u.display_name AS actor_name, u.avatar_url AS actor_avatar,
       p.content AS post_preview
     FROM notifications n
     JOIN users u ON u.id = n.actor_id
     LEFT JOIN posts p ON p.id = n.post_id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [req.userId]
  );
  res.json(result.rows);
});

// GET /api/notifications/unread-count
router.get('/unread-count', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [req.userId]
  );
  res.json({ count: parseInt(result.rows[0].count) });
});

// POST /api/notifications/read-all
router.post('/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  await pool.query(
    'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
    [req.userId]
  );
  res.json({ ok: true });
});

export default router;
