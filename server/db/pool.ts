import { Pool } from 'pg';
import dotenv from 'dotenv';

// This module reads process.env.DATABASE_URL at the moment it is first
// required, which — because of how esbuild/CJS orders `require()` calls —
// can happen BEFORE server.ts's own top-level `dotenv.config()` call runs
// (any router that imports this pool, e.g. server/routes/users.ts, pulls it
// in during the require chain, ahead of server.ts's own later statements).
// That left DATABASE_URL undefined here, so `pg` silently fell back to a
// connection with no username at all ("no PostgreSQL user name specified
// in startup packet"). Loading .env here too — before constructing the
// Pool — makes this module self-sufficient regardless of import order.
// dotenv does not overwrite variables already set in process.env, so this
// is safe to call again even after server.ts's own dotenv.config().
dotenv.config({ path: ['.env.local', '.env'] });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Gandi's managed Postgres runs on localhost alongside the app and does not
  // support/require SSL. Only enable SSL if explicitly requested via env var
  // (for a remote/managed DB elsewhere that does require it).
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
});

export default pool;
