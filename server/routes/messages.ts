import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/messages/conversations — list of all DM threads
router.get('/conversations', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT DISTINCT ON (other_user_id)
       other_user_id,
       u.username, u.display_name, u.avatar_url, u.species,
       last_msg, last_at, unread_count
     FROM (
       SELECT
         CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END AS other_user_id,
         content AS last_msg,
         created_at AS last_at,
         (SELECT COUNT(*) FROM messages m2
          WHERE m2.sender_id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END
            AND m2.recipient_id = $1 AND m2.read_at IS NULL) AS unread_count
       FROM messages m
       WHERE sender_id = $1 OR recipient_id = $1
       ORDER BY created_at DESC
     ) AS convos
     JOIN users u ON u.id = other_user_id
     ORDER BY other_user_id, last_at DESC`,
    [req.userId]
  );
  res.json(result.rows);
});

// GET /api/messages/:username — conversation with a specific user
router.get('/:username', requireAuth, async (req: AuthRequest, res: Response) => {
  const target = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
  if (target.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  const otherId = target.rows[0].id;

  const result = await pool.query(
    `SELECT m.*,
       s.username AS sender_username, s.display_name AS sender_name, s.avatar_url AS sender_avatar,
       r.username AS recipient_username
     FROM messages m
     JOIN users s ON s.id = m.sender_id
     JOIN users r ON r.id = m.recipient_id
     WHERE (sender_id = $1 AND recipient_id = $2)
        OR (sender_id = $2 AND recipient_id = $1)
     ORDER BY m.created_at ASC
     LIMIT 100`,
    [req.userId, otherId]
  );

  // Mark as read
  await pool.query(
    `UPDATE messages SET read_at = NOW()
     WHERE sender_id = $1 AND recipient_id = $2 AND read_at IS NULL`,
    [otherId, req.userId]
  );

  res.json(result.rows);
});

// POST /api/messages/:username — send a DM
router.post('/:username', requireAuth, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

  const target = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
  if (target.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  const otherId = target.rows[0].id;

  if (otherId === req.userId) return res.status(400).json({ error: "Can't message yourself" });

  const result = await pool.query(
    `INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [req.userId, otherId, content.trim()]
  );

  const senderInfo = await pool.query(
    'SELECT username, display_name, avatar_url FROM users WHERE id = $1',
    [req.userId]
  );

  // Notify
  await pool.query(
    `INSERT INTO notifications (user_id, type, actor_id) VALUES ($1, 'message', $2)`,
    [otherId, req.userId]
  );

  res.status(201).json({
    ...result.rows[0],
    sender_username: senderInfo.rows[0].username,
    sender_name: senderInfo.rows[0].display_name,
    sender_avatar: senderInfo.rows[0].avatar_url,
  });
});

export default router;
