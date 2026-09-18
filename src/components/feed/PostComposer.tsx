import React, { useEffect, useState } from 'react';
import { Post } from '../../types/index';
import { useApp } from '../../lib/AppContext';
import { Avatar } from '../ui/Avatar';
import { CreatePostModal } from './CreatePostModal';

interface PostComposerProps {
  onPost: (post: Post) => void;
}

// Sidebar's "Create" button sets this flag before navigating here, so the
// composer opens right away instead of making people find the trigger.
export const AUTO_OPEN_CREATE_FLAG = 'pawprints_auto_open_create';

export function PostComposer({ onPost }: PostComposerProps) {
  const { theme, currentUser, species } = useApp();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(AUTO_OPEN_CREATE_FLAG) === '1') {
        sessionStorage.removeItem(AUTO_OPEN_CREATE_FLAG);
        setOpen(true);
      }
    } catch {
      // sessionStorage unavailable — just skip auto-open
    }
  }, []);

  if (!currentUser) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: 16, padding: 16, marginBottom: 20, cursor: 'pointer',
          textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        <Avatar src={currentUser.avatar_url} name={currentUser.display_name} size="md" />
        <span style={{ color: theme.textMuted, fontSize: 16 }}>
          {`What's happening in the ${species === 'cat' ? 'Catwalk' : 'Dog Park'}? ${species === 'cat' ? '🐱' : '🐶'}`}
        </span>
      </button>

      {open && (
        <CreatePostModal
          onPost={onPost}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
