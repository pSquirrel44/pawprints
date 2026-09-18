import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, MapPin, Tag, Video, X } from 'lucide-react';
import { Post } from '../../types/index';
import { useApp } from '../../lib/AppContext';
import { api } from '../../lib/api';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { LiveFilterCamera, CapturedMedia } from '../LiveFilterCamera';

interface CreatePostModalProps {
  onPost: (post: Post) => void;
  onClose: () => void;
}

// Starter suggestion lists — users are never limited to these. Anything they
// type is accepted, and new entries they use are remembered locally so they
// show up as suggestions next time (their own growing, personal list).
const STARTER_CATEGORIES = [
  'Playtime', 'Nap Time', 'Zoomies', 'Grooming', 'Treats', 'Outdoors',
  'New Friend', 'Costume', 'Sleepy', 'Mischief',
];
const STARTER_LOCATIONS = [
  'Backyard', 'Dog Park', 'Living Room', 'Vet Visit', 'Beach', 'Park',
  'Couch', 'Window Watching',
];

const CUSTOM_CATEGORIES_KEY = 'pawprints_custom_categories';
const CUSTOM_LOCATIONS_KEY = 'pawprints_custom_locations';

function loadCustomList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function rememberCustomValue(key: string, value: string, starter: string[]) {
  const trimmed = value.trim();
  if (!trimmed) return;
  const already = starter.some(v => v.toLowerCase() === trimmed.toLowerCase());
  if (already) return;
  try {
    const existing = loadCustomList(key);
    const withoutDupe = existing.filter(v => v.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...withoutDupe].slice(0, 30);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — not critical, just skip remembering it
  }
}

// Raw file size guard. The server accepts up to 25mb of JSON; base64 inflates
// bytes by ~33%, so we cap the raw upload comfortably under that ceiling.
const MAX_UPLOAD_BYTES = 17 * 1024 * 1024;

export function CreatePostModal({ onPost, onClose }: CreatePostModalProps) {
  const { theme, token, currentUser, species } = useApp();
  const isDog = species === 'dog';

  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxLen = 500;
  const remaining = maxLen - content.length;

  const categoryOptions = [...loadCustomList(CUSTOM_CATEGORIES_KEY), ...STARTER_CATEGORIES];
  const locationOptions = [...loadCustomList(CUSTOM_LOCATIONS_KEY), ...STARTER_LOCATIONS];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`That file is too big (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose one under 17MB.`);
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setMediaType(isVideo ? 'video' : 'image');
    };
    reader.onerror = () => setError('Could not read that file. Please try another.');
    reader.readAsDataURL(file);

    // Reset so choosing the same file again still fires onChange
    e.target.value = '';
  }

  function handleCameraCapture(media: CapturedMedia) {
    setMediaUrl(media.url);
    setMediaType(media.mediaType);
    setShowCamera(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !content.trim()) return;
    if (content.length > maxLen) { setError(`Too long by ${-remaining} chars`); return; }
    setSubmitting(true);
    setError('');
    try {
      const post = await api.createPost({
        content: content.trim(),
        image_url: mediaType === 'image' ? mediaUrl : '',
        video_url: mediaType === 'video' ? mediaUrl : '',
        media_type: mediaUrl ? mediaType : 'image',
        species,
        location: location.trim(),
        category: category.trim(),
      }, token) as Post;

      rememberCustomValue(CUSTOM_CATEGORIES_KEY, category, STARTER_CATEGORIES);
      rememberCustomValue(CUSTOM_LOCATIONS_KEY, location, STARTER_LOCATIONS);

      onPost(post);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  }

  if (showCamera) {
    return (
      <LiveFilterCamera
        isDog={isDog}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '5vh 16px', zIndex: 1000, overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(560px, 100%)', background: theme.surface,
          border: `1px solid ${theme.border}`, borderRadius: 16,
          padding: 20, boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>
            Create {isDog ? 'Bark' : 'Purr'} Post
          </h2>
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar src={currentUser?.avatar_url} name={currentUser?.display_name || ''} size="md" />
            <textarea
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`What's happening in the ${isDog ? 'Dog Park' : 'Catwalk'}? ${isDog ? '🐶' : '🐱'}`}
              rows={4}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: theme.text, fontSize: 16, resize: 'none', fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
          </div>

          {mediaUrl && (
            <div style={{ position: 'relative', marginTop: 8 }}>
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls playsInline
                  style={{ width: '100%', maxHeight: 320, borderRadius: 10, background: '#000', display: 'block' }} />
              ) : (
                <img src={mediaUrl} alt="Preview"
                  style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
              )}
              <button type="button" onClick={() => setMediaUrl('')}
                style={{
                  position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)',
                  border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Remove media"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Media actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => setShowCamera(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: 999,
                color: theme.text, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              }}
            >
              <Camera size={16} /> Open Camera
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: 999,
                color: theme.text, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              }}
            >
              <ImageIcon size={16} /> Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Free-form location + category — never a fixed list, always editable */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', position: 'relative' }}>
              <MapPin size={15} style={{ position: 'absolute', left: 10, top: 11, color: theme.textMuted }} />
              <input
                list="pawprints-location-options"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Add a location (type anything)"
                maxLength={120}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 10px 8px 32px',
                  background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                  borderRadius: 8, color: theme.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
                }}
              />
              <datalist id="pawprints-location-options">
                {locationOptions.map(opt => <option key={opt} value={opt} />)}
              </datalist>
            </div>
            <div style={{ flex: '1 1 200px', position: 'relative' }}>
              <Tag size={15} style={{ position: 'absolute', left: 10, top: 11, color: theme.textMuted }} />
              <input
                list="pawprints-category-options"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Add a category (make your own!)"
                maxLength={60}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 10px 8px 32px',
                  background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                  borderRadius: 8, color: theme.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
                }}
              />
              <datalist id="pawprints-category-options">
                {categoryOptions.map(opt => <option key={opt} value={opt} />)}
              </datalist>
            </div>
          </div>

          {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 10 }}>{error}</div>}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 16, borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
            <span style={{ color: remaining < 50 ? '#f87171' : theme.textMuted, fontSize: 13 }}>
              {remaining}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={submitting} disabled={!content.trim() || remaining < 0}>
                Post
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
