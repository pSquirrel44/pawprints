"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express8 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var import_express9 = require("@clerk/express");
var import_dotenv2 = __toESM(require("dotenv"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_compression = __toESM(require("compression"), 1);
var import_express_rate_limit = require("express-rate-limit");

// server/auth.ts
var import_express = require("@clerk/express");
function getVerifiedIdentity(auth) {
  if (!auth.userId) return null;
  return {
    userId: auth.userId,
    sessionId: auth.sessionId || null
  };
}
var requireApiAuth = (req, res, next) => {
  const identity = getVerifiedIdentity((0, import_express.getAuth)(req));
  if (!identity) {
    res.status(401).json({
      error: {
        code: "unauthorized",
        message: "Authentication is required to access this resource."
      }
    });
    return;
  }
  res.locals.auth = identity;
  next();
};

// server/config.ts
function parseOrigins(value, isProduction) {
  const origins = (value || "").split(",").map((origin) => origin.trim()).filter(Boolean).map((origin) => new URL(origin).origin);
  if (isProduction && origins.length === 0) {
    throw new Error("CLERK_AUTHORIZED_PARTIES must list the trusted production origins.");
  }
  if (isProduction && origins.some((origin) => !origin.startsWith("https://"))) {
    throw new Error("Production Clerk authorized parties must use HTTPS.");
  }
  return Array.from(new Set(origins));
}
function getClerkFrontendApiOrigin(publishableKey) {
  const encoded = publishableKey.replace(/^pk_(test|live)_/, "");
  const frontendApi = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
  if (!frontendApi || !frontendApi.includes(".")) {
    throw new Error("CLERK_PUBLISHABLE_KEY is malformed.");
  }
  return new URL(`https://${frontendApi}`).origin;
}
function getServerConfig(env) {
  const isProduction = env.NODE_ENV === "production";
  const defaultDevPublishableKey = `pk_test_${Buffer.from("example.clerk.accounts.dev$").toString("base64")}`;
  const defaultDevSecretKey = "sk_test_dev_key";
  const defaultDevDatabaseUrl = "postgresql://localhost:5432/pawprints";
  const defaultDevGeminiKey = "dev-gemini-key";
  const clerkPublishableKey = env.CLERK_PUBLISHABLE_KEY || (isProduction ? "" : defaultDevPublishableKey);
  const clerkSecretKey = env.CLERK_SECRET_KEY || (isProduction ? "" : defaultDevSecretKey);
  const databaseUrl = env.DATABASE_URL || (isProduction ? "" : defaultDevDatabaseUrl);
  const geminiApiKey = env.GEMINI_API_KEY || (isProduction ? "" : defaultDevGeminiKey);
  const port = Number.parseInt(env.PORT || "3000", 10);
  if (!clerkPublishableKey.startsWith("pk_")) {
    throw new Error("CLERK_PUBLISHABLE_KEY is missing or malformed.");
  }
  if (!clerkSecretKey.startsWith("sk_")) {
    throw new Error("CLERK_SECRET_KEY is missing or malformed.");
  }
  if (isProduction && env.ALLOW_CLERK_TEST_KEYS !== "true" && !clerkSecretKey.startsWith("sk_live_")) {
    throw new Error("Production requires a Clerk secret key beginning with sk_live_.");
  }
  if (isProduction && env.ALLOW_CLERK_TEST_KEYS !== "true" && !clerkPublishableKey.startsWith("pk_live_")) {
    throw new Error("Production requires a Clerk publishable key beginning with pk_live_.");
  }
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is required.");
  }
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }
  if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return {
    clerkAuthorizedParties: parseOrigins(
      env.CLERK_AUTHORIZED_PARTIES || (isProduction ? "" : "http://localhost:3000"),
      isProduction
    ),
    clerkFrontendApiOrigin: getClerkFrontendApiOrigin(clerkPublishableKey),
    databaseUrl,
    geminiApiKey,
    isProduction,
    port
  };
}

// server/domains.ts
var corporateDomains = /* @__PURE__ */ new Set(["pawprintsnetwork.com", "www.pawprintsnetwork.com"]);
var appDomains = {
  "instameow.app": "cat",
  "www.instameow.app": "cat",
  "instawoof.app": "dog",
  "www.instawoof.app": "dog"
};
function clean(hostname) {
  return (hostname || "").trim().toLowerCase();
}
function isCorporateDomain(hostname) {
  return corporateDomains.has(clean(hostname));
}
function getAppBrand(hostname) {
  return appDomains[clean(hostname)] ?? null;
}

// server/routes/users.ts
var import_express3 = require("express");

// server/db/pool.ts
var import_pg = require("pg");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config({ path: [".env.local", ".env"] });
var pool = new import_pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Gandi's managed Postgres runs on localhost alongside the app and does not
  // support/require SSL. Only enable SSL if explicitly requested via env var
  // (for a remote/managed DB elsewhere that does require it).
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 2e3
});
pool.on("error", (err) => {
  console.error("Unexpected DB pool error", err);
});
var pool_default = pool;

