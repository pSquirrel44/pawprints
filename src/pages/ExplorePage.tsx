import React, { useEffect, useState } from 'react';
import { Post, User } from '../types/index';
import { useApp } from '../lib/AppContext';
import { api } from '../lib/api';
import { PostCard } from '../components/feed/PostCard';
import { UserCard } from '../components/social/UserCard';

export default function ExplorePage() {
  const { theme, token, species } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'posts' | 'people'>('posts');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.getExplore(species, 0, token || undefined)
      .then(data => setPosts(data as Post[]))
      .finally(() => setLoading(false));
  }, [species, token]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    try {
      const data = await api.searchUsers(search, token || undefined) as User[];
      setUsers(data);
      setTab('people');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <div style={{ padding: '16px', borderBottom: `1px solid ${theme.border}`,
        position: 'sticky', top: 0, background: theme.bg, zIndex: 10 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people…"
            style={{
              flex: 1, padding: '10px 16px', background: theme.surface,
              border: `1px solid ${theme.border}`, borderRadius: 24,
              color: theme.text, fontSize: 14, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button type="submit" disabled={searching}
            style={{
              padding: '10px 18px', background: theme.gradientBtn, color: '#fff',
              border: 'none', borderRadius: 24, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 14,
            }}>
            {searching ? '…' : 'Search'}
          </button>
        </form>

        <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
          {(['posts', 'people'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px', background: 'none', border: 'none',
                borderBottom: tab === t ? `2px solid ${theme.primary}` : '2px solid transparent',
                color: tab === t ? theme.text : theme.textMuted,
                fontWeight: tab === t ? 700 : 400, cursor: 'pointer', fontSize: 14,
                fontFamily: 'inherit', textTransform: 'capitalize',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {tab === 'posts' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>Loading…</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>
              No posts yet. Be the first!
            </div>
          ) : posts.map(p => <PostCard key={p.id} post={p} />)
        )}
        {tab === 'people' && (
          users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>
              {search ? 'No users found.' : 'Search to find people to follow.'}
            </div>
          ) : (
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden' }}>
              {users.map(u => <UserCard key={u.id} user={u} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
}
