import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Post } from '../types/index';
import { useApp } from '../lib/AppContext';
import { api } from '../lib/api';
import { PostCard } from '../components/feed/PostCard';
import { Button } from '../components/ui/Button';

export default function ProfilePage() {
  const { username: routeUsername } = useParams<{ username: string }>();
  const { theme, token, currentUser } = useApp();
  const username = routeUsername || currentUser?.username;
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [tab, setTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [followers, setFollowers] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    Promise.all([
      api.getUser(username, token || undefined),
      api.getUserPosts(username, token || undefined),
    ]).then(([u, p]) => {
      const usr = u as User;
      setUser(usr);
      setFollowing(usr.is_following ?? false);
      setEditBio(usr.bio || '');
      setEditName(usr.display_name);
      setPosts(p as Post[]);
    }).finally(() => setLoading(false));
  }, [username, token]);

  async function toggleFollow() {
    if (!token || !user) return;
    setFollowLoading(true);
    try {
      if (following) {
        await api.unfollow(user.username, token);
        setFollowing(false);
        setUser(u => u ? { ...u, follower_count: Number(u.follower_count) - 1 } : u);
      } else {
        await api.follow(user.username, token);
        setFollowing(true);
        setUser(u => u ? { ...u, follower_count: Number(u.follower_count) + 1 } : u);
      }
    } finally {
      setFollowLoading(false);
    }
  }

  async function loadFollowers() {
    if (!username) return;
    const data = await api.getFollowers(username) as User[];
    setFollowers(data);
    setTab('followers');
  }

  async function loadFollowing() {
    if (!username) return;
    const data = await api.getFollowing(username) as User[];
    setFollowingList(data);
    setTab('following');
  }

  async function saveEdit() {
    if (!token) return;
    await api.updateMe({ display_name: editName, bio: editBio }, token);
    setUser(u => u ? { ...u, display_name: editName, bio: editBio } : u);
    setEditing(false);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>Loading…</div>;
  if (!user) return <div style={{ textAlign: 'center', padding: 60, color: '#f87171' }}>User not found</div>;

  const avatarSrc = user.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${user.username}`;

  return (
    <div>
      {/* Cover gradient */}
      <div style={{ height: 140, background: theme.gradient }} />

      {/* Profile header */}
      <div style={{ padding: '0 24px 16px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginTop: -48, marginBottom: 12 }}>
          <img src={avatarSrc} alt={user.display_name}
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
              border: `4px solid ${theme.bg}` }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {isOwnProfile ? (
              <Button variant="secondary" size="sm" onClick={() => setEditing(!editing)}>
                {editing ? 'Cancel' : 'Edit profile'}
              </Button>
            ) : token ? (
              <>
                <Link to={`/messages/${user.username}`}>
                  <Button variant="secondary" size="sm">Message</Button>
                </Link>
                <Button
                  variant={following ? 'secondary' : 'primary'}
                  size="sm"
                  loading={followLoading}
                  onClick={toggleFollow}
                >
                  {following ? 'Following' : 'Follow'}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {editing ? (
          <div style={{ marginBottom: 16 }}>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              placeholder="Display name"
              style={{ display: 'block', width: '100%', marginBottom: 8, padding: '8px 12px',
                background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8,
                color: theme.text, fontFamily: 'inherit', fontSize: 15, outline: 'none',
                boxSizing: 'border-box' }} />
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)}
              rows={3} placeholder="Bio…"
              style={{ display: 'block', width: '100%', marginBottom: 8, padding: '8px 12px',
                background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8,
                color: theme.text, fontFamily: 'inherit', fontSize: 14, resize: 'none', outline: 'none',
                boxSizing: 'border-box' }} />
            <Button size="sm" onClick={saveEdit}>Save changes</Button>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 800, fontSize: 20, color: theme.text }}>{user.display_name}</div>
            <div style={{ color: theme.textMuted, fontSize: 14, marginBottom: 8 }}>@{user.username}</div>
            {user.bio && <div style={{ color: theme.text, fontSize: 14, marginBottom: 12 }}>{user.bio}</div>}
          </>
        )}

        <div style={{ display: 'flex', gap: 24 }}>
          <button onClick={() => setTab('posts')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            <span style={{ fontWeight: 700, color: theme.text }}>{user.post_count ?? posts.length}</span>{' '}
            <span style={{ color: theme.textMuted, fontSize: 13 }}>Posts</span>
          </button>
          <button onClick={loadFollowers}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            <span style={{ fontWeight: 700, color: theme.text }}>{user.follower_count ?? 0}</span>{' '}
            <span style={{ color: theme.textMuted, fontSize: 13 }}>Followers</span>
          </button>
          <button onClick={loadFollowing}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            <span style={{ fontWeight: 700, color: theme.text }}>{user.following_count ?? 0}</span>{' '}
            <span style={{ color: theme.textMuted, fontSize: 13 }}>Following</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}` }}>
        {(['posts', 'followers', 'following'] as const).map(t => (
          <button key={t} onClick={() => { if (t === 'followers') loadFollowers(); else if (t === 'following') loadFollowing(); else setTab('posts'); }}
            style={{
              flex: 1, padding: '12px', background: 'none', border: 'none',
              borderBottom: tab === t ? `2px solid ${theme.primary}` : '2px solid transparent',
              color: tab === t ? theme.text : theme.textMuted,
              fontWeight: tab === t ? 700 : 400, cursor: 'pointer', fontSize: 14,
              fontFamily: 'inherit', textTransform: 'capitalize',
            }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {tab === 'posts' && (
          posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>No posts yet.</div>
          ) : posts.map(p => <PostCard key={p.id} post={p} onDelete={id => setPosts(prev => prev.filter(p => p.id !== id))} />)
        )}
        {tab === 'followers' && (
          followers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>No followers yet.</div>
          ) : (
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden' }}>
              {followers.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
                  <Link to={`/profile/${u.username}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1 }}>
                    <img src={u.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${u.username}`}
                      alt={u.display_name} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                    <div>
                      <div style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>{u.display_name}</div>
                      <div style={{ color: theme.textMuted, fontSize: 12 }}>@{u.username}</div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )
        )}
        {tab === 'following' && (
          followingList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>Not following anyone yet.</div>
          ) : (
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden' }}>
              {followingList.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
                  <Link to={`/profile/${u.username}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1 }}>
                    <img src={u.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${u.username}`}
                      alt={u.display_name} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                    <div>
                      <div style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>{u.display_name}</div>
                      <div style={{ color: theme.textMuted, fontSize: 12 }}>@{u.username}</div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