// server/middleware/auth.ts
var import_express2 = require("@clerk/express");
function requireClerkAuth(req, res, next) {
  try {
    const { userId: clerkId } = (0, import_express2.getAuth)(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.clerkId = clerkId;
    next();
  } catch (err) {
    console.error("Clerk auth middleware error:", err);
    res.status(500).json({ error: "Auth error" });
  }
}
async function requireAuth(req, res, next) {
  try {
    const { userId: clerkId } = (0, import_express2.getAuth)(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const result = await pool_default.query(
      "SELECT id FROM users WHERE clerk_id = $1",
      [clerkId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found. Please complete setup." });
    }
    req.userId = result.rows[0].id;
    req.clerkId = clerkId;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Auth error" });
  }
}
async function optionalAuth(req, res, next) {
  try {
    const { userId: clerkId } = (0, import_express2.getAuth)(req);
    if (clerkId) {
      const result = await pool_default.query(
        "SELECT id FROM users WHERE clerk_id = $1",
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

// server/routes/users.ts
var router = (0, import_express3.Router)();
router.post("/sync", requireClerkAuth, async (req, res) => {
  const { username, display_name, avatar_url, bio, species } = req.body;
  try {
    const result = await pool_default.query(
      `INSERT INTO users (clerk_id, username, display_name, avatar_url, bio, species)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (clerk_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         avatar_url   = EXCLUDED.avatar_url,
         bio          = COALESCE(NULLIF(EXCLUDED.bio, ''), users.bio),
         species      = COALESCE(NULLIF(EXCLUDED.species, ''), users.species)
       RETURNING *`,
      [req.clerkId, username, display_name, avatar_url || "", bio || "", species || "cat"]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      const existing = await pool_default.query("SELECT * FROM users WHERE clerk_id = $1", [req.clerkId]);
      res.json(existing.rows[0]);
    } else {
      console.error("User sync error:", err);
      res.status(500).json({ error: "Failed to sync user" });
    }
  }
});
router.get("/me", requireAuth, async (req, res) => {
  const result = await pool_default.query(
    `SELECT u.*,
       (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
       (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
       (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count
     FROM users u WHERE u.id = $1`,
    [req.userId]
  );
  res.json(result.rows[0]);
});
router.get("/:username", optionalAuth, async (req, res) => {
  const { username } = req.params;
  const result = await pool_default.query(
    `SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, u.species, u.created_at,
       (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
       (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
       (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count
     FROM users u WHERE u.username = $1`,
    [username]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
  const user = result.rows[0];
  if (req.userId) {
    const followCheck = await pool_default.query(
      "SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2",
      [req.userId, user.id]
    );
    user.is_following = followCheck.rows.length > 0;
  }
  res.json(user);
});
router.put("/me", requireAuth, async (req, res) => {
  const { display_name, bio, avatar_url } = req.body;
  const result = await pool_default.query(
    `UPDATE users SET
       display_name = COALESCE($1, display_name),
       bio          = COALESCE($2, bio),
       avatar_url   = COALESCE($3, avatar_url)
     WHERE id = $4 RETURNING *`,
    [display_name, bio, avatar_url, req.userId]
  );
  res.json(result.rows[0]);
});
router.get("/:username/posts", optionalAuth, async (req, res) => {
  const { username } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset = parseInt(req.query.offset) || 0;
  const result = await pool_default.query(
    `SELECT p.*, u.username, u.display_name, u.avatar_url, u.species AS user_species,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
       ${req.userId ? `(SELECT id FROM likes WHERE post_id = p.id AND user_id = $4) IS NOT NULL AS liked_by_me,
       EXISTS (SELECT 1 FROM follows WHERE follower_id = $4 AND following_id = p.user_id) AS author_is_following` : "false AS liked_by_me, false AS author_is_following"}
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE u.username = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    req.userId ? [username, limit, offset, req.userId] : [username, limit, offset]
  );
  res.json(result.rows);
});
router.get("/search/query", optionalAuth, async (req, res) => {
  const q = `%${req.query.q || ""}%`;
  const result = await pool_default.query(
    `SELECT id, username, display_name, avatar_url, species,
       ${req.userId ? "EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = users.id) AS is_following" : "false AS is_following"}
     FROM users
     WHERE (username ILIKE $1 OR display_name ILIKE $1)
       ${req.userId ? "AND id <> $2" : ""}
     LIMIT 20`,
    req.userId ? [q, req.userId] : [q]
  );
  res.json(result.rows);
});
var users_default = router;

// server/routes/posts.ts
var import_express4 = require("express");
var router2 = (0, import_express4.Router)();
router2.get("/feed", requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const cursor = req.query.cursor;
  const result = await pool_default.query(
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
     ${cursor ? "AND p.created_at < $3" : ""}
     ORDER BY p.created_at DESC
     LIMIT $2`,
    cursor ? [req.userId, limit, cursor] : [req.userId, limit]
  );
  res.json(result.rows);
});
router2.get("/explore/:species", optionalAuth, async (req, res) => {
  const { species } = req.params;
  if (!["cat", "dog"].includes(species)) return res.status(400).json({ error: "Invalid species" });
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset = parseInt(req.query.offset) || 0;
  const result = await pool_default.query(
    `SELECT p.*, u.username, u.display_name, u.avatar_url, u.species AS user_species,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
       ${req.userId ? `(SELECT id FROM likes WHERE post_id = p.id AND user_id = $4) IS NOT NULL AS liked_by_me,
       EXISTS (SELECT 1 FROM follows WHERE follower_id = $4 AND following_id = p.user_id) AS author_is_following` : "false AS liked_by_me, false AS author_is_following"}
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.species = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    req.userId ? [species, limit, offset, req.userId] : [species, limit, offset]
  );
  res.json(result.rows);
});
router2.get("/:id", optionalAuth, async (req, res) => {
  const result = await pool_default.query(
    `SELECT p.*, u.username, u.display_name, u.avatar_url, u.species AS user_species,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
       ${req.userId ? `(SELECT id FROM likes WHERE post_id = p.id AND user_id = $2) IS NOT NULL AS liked_by_me,
       EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = p.user_id) AS author_is_following` : "false AS liked_by_me, false AS author_is_following"}
     FROM posts p JOIN users u ON u.id = p.user_id
     WHERE p.id = $1`,
    req.userId ? [req.params.id, req.userId] : [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Post not found" });
  res.json(result.rows[0]);
});
router2.post("/", requireAuth, async (req, res) => {
  const { content, image_url, species, location, category, video_url, media_type } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Content is required" });
  if (!["cat", "dog"].includes(species)) return res.status(400).json({ error: "Species required" });
  const safeLocation = typeof location === "string" ? location.trim().slice(0, 120) : "";
  const safeCategory = typeof category === "string" ? category.trim().slice(0, 60) : "";
  const safeMediaType = media_type === "video" ? "video" : "image";
  const safeVideoUrl = typeof video_url === "string" ? video_url : "";
  const result = await pool_default.query(
    `INSERT INTO posts (user_id, content, image_url, species, location, category, video_url, media_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [req.userId, content.trim(), image_url || "", species, safeLocation, safeCategory, safeVideoUrl, safeMediaType]
  );
  const post = result.rows[0];
  const userRes = await pool_default.query("SELECT username, display_name, avatar_url FROM users WHERE id = $1", [req.userId]);
  res.status(201).json({ ...post, ...userRes.rows[0], like_count: 0, comment_count: 0, liked_by_me: false, author_is_following: false });
});
router2.delete("/:id", requireAuth, async (req, res) => {
  const result = await pool_default.query(
    "DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id",
    [req.params.id, req.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found or not yours" });
  res.json({ deleted: true });
});
router2.post("/:id/like", requireAuth, async (req, res) => {
  const postId = parseInt(req.params.id);
  try {
    await pool_default.query(
      "INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [postId, req.userId]
    );
    const postOwner = await pool_default.query("SELECT user_id FROM posts WHERE id = $1", [postId]);
    if (postOwner.rows.length > 0 && postOwner.rows[0].user_id !== req.userId) {
      await pool_default.query(
        `INSERT INTO notifications (user_id, type, actor_id, post_id)
         VALUES ($1, 'like', $2, $3) ON CONFLICT DO NOTHING`,
        [postOwner.rows[0].user_id, req.userId, postId]
      );
    }
    const count = await pool_default.query("SELECT COUNT(*) FROM likes WHERE post_id = $1", [postId]);
    res.json({ liked: true, like_count: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: "Failed to like" });
  }
});
router2.delete("/:id/like", requireAuth, async (req, res) => {
  const postId = parseInt(req.params.id);
  await pool_default.query("DELETE FROM likes WHERE post_id = $1 AND user_id = $2", [postId, req.userId]);
  const count = await pool_default.query("SELECT COUNT(*) FROM likes WHERE post_id = $1", [postId]);
  res.json({ liked: false, like_count: parseInt(count.rows[0].count) });
});
router2.get("/:id/comments", optionalAuth, async (req, res) => {
  const result = await pool_default.query(
    `SELECT c.*, u.username, u.display_name, u.avatar_url
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [req.params.id]
  );
  res.json(result.rows);
});
router2.post("/:id/comments", requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Comment cannot be empty" });
  const result = await pool_default.query(
    `INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.id, req.userId, content.trim()]
  );
  const comment = result.rows[0];
  const userRes = await pool_default.query("SELECT username, display_name, avatar_url FROM users WHERE id = $1", [req.userId]);
  const postOwner = await pool_default.query("SELECT user_id FROM posts WHERE id = $1", [req.params.id]);
  if (postOwner.rows.length > 0 && postOwner.rows[0].user_id !== req.userId) {
    await pool_default.query(
      `INSERT INTO notifications (user_id, type, actor_id, post_id) VALUES ($1, 'comment', $2, $3)`,
      [postOwner.rows[0].user_id, req.userId, req.params.id]
    );
  }
  res.status(201).json({ ...comment, ...userRes.rows[0] });
});
var posts_default = router2;

// server/routes/follows.ts
var import_express5 = require("express");
var router3 = (0, import_express5.Router)();
router3.post("/:username", requireAuth, async (req, res) => {
  const { username } = req.params;
  const target = await pool_default.query("SELECT id FROM users WHERE username = $1", [username]);
  if (target.rows.length === 0) return res.status(404).json({ error: "User not found" });
  const targetId = target.rows[0].id;
  if (targetId === req.userId) return res.status(400).json({ error: "Can't follow yourself" });
  await pool_default.query(
    "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [req.userId, targetId]
  );
  await pool_default.query(
    `INSERT INTO notifications (user_id, type, actor_id) VALUES ($1, 'follow', $2)`,
    [targetId, req.userId]
  );
  res.json({ following: true });
});
router3.delete("/:username", requireAuth, async (req, res) => {
  const { username } = req.params;
  const target = await pool_default.query("SELECT id FROM users WHERE username = $1", [username]);
  if (target.rows.length === 0) return res.status(404).json({ error: "User not found" });
  await pool_default.query(
    "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
    [req.userId, target.rows[0].id]
  );
  res.json({ following: false });
});
router3.get("/:username/followers", async (req, res) => {
  const result = await pool_default.query(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.species
     FROM follows f JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = (SELECT id FROM users WHERE username = $1)
     ORDER BY f.created_at DESC LIMIT 50`,
    [req.params.username]
  );
  res.json(result.rows);
});
router3.get("/:username/following", async (req, res) => {
  const result = await pool_default.query(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.species
     FROM follows f JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = (SELECT id FROM users WHERE username = $1)
     ORDER BY f.created_at DESC LIMIT 50`,
    [req.params.username]
  );
  res.json(result.rows);
});
router3.get("/suggestions/list", requireAuth, async (req, res) => {
  const result = await pool_default.query(
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
var follows_default = router3;

// server/routes/messages.ts
var import_express6 = require("express");
var router4 = (0, import_express6.Router)();
router4.get("/conversations", requireAuth, async (req, res) => {
  const result = await pool_default.query(
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
router4.get("/:username", requireAuth, async (req, res) => {
  const target = await pool_default.query("SELECT id FROM users WHERE username = $1", [req.params.username]);
  if (target.rows.length === 0) return res.status(404).json({ error: "User not found" });
  const otherId = target.rows[0].id;
  const result = await pool_default.query(
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
  await pool_default.query(
    `UPDATE messages SET read_at = NOW()
     WHERE sender_id = $1 AND recipient_id = $2 AND read_at IS NULL`,
    [otherId, req.userId]
  );
  res.json(result.rows);
});
router4.post("/:username", requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Message cannot be empty" });
  const target = await pool_default.query("SELECT id FROM users WHERE username = $1", [req.params.username]);
  if (target.rows.length === 0) return res.status(404).json({ error: "User not found" });
  const otherId = target.rows[0].id;
  if (otherId === req.userId) return res.status(400).json({ error: "Can't message yourself" });
  const result = await pool_default.query(
    `INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [req.userId, otherId, content.trim()]
  );
  const senderInfo = await pool_default.query(
    "SELECT username, display_name, avatar_url FROM users WHERE id = $1",
    [req.userId]
  );
  await pool_default.query(
    `INSERT INTO notifications (user_id, type, actor_id) VALUES ($1, 'message', $2)`,
    [otherId, req.userId]
  );
  res.status(201).json({
    ...result.rows[0],
    sender_username: senderInfo.rows[0].username,
    sender_name: senderInfo.rows[0].display_name,
    sender_avatar: senderInfo.rows[0].avatar_url
  });
});
var messages_default = router4;

// server/routes/notifications.ts
var import_express7 = require("express");
var router5 = (0, import_express7.Router)();
router5.get("/", requireAuth, async (req, res) => {
  const result = await pool_default.query(
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
router5.get("/unread-count", requireAuth, async (req, res) => {
  const result = await pool_default.query(
    "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL",
    [req.userId]
  );
  res.json({ count: parseInt(result.rows[0].count) });
});
router5.post("/read-all", requireAuth, async (req, res) => {
  await pool_default.query(
    "UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL",
    [req.userId]
  );
  res.json({ ok: true });
});
var notifications_default = router5;

// server.ts
var import_fs = __toESM(require("fs"), 1);

// server/stateRepository.ts
var import_pg2 = require("pg");
var speciesValues = ["cat", "dog"];
var stateCollectionValues = [
  "profiles",
  "posts",
  "stories",
  "notifications",
  "active-profile"
];
var StateRepository = class {
  constructor(client) {
    this.client = client;
  }
  async migrate() {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS user_app_state (
        user_id TEXT NOT NULL,
        species TEXT NOT NULL CHECK (species IN ('cat', 'dog')),
        collection TEXT NOT NULL CHECK (
          collection IN ('profiles', 'posts', 'stories', 'notifications', 'active-profile')
        ),
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, species, collection)
      );
      REVOKE ALL ON TABLE user_app_state FROM PUBLIC
    `);
  }
  async getUserState(userId, species) {
    const result = await this.client.query(
      `SELECT collection, payload
       FROM user_app_state
       WHERE user_id = $1 AND species = $2`,
      [userId, species]
    );
    const state = {
      profiles: null,
      posts: null,
      stories: null,
      notifications: null,
      "active-profile": null
    };
    for (const row of result.rows) {
      if (stateCollectionValues.includes(row.collection)) {
        state[row.collection] = row.payload;
      }
    }
    return state;
  }
  async saveCollection(userId, species, collection, payload) {
    await this.client.query(
      `INSERT INTO user_app_state (user_id, species, collection, payload)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (user_id, species, collection)
       DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [userId, species, collection, JSON.stringify(payload)]
    );
  }
};
var MemoryStateRepository = class {
  state = /* @__PURE__ */ new Map();
  async migrate() {
    return;
  }
  async getUserState(userId, species) {
    const speciesState = this.state.get(userId)?.get(species) ?? /* @__PURE__ */ new Map();
    const state = {
      profiles: null,
      posts: null,
      stories: null,
      notifications: null,
      "active-profile": null
    };
    for (const collection of stateCollectionValues) {
      state[collection] = speciesState.get(collection) ?? null;
    }
    return state;
  }
  async saveCollection(userId, species, collection, payload) {
    const userState = this.state.get(userId) ?? /* @__PURE__ */ new Map();
    const speciesState = userState.get(species) ?? /* @__PURE__ */ new Map();
    speciesState.set(collection, payload);
    userState.set(species, speciesState);
    this.state.set(userId, userState);
  }
};
function createStateRepository(databaseUrl) {
  const pool2 = new import_pg2.Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 3e4,
    connectionTimeoutMillis: 5e3
  });
  return {
    pool: pool2,
    repository: new StateRepository({
      query: async (sql, values) => pool2.query(sql, values)
    })
  };
}
function createMemoryStateRepository() {
  return {
    pool: null,
    repository: new MemoryStateRepository()
  };
}

// server/validation.ts
var RequestValidationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "RequestValidationError";
  }
};
function optionalText(value, field, maxLength, fallback = "") {
  if (value === void 0 || value === null || value === "") {
    return fallback;
  }
  if (typeof value !== "string") {
    throw new RequestValidationError(`${field} must be text.`);
  }
  const text = value.trim();
  if (text.length > maxLength) {
    throw new RequestValidationError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return text;
}
function booleanValue(value, field) {
  if (value === void 0) {
    return false;
  }
  if (typeof value !== "boolean") {
    throw new RequestValidationError(`${field} must be true or false.`);
  }
  return value;
}
function enumValue(value, field, allowed) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new RequestValidationError(`${field} must be one of: ${allowed.join(", ")}.`);
  }
  return value;
}
function statePayload(value, collection) {
  if (collection === "active-profile") {
    if (typeof value !== "string" || value.trim().length === 0 || value.length > 200) {
      throw new RequestValidationError("active-profile must be a non-empty string of 200 characters or fewer.");
    }
    return value;
  }
  if (!Array.isArray(value)) {
    throw new RequestValidationError(`${collection} must be an array.`);
  }
  if (value.length > 5e3) {
    throw new RequestValidationError(`${collection} may contain at most 5,000 items.`);
  }
  return value;
}
var allowedImageTypes = /* @__PURE__ */ new Set(["image/jpeg", "image/png", "image/webp"]);
function imageInput(imageBase64, mimeType) {
  if (imageBase64 === void 0 || imageBase64 === null || imageBase64 === "") {
    return null;
  }
  if (typeof imageBase64 !== "string") {
    throw new RequestValidationError("imageBase64 must be a base64 string.");
  }
  const dataUrlMatch = imageBase64.match(/^data:([^;,]+);base64,(.*)$/s);
  const suppliedMimeType = optionalText(mimeType, "mimeType", 50);
  const resolvedMimeType = (dataUrlMatch?.[1] || suppliedMimeType || "image/jpeg").toLowerCase();
  const data = (dataUrlMatch?.[2] || imageBase64).replace(/\s/g, "");
  if (!allowedImageTypes.has(resolvedMimeType)) {
    throw new RequestValidationError("Images must be JPEG, PNG, or WebP.");
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data) || data.length % 4 !== 0) {
    throw new RequestValidationError("imageBase64 is not valid base64 data.");
  }
  const estimatedBytes = data.length * 3 / 4 - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (estimatedBytes > 6e6) {
    throw new RequestValidationError("Images must be 6 MB or smaller.");
  }
  return { data, mimeType: resolvedMimeType };
}

// server.ts
import_dotenv2.default.config({ path: [".env.local", ".env"] });
async function startServer() {
  const config = getServerConfig(process.env);
  let pool2 = null;
  let stateRepository = createMemoryStateRepository().repository;
  let databaseUnavailable = false;
  try {
    const db = createStateRepository(config.databaseUrl);
    pool2 = db.pool;
    stateRepository = db.repository;
    await stateRepository.migrate();
  } catch (error) {
    if (config.isProduction) {
      databaseUnavailable = true;
      console.error(
        "PostgreSQL unavailable: serving websites only, /api will return 503.",
        error instanceof Error ? error.message : "unknown error"
      );
    } else {
      console.warn("PostgreSQL unavailable in local development mode; using in-memory state storage instead.");
    }
    stateRepository = createMemoryStateRepository().repository;
  }
  if (!databaseUnavailable) {
    try {
      const schemaSql = import_fs.default.readFileSync(import_path.default.join(process.cwd(), "server/db/schema.sql"), "utf8");
      await pool_default.query(schemaSql);
    } catch (error) {
      console.error("Social graph schema migration failed:", error instanceof Error ? error.message : error);
    }
  }
  const app = (0, import_express8.default)();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use((0, import_compression.default)());
  app.use((0, import_helmet.default)({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          config.clerkFrontendApiOrigin,
          "https://challenges.cloudflare.com",
          "https://*.protect.clerk.com"
        ],
        connectSrc: [
          "'self'",
          config.clerkFrontendApiOrigin,
          "https://*.protect.clerk.com:*",
          "https://clerk-telemetry.com",
          "https://*.clerk-telemetry.com"
        ],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        workerSrc: ["'self'", "blob:"],
        frameSrc: ["'self'", "https://challenges.cloudflare.com", "https://*.protect.clerk.com"],
        formAction: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"]
      }
    }
  }));
  app.use((0, import_express9.clerkMiddleware)({
    authorizedParties: config.clerkAuthorizedParties
  }));
  app.get(["/health", "/api/health"], (_req, res) => {
    res.json({ status: "ok", app: "Pawprint Network", database: databaseUnavailable ? "unavailable" : "ok" });
  });
  app.use("/api", (_req, res, next) => {
    if (!databaseUnavailable) return next();
    res.status(503).json({
      error: { code: "database_unavailable", message: "The service is temporarily unavailable. Please try again soon." }
    });
  });
  app.use("/api", import_express8.default.json({ limit: "25mb" }));
  app.use("/api/users", users_default);
  app.use("/api/posts", posts_default);
  app.use("/api/follows", follows_default);
  app.use("/api/messages", messages_default);
  app.use("/api/notifications", notifications_default);
  app.use("/api", requireApiAuth);
  app.use("/api", (0, import_express_rate_limit.rateLimit)({
    windowMs: 6e4,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (_req, res) => res.locals.auth.userId,
    message: {
      error: {
        code: "rate_limit_exceeded",
        message: "Too many API requests. Please try again shortly."
      }
    }
  }));
  const getGeminiClient = () => {
    return new import_genai.GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  };
  app.get("/api/state/:species", async (req, res, next) => {
    try {
      const species = enumValue(req.params.species, "species", speciesValues);
      const state = await stateRepository.getUserState(res.locals.auth.userId, species);
      return res.json({ state });
    } catch (error) {
      if (error instanceof RequestValidationError) {
        return res.status(400).json({
          error: { code: "invalid_request", message: error.message }
        });
      }
      return next(error);
    }
  });
  app.put("/api/state/:species/:collection", async (req, res, next) => {
    try {
      const species = enumValue(req.params.species, "species", speciesValues);
      const collection = enumValue(req.params.collection, "collection", stateCollectionValues);
      if (!Object.prototype.hasOwnProperty.call(req.body || {}, "data")) {
        throw new RequestValidationError("data is required.");
      }
      await stateRepository.saveCollection(
        res.locals.auth.userId,
        species,
        collection,
        statePayload(req.body.data, collection)
      );
      return res.status(204).send();
    } catch (error) {
      if (error instanceof RequestValidationError) {
        return res.status(400).json({
          error: { code: "invalid_request", message: error.message }
        });
      }
      return next(error);
    }
  });
  app.post("/api/gemini/cat-caption", async (req, res) => {
    let isDog = false;
    try {
      const body = req.body || {};
      const mood = optionalText(body.mood, "mood", 100, "Sassy Overlord");
      const breed = optionalText(body.breed, "breed", 100, "Domestic Cat");
      const topic = optionalText(body.topic, "topic", 500, "Living my best feline life");
      const location = optionalText(body.location, "location", 200, "The Sunbeam");
      isDog = booleanValue(body.isDog, "isDog");
      const ai = getGeminiClient();
      const prompt = `You are a majestic, hilarious cat on The Catwalk (by Pawprint Network) writing a social media post caption.
Context:
- Mood: ${mood}
- Breed: ${breed}
- Topic/Context: ${topic}
- Location: ${location}

Write a cat perspective caption. Keep it under 200 characters, witty, filled with cat emojis (\u{1F43E}, \u{1F63C}, \u{1F41F}, \u{1F4E6}, \u2600\uFE0F).
Also provide a 1-sentence "Human Translation".

Format response as strict JSON with fields:
- "caption": string
- "humanTranslation": string
- "tags": string[] (3-5 cat hashtags like #catloaf #3amzoomies #thecatwalk)`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              caption: { type: import_genai.Type.STRING },
              humanTranslation: { type: import_genai.Type.STRING },
              tags: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING }
              }
            },
            required: ["caption", "humanTranslation", "tags"]
          }
        }
      });
      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error) {
      if (error instanceof RequestValidationError) {
        return res.status(400).json({
          error: { code: "invalid_request", message: error.message }
        });
      }
      console.error("Gemini Caption Error:", error);
      return res.status(500).json({
        error: "Failed to generate a caption.",
        caption: isDog ? "WOOF! Something interrupted my zoomies so I could not write a caption. \u{1F9B4} #GoodBoyBlocked" : "Meow! The human delayed my treats so I refused to write a caption. \u{1F63C} #SassyCat",
        humanTranslation: "The caption service is temporarily unavailable.",
        tags: isDog ? ["#thedogpark", "#pawprintnetwork", "#geminiai"] : ["#thecatwalk", "#pawprintnetwork", "#geminiai"]
      });
    }
  });
  app.post("/api/gemini/meow-translator", async (req, res) => {
    let mode = "human-to-cat";
    let isDog = false;
    try {
      const body = req.body || {};
      mode = enumValue(body.mode, "mode", ["human-to-cat", "cat-to-human"]);
      const text = optionalText(body.text, "text", 2e3);
      isDog = booleanValue(body.isDog, "isDog");
      const ai = getGeminiClient();
      let prompt = "";
      if (isDog) {
        prompt = mode === "human-to-cat" ? `You are a joyful, enthusiastic dog. Translate this human message into Dog Speak (woofs, borks, tail wags, zoomie energy). Human text: "${text}". Reply ONLY with valid JSON: {"translatedText":"...","catMood":"...","actionNote":"..."}` : `You are translating dog barks into what the dog is REALLY thinking \u2014 joyful, loyal, squirrel-obsessed human thoughts. Dog sounds: "${text}". Reply ONLY with valid JSON: {"translatedText":"...","catMood":"...","actionNote":"..."}`;
      } else {
        prompt = mode === "human-to-cat" ? `Translate this human message into Cat Speak (meows, purrs, claw taps, cat arrogance). Human text: "${text}". Reply ONLY with valid JSON: {"translatedText":"...","catMood":"...","actionNote":"..."}` : `Translate these cat sounds into what the cat is REALLY thinking \u2014 sophisticated, sassy, regal human thoughts. Cat sounds: "${text}". Reply ONLY with valid JSON: {"translatedText":"...","catMood":"...","actionNote":"..."}`;
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              translatedText: { type: import_genai.Type.STRING },
              catMood: { type: import_genai.Type.STRING },
              actionNote: { type: import_genai.Type.STRING }
            },
            required: ["translatedText", "catMood", "actionNote"]
          }
        }
      });
      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error) {
      if (error instanceof RequestValidationError) {
        return res.status(400).json({
          error: { code: "invalid_request", message: error.message }
        });
      }
      console.error("Gemini Translator Error:", error);
      return res.status(500).json({
        error: "The translation service is temporarily unavailable.",
        translatedText: isDog ? mode === "human-to-cat" ? "WOOF WOOF *zooms around yard* (one word registered and it was WALK)." : 'Translation: "Did someone say TREAT?? I am SO ready. What are we doing."' : mode === "human-to-cat" ? "Meow prrrrr *slow blink* (Human, I acknowledged your attempt at communication)." : 'Translation: "Fill my bowl immediately or face 3 AM corridor zoomies."',
        catMood: isDog ? "Maximum Enthusiasm" : "Mildly Intrigued",
        actionNote: isDog ? "*vibrates with excitement*" : "*Tail flicks once*"
      });
    }
  });
  app.post("/api/gemini/cat-analyzer", async (req, res) => {
    try {
      const body = req.body || {};
      const image = imageInput(body.imageBase64, body.mimeType);
      const description = optionalText(body.description, "description", 2e3);
      const isDog = booleanValue(body.isDog, "isDog");
      const ai = getGeminiClient();
      let contents = [];
      if (image) {
        contents = [
          {
            inlineData: {
              mimeType: image.mimeType,
              data: image.data
            }
          },
          {
            text: isDog ? "Analyze this dog photo for The Dog Park. Rate its Goodness Level (0-100, higher = better good boy), Zoomie Rating, Inner Monologue, Breed Estimate, Mood Tag, Eyebrow Expressiveness Score, and a funny Dog Fun Fact." : "Analyze this cat photo for The Catwalk. Rate its Judgement Level (0-100), Loaf Form Rating, Inner Monologue, Breed Estimate, Mood Tag, Whiskers Score, and a funny Cat Fun Fact."
          }
        ];
      } else {
        contents = isDog ? `Analyze this dog description for The Dog Park: "${description || "A happy golden retriever doing maximum zoomies"}". Rate its Goodness Level (0-100), Zoomie Rating, Inner Monologue, Breed Estimate, Mood Tag, Eyebrow Expressiveness Score, and a funny Dog Fun Fact.` : `Analyze this cat description for The Catwalk: "${description || "An orange tabby cat sitting majestically in a cardboard box"}". Rate its Judgement Level (0-100), Loaf Form Rating, Inner Monologue, Breed Estimate, Mood Tag, Whiskers Score, and a funny Cat Fun Fact.`;
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              judgementLevel: { type: import_genai.Type.INTEGER },
              loafFormRating: { type: import_genai.Type.STRING },
              innerMonologue: { type: import_genai.Type.STRING },
              breedEstimate: { type: import_genai.Type.STRING },
              moodTag: { type: import_genai.Type.STRING },
              whiskersScore: { type: import_genai.Type.STRING },
              funFact: { type: import_genai.Type.STRING }
            },
            required: [
              "judgementLevel",
              "loafFormRating",
              "innerMonologue",
              "breedEstimate",
              "moodTag",
              "whiskersScore",
              "funFact"
            ]
          }
        }
      });
      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error) {
      if (error instanceof RequestValidationError) {
        return res.status(400).json({
          error: { code: "invalid_request", message: error.message }
        });
      }
      console.error("Gemini Analyzer Error:", error);
      return res.status(500).json({
        judgementLevel: 94,
        loafFormRating: "9.9 / 10 Flawless Tuck",
        innerMonologue: "I am judging your life choices from this sunbeam.",
        breedEstimate: "Majestic Domestic Short Hair",
        moodTag: "Supreme Monarch",
        whiskersScore: "10/10 Perfect Symmetry",
        funFact: "Cats spend 70% of their lives sleeping and 30% judging humans."
      });
    }
  });
  app.use("/api", (_req, res) => {
    res.status(404).json({
      error: { code: "not_found", message: "The requested API endpoint does not exist." }
    });
  });
  const apiErrorHandler = (error, req, res, next) => {
    if (!req.path.startsWith("/api/")) {
      return next(error);
    }
    console.error("Unhandled API error:", error);
    if (error?.type === "entity.too.large") {
      return res.status(413).json({
        error: { code: "payload_too_large", message: "The request body is too large." }
      });
    }
    if (error instanceof SyntaxError && "body" in error) {
      return res.status(400).json({
        error: { code: "invalid_json", message: "The request body must contain valid JSON." }
      });
    }
    return res.status(500).json({
      error: { code: "internal_error", message: "The server could not process the request." }
    });
  };
  app.use(apiErrorHandler);
  if (process.env.NODE_ENV !== "production") {
    const viteModuleName = ["vi", "te"].join("");
    const { createServer: createViteServer } = await import(viteModuleName);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist", "client");
    const publicPath = import_path.default.join(process.cwd(), "public");
    app.use(import_express8.default.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${import_path.default.sep}assets${import_path.default.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    }));
    app.use(import_express8.default.static(publicPath, { index: false, maxAge: "1h" }));
    const corporatePath = import_path.default.join(process.cwd(), "corporate-site");
    const isAppPath = (p) => p === "/app" || p.startsWith("/app/");
    const sendHtml = (res, file, status = 200) => {
      res.setHeader("Cache-Control", "no-cache");
      res.status(status).sendFile(file);
    };
    app.use("/api", (_req, res) => {
      res.status(404).json({ error: { code: "not_found", message: "Unknown API route." } });
    });
    app.get("*", (req, res) => {
      const host = (req.hostname || "").toLowerCase();
      if (isCorporateDomain(host)) {
        if (req.path === "/privacy" || req.path === "/privacy.html") {
          return sendHtml(res, import_path.default.join(corporatePath, "privacy.html"));
        }
        if (req.path === "/terms" || req.path === "/terms.html") {
          return sendHtml(res, import_path.default.join(corporatePath, "terms.html"));
        }
        if (isAppPath(req.path)) {
          return res.redirect(302, "/#apps");
        }
        const isHome = ["/", "/about", "/index.html"].includes(req.path);
        return sendHtml(res, import_path.default.join(corporatePath, "index.html"), isHome ? 200 : 404);
      }
      const brand = getAppBrand(host);
      if (brand) {
        if (isAppPath(req.path)) {
          return sendHtml(res, import_path.default.join(distPath, "index.html"));
        }
        return sendHtml(res, import_path.default.join(publicPath, `landing-${brand}.html`), req.path === "/" ? 200 : 404);
      }
      sendHtml(res, import_path.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(config.port, "0.0.0.0", () => {
    console.log(`\u{1F43E} \u{1F43E} The Catwalk (Pawprint Network) server listening on http://0.0.0.0:${config.port}`);
  });
  const shutdown = () => {
    server.close(() => {
      const finalize = pool2 ? pool2.end() : Promise.resolve();
      void finalize.finally(() => process.exit(0));
    });
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
startServer().catch((error) => {
  console.error("Pawprint Network could not start:", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
});
//# sourceMappingURL=server.cjs.map
