-- ============================================================
-- Pawprint Network — Full Social Graph Schema
-- PostgreSQL 13+  (Gandi hosting)
-- ============================================================

-- Users (mirrors Clerk; clerk_id is the source of truth)
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  clerk_id    TEXT UNIQUE NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio         TEXT DEFAULT '',
  avatar_url  TEXT DEFAULT '',
  species     TEXT CHECK (species IN ('cat','dog')) DEFAULT 'cat',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 500),
  image_url   TEXT DEFAULT '',
  species     TEXT CHECK (species IN ('cat','dog')) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  id          SERIAL PRIMARY KEY,
  post_id     INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id          SERIAL PRIMARY KEY,
  post_id     INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 280),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Social Graph: follows
CREATE TABLE IF NOT EXISTS follows (
  id            SERIAL PRIMARY KEY,
  follower_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- Direct Messages
CREATE TABLE IF NOT EXISTS messages (
  id            SERIAL PRIMARY KEY,
  sender_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recipient_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) <= 1000),
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT CHECK (type IN ('like','comment','follow','message')) NOT NULL,
  actor_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  post_id     INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id    ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_species    ON posts(species);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id    ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender  ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Free-form post metadata: location and category are plain user-entered text,
-- not restricted to a fixed list — users can type any location or invent their
-- own category. video_url/media_type support uploaded or in-app-recorded video.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';
