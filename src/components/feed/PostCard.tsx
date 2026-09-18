import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Post, Comment } from '../../types/index';
import { useApp } from '../../lib/AppContext';
import { api } from '../../lib/api';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { formatDistanceToNow } from '../../lib/utils';

interface PostCardProps {
  post: Post;
  onDelete?: (id: number) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const { theme, token, currentUser } = useApp();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(Number(post.like_count));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [following, setFollowing] = useState(post.author_is_following ?? false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwn = currentUser?.id === post.user_id;

  async function toggleFollow() {
    if (!token || isOwn || followLoading) return;
    setFollowLoading(true);
    try {
      if (following) {
        await api.unfollow(post.username, token);
        setFollowing(false);
      } else {
        await api.follow(post.username, token);
        setFollowing(true);
      }
    } finally {
      setFollowLoading(false);
    }
  }

  async function sharePost() {
    const url = `${window.location.origin}/profile/${post.username}`;
    const data = { title: `${post.display_name} on Pawprint Network`, text: post.content, url };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(`${post.content}\n${url}`);
  }

  async function toggleLike() {
    if (!token) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? c - 1 : c + 1);
    try {
      if (wasLiked) {
        await api.unlikePost(post.id, token);
      } else {
        await api.likePost(post.id, token);
      }
    } catch {
      // revert
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : c - 1);
    }
  }

  async function loadComments() {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true);
    try {
      const data = await api.getComments(post.id, token || undefined) as Comment[];
      setComments(data);
      setShowComments(true);
    } finally {
      setLoadingComments(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.addComment(post.id, commentText.trim(), token) as Comment;
      setComments(prev => [...prev, comment]);
      setCommentText('');
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePost() {
    if (!token || !isOwn) return;
    if (!confirm('Delete this post?')) return;
    await api.deletePost(post.id, token);
    onDelete?.(post.id);
  }

  return (
    <article style={{
      background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16,
      marginBottom: 16, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0' }}>
        <Link to={`/profile/${post.username}`} style={{ textDecoration: 'none' }}>
          <Avatar src={post.avatar_url} name={post.display_name} size="md" />
        </Link>
        <div style={{ flex: 1 }}>
          <Link to={`/profile/${post.username}`}
            style={{ color: theme.text, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            {post.display_name}
          </Link>
          <div style={{ color: theme.textMuted, fontSize: 13 }}>
            @{post.username} · {formatDistanceToNow(post.created_at)}
          </div>
        </div>
        {!isOwn && token && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link to={`/messages/${post.username}`} style={{ color: theme.textMuted, textDecoration: 'none', fontSize: 13 }}>
              Message
            </Link>
            <button onClick={toggleFollow} disabled={followLoading}
              style={{ border: `1px solid ${theme.border}`, borderRadius: 8, padding: '6px 10px',
                background: following ? theme.surface : theme.primary, color: following ? theme.text : '#fff',
                cursor: followLoading ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700 }}>
              {followLoading ? '…' : following ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
        {isOwn && (
          <button onClick={deletePost}
            style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: 18 }}>
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px', color: theme.text, fontSize: 15, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
        {post.content}
      </div>

      {/* Location / category tags — free-form text the author chose, not a fixed list */}
      {(post.location || post.category) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 16px 10px' }}>
          {post.category && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: theme.primary, background: theme.surfaceHover,
              border: `1px solid ${theme.border}`, borderRadius: 999, padding: '3px 10px',
            }}>
              🏷️ {post.category}
            </span>
          )}
          {post.location && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: theme.textMuted, background: theme.surfaceHover,
              border: `1px solid ${theme.border}`, borderRadius: 999, padding: '3px 10px',
            }}>
              📍 {post.location}
            </span>
          )}
        </div>
      )}

      {/* Video or image */}
      {post.media_type === 'video' && post.video_url ? (
        <video src={post.video_url} controls playsInline style={{
          width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block', background: '#000',
        }} />
      ) : post.image_url && (
        <img src={post.image_url} alt="Post" style={{
          width: '100%', maxHeight: 400, objectFit: 'cover',
          display: 'block',
        }} />
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 24, padding: '12px 16px', borderTop: `1px solid ${theme.border}` }}>
        <button onClick={toggleLike}
          style={{ background: 'none', border: 'none', cursor: token ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 6,
            color: liked ? '#ec4899' : theme.textMuted, fontWeight: liked ? 700 : 400,
            fontSize: 14, transition: 'color 0.15s',
          }}>
          {liked ? '♥' : '♡'} {likeCount}
        </button>
        <button onClick={loadComments}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            color: showComments ? theme.primary : theme.textMuted, fontSize: 14,
          }}>
          💬 {post.comment_count}
        </button>
        <button onClick={sharePost}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 6, color: theme.textMuted, fontSize: 14 }}>
          ↗ Share
        </button>
      </div>

      {/* Comments section */}
      {loadingComments && (
        <div style={{ padding: '8px 16px', color: theme.textMuted, fontSize: 13 }}>Loading…</div>
      )}
      {showComments && (
        <div style={{ borderTop: `1px solid ${theme.border}` }}>
          {comments.length === 0 && (
            <div style={{ padding: '12px 16px', color: theme.textMuted, fontSize: 13 }}>
              No comments yet. Be the first!
            </div>
          )}
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 10, padding: '10px 16px',
              borderBottom: `1px solid ${theme.border}` }}>
              <Avatar src={c.avatar_url} name={c.display_name} size="sm" />
              <div>
                <Link to={`/profile/${c.username}`}
                  style={{ color: theme.text, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                  {c.display_name}
                </Link>
                <div style={{ color: theme.text, fontSize: 14, marginTop: 2 }}>{c.content}</div>
                <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                  {formatDistanceToNow(c.created_at)}
                </div>
              </div>
            </div>
          ))}
          {token && (
            <form onSubmit={submitComment} style={{ display: 'flex', gap: 8, padding: '10px 16px' }}>
              <Avatar src={currentUser?.avatar_url} name={currentUser?.display_name || '?'} size="sm" />
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment…"
                style={{
                  flex: 1, background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                  borderRadius: 8, padding: '8px 12px', color: theme.text, fontSize: 14,
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
              <Button type="submit" size="sm" loading={submitting} disabled={!commentText.trim()}>
                Post
              </Button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
