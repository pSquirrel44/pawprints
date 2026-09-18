import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Post } from '../types/index';
import { useApp } from '../lib/AppContext';
import { api } from '../lib/api';
import { PostCard } from '../components/feed/PostCard';
import { PostComposer } from '../components/feed/PostComposer';

export default function HomePage() {
  const { isSignedIn } = useAuth();
  const { theme, token } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = useCallback(async (cursor?: string) => {
    if (!token) return;
    try {
      const data = await api.getFeed(token, cursor) as Post[];
      if (cursor) {
        setPosts(prev => [...prev, ...data]);
      } else {
        setPosts(data);
      }
      setHasMore(data.length === 20);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadFeed();
  }, [token]);

  function handleNewPost(post: Post) {
    setPosts(prev => [post, ...prev]);
  }

  function handleDelete(id: number) {
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  function loadMore() {
    if (!hasMore || loadingMore || posts.length === 0) return;
    const last = posts[posts.length - 1];
    setLoadingMore(true);
    loadFeed(last.created_at);
  }

  if (!isSignedIn) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{theme.emoji}</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: theme.text, marginBottom: 8 }}>
          Welcome to {theme.platformName}
        </h1>
        <p style={{ color: theme.textMuted, fontSize: 16, marginBottom: 32 }}>
          {theme.tagline}
        </p>
        <a href="/sign-in" style={{
          display: 'inline-block', padding: '12px 28px',
          background: theme.gradientBtn, color: '#fff',
          borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: 15,
        }}>
          Get started
        </a>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '16px 0 0', borderBottom: `1px solid ${theme.border}`,
        position: 'sticky', top: 0, background: theme.bg, zIndex: 10, marginBottom: 0 }}>
        <h2 style={{ margin: '0 0 16px', padding: '0 16px', color: theme.text,
          fontSize: 18, fontWeight: 700 }}>Home</h2>
      </div>

      <div style={{ padding: '16px' }}>
        <PostComposer onPost={handleNewPost} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>Loading feed…</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{theme.emoji}</div>
            <p style={{ color: theme.textMuted }}>
              Your feed is empty. Follow some {theme.platformName === 'The Catwalk' ? 'cat lovers' : 'dog lovers'} to get started!
            </p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onDelete={handleDelete} />
            ))}
            {hasMore && (
              <button onClick={loadMore} disabled={loadingMore}
                style={{
                  width: '100%', padding: '14px', background: theme.surface,
                  border: `1px solid ${theme.border}`, borderRadius: 12,
                  color: theme.textMuted, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                }}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
