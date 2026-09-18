import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/posts/feed — posts from followed users + own posts
router.get('/feed', requireAuth, async (req: AuthRequest, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const cursor = req.query.cursor as string; // created_at of last item for pagination

  const result = await pool.query(
    `SELECT p.*, u.username, u.display_name, u.avatar_url, u.species AS user_species,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
       (SELECT id FROM likes WHERE post_id = p.id AND user_id = $1) IS NOT NULL AS liked_by_me,
       (p.user_id = $1 OR EXISTS (
         SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = p.user_id
       )) AS author_is_following
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE (p.user_id = $1 OR p.user_id IN (
       SELECT following_id FROM follows WHERE follower_id = $1
     ))
     ${cursor ? 'AND p.created_at < $3' : ''}
     ORDER BY p.created_at DESC
     LIMIT $2`,
    cursor ? [req.userId, limit, cursor] : [req.userId, limit]
  );
  res.json(result.rows);
});

// GET /api/posts/explore/:species — public feed for a species
router.get('/explore/:species', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { species } = req.params;
  if (!['cat', 'dog'].includes(species)) return res.status(400).json({ error: 'Invalid species' });

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
     WHERE p.species = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    req.userId ? [species, limit, offset, req.userId] : [species, limit, offset]
  );
  res.json(result.rows);
});

// GET /api/posts/:id
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT p.*, u.username, u.display_name, u.avatar_url, u.species AS user_species,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
       ${req.userId ? `(SELECT id FROM likes WHERE post_id = p.id AND user_id = $2) IS NOT NULL AS liked_by_me,
       EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = p.user_id) AS author_is_following` : 'false AS liked_by_me, false AS author_is_following'}
     FROM posts p JOIN users u ON u.id = p.user_id
     WHERE p.id = $1`,
    req.userId ? [req.params.id, req.userId] : [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
  res.json(result.rows[0]);
});

// POST /api/posts
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { content, image_url, species, location, category, video_url, media_type } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });
  if (!['cat', 'dog'].includes(species)) return res.status(400).json({ error: 'Species required' });

  // location and category are free text — no fixed list, so users can name
  // their own. We only cap length so nobody can jam an oversized string in.
  const safeLocation = typeof location === 'string' ? location.trim().slice(0, 120) : '';
  const safeCategory = typeof category === 'string' ? category.trim().slice(0, 60) : '';
  const safeMediaType = media_type === 'video' ? 'video' : 'image';
  const safeVideoUrl = typeof video_url === 'string' ? video_url : '';

  const result = await pool.query(
    `INSERT INTO posts (user_id, content, image_url, species, location, category, video_url, media_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [req.userId, content.trim(), image_url || '', species, safeLocation, safeCategory, safeVideoUrl, safeMediaType]
  );

  // Attach author info
  const post = result.rows[0];
  const userRes = await pool.query('SELECT username, display_name, avatar_url FROM users WHERE id = $1', [req.userId]);
  res.status(201).json({ ...post, ...userRes.rows[0], like_count: 0, comment_count: 0, liked_by_me: false, author_is_following: false });
});

// DELETE /api/posts/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found or not yours' });
  res.json({ deleted: true });
});

// POST /api/posts/:id/like
router.post('/:id/like', requireAuth, async (req: AuthRequest, res: Response) => {
  const postId = parseInt(req.params.id);
  try {
    await pool.query(
      'INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, req.userId]
    );
    // Create notification
    const postOwner = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postOwner.rows.length > 0 && postOwner.rows[0].user_id !== req.userId) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, actor_id, post_id)
         VALUES ($1, 'like', $2, $3) ON CONFLICT DO NOTHING`,
        [postOwner.rows[0].user_id, req.userId, postId]
      );
    }
    const count = await pool.query('SELECT COUNT(*) FROM likes WHERE post_id = $1', [postId]);
    res.json({ liked: true, like_count: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like' });
  }
});

// DELETE /api/posts/:id/like
router.delete('/:id/like', requireAuth, async (req: AuthRequest, res: Response) => {
  const postId = parseInt(req.params.id);
  await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [postId, req.userId]);
  const count = await pool.query('SELECT COUNT(*) FROM likes WHERE post_id = $1', [postId]);
  res.json({ liked: false, like_count: parseInt(count.rows[0].count) });
});

// GET /api/posts/:id/comments
router.get('/:id/comments', optionalAuth, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT c.*, u.username, u.display_name, u.avatar_url
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [req.params.id]
  );
  res.json(result.rows);
});

// POST /api/posts/:id/comments
router.post('/:id/comments', requireAuth, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

  const result = await pool.query(
    `INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.id, req.userId, content.trim()]
  );
  const comment = result.rows[0];
  const userRes = await pool.query('SELECT username, display_name, avatar_url FROM users WHERE id = $1', [req.userId]);

  // Notify post owner
  const postOwner = await pool.query('SELECT user_id FROM posts WHERE id = $1', [req.params.id]);
  if (postOwner.rows.length > 0 && postOwner.rows[0].user_id !== req.userId) {
    await pool.query(
      `INSERT INTO notifications (user_id, type, actor_id, post_id) VALUES ($1, 'comment', $2, $3)`,
      [postOwner.rows[0].user_id, req.userId, req.params.id]
    );
  }

  res.status(201).json({ ...comment, ...userRes.rows[0] });
});

export default router;
