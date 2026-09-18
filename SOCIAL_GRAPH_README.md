# Social Graph — Integration Guide

## What's in this package

This is a **drop-in social graph layer** for Pawprint Network. Copy the files into your existing `pawprints-gandi` repo — they're designed to slot in without breaking anything already live.

---

## Step 1 — Run the DB migration

SSH into Gandi (or use the Gandi admin panel SQL editor) and run:

```sql
\i server/db/schema.sql
```

This creates: `users`, `posts`, `likes`, `comments`, `follows`, `messages`, `notifications`.

All tables use `CREATE TABLE IF NOT EXISTS` — safe to run on an existing database.

---

## Step 2 — Copy files into your repo

```
server/
  db/pool.ts            ← replace your existing pool if different
  db/schema.sql         ← run once in Postgres
  middleware/auth.ts    ← new: Clerk middleware with internal user ID lookup
  routes/users.ts       ← new
  routes/posts.ts       ← new
  routes/follows.ts     ← new
  routes/messages.ts    ← new
  routes/notifications.ts ← new
  index.ts              ← UPDATE your existing server/index.ts to add the new routes

src/
  types/index.ts
  lib/theme.ts          ← your existing theme system, expanded
  lib/api.ts            ← full API client
  lib/AppContext.tsx    ← global state provider
  lib/utils.ts
  components/
    feed/PostCard.tsx
    feed/PostComposer.tsx
    social/UserCard.tsx
    ui/Avatar.tsx
    ui/Button.tsx
    ui/Sidebar.tsx
    ui/RightSidebar.tsx
  pages/
    HomePage.tsx
    ExplorePage.tsx
    ProfilePage.tsx
    MessagesPage.tsx
    NotificationsPage.tsx
  App.tsx               ← update your existing App.tsx to use these routes
  main.tsx              ← update to wrap with ClerkProvider + BrowserRouter
  index.css
```

---

## Step 3 — Update server/index.ts

Add to your existing server:

```ts
import usersRouter from './routes/users';
import postsRouter from './routes/posts';
import followsRouter from './routes/follows';
import messagesRouter from './routes/messages';
import notificationsRouter from './routes/notifications';

app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/follows', followsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);
```

---

## Step 4 — Environment variables

Copy `.env.example` → `.env` and fill in your Clerk keys + DATABASE_URL.

---

## Step 5 — Build & deploy

```bash
npm install
npm run build
# Then push to Gandi's git remote as normal
git add .
git commit -m "feat: full social graph — posts, follows, messages, notifications"
git push gandi HEAD:main
```

---

## How species detection works

The `detectSpecies()` function in `src/lib/theme.ts` reads `window.location.hostname`:
- `instameow.app` → **cat** theme (purple/pink)
- `instawoof.app` → **dog** theme (teal/amber)

Both domains serve the same codebase. The theme is applied at runtime.

---

## API endpoints added

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/users/sync | ✅ | Upsert user after Clerk sign-in |
| GET | /api/users/me | ✅ | Current user profile |
| GET | /api/users/:username | optional | Public profile |
| PUT | /api/users/me | ✅ | Edit bio / display name |
| GET | /api/posts/feed | ✅ | Followed users' posts |
| GET | /api/posts/explore/:species | optional | Public explore feed |
| POST | /api/posts | ✅ | Create post |
| POST | /api/posts/:id/like | ✅ | Like a post |
| DELETE | /api/posts/:id/like | ✅ | Unlike |
| POST | /api/posts/:id/comments | ✅ | Comment |
| POST | /api/follows/:username | ✅ | Follow |
| DELETE | /api/follows/:username | ✅ | Unfollow |
| GET | /api/follows/suggestions/list | ✅ | Who to follow |
| GET | /api/messages/conversations | ✅ | DM thread list |
| GET | /api/messages/:username | ✅ | Read a conversation |
| POST | /api/messages/:username | ✅ | Send a DM |
| GET | /api/notifications | ✅ | All notifications |
| POST | /api/notifications/read-all | ✅ | Mark all read |
