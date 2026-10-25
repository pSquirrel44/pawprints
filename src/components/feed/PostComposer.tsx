import React, { useState } from 'react';
import { Post } from '../../types';
import { useApp } from '../../lib/AppContext';
import { api } from '../../lib/api';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface PostComposerProps {
  onPost: (post: Post) => void;
}

export function PostComposer({ onPost }: PostComposerProps) {
  const { theme, token, currentUser, species } = useApp();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const maxLen = 500;
  const remaining = maxLen - content.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !content.trim()) return;
    if (content.length > maxLen) { setError(`Too long by ${-remaining} chars`); return; }
    setSubmitting(true);
    setError('');
    try {
      const post = await api.createPost({ content: content.trim(), image_url: imageUrl, species }, token) as Post;
      onPost(post);
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
    } catch (err: any) {
      setError(err.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  }

  if (!currentUser) return null;

  return (
    <div style={{
      background: theme.surface, border: `1px solid ${theme.border}`,
      borderRadius: 16, padding: 16, marginBottom: 20,
    }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Avatar src={currentUser.avatar_url} name={currentUser.display_name} size="md" />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`What's happening in the ${species === 'cat' ? 'Catwalk' : 'Dog Park'}? ${species === 'cat' ? '🐱' : '🐶'}`}
            rows={3}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: theme.text, fontSize: 16, resize: 'none', fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
        </div>

        {showImageInput && (
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Paste an image URL…"
            style={{
              width: '100%', marginTop: 8, padding: '8px 12px',
              background: theme.surfaceHover, border: `1px solid ${theme.border}`,
              borderRadius: 8, color: theme.text, fontSize: 14, fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        )}

        {imageUrl && (
          <img src={imageUrl} alt="Preview"
            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginTop: 8 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 6 }}>{error}</div>}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 12, borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
          <button type="button" onClick={() => setShowImageInput(!showImageInput)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: 20 }}>
            🖼
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: remaining < 50 ? '#f87171' : theme.textMuted, fontSize: 13 }}>
              {remaining}
            </span>
            <Button type="submit" loading={submitting} disabled={!content.trim() || remaining < 0}>
              Post
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
