import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types/index';
import { useApp } from '../../lib/AppContext';
import { api } from '../../lib/api';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface UserCardProps {
  user: User & { follower_count?: number };
  compact?: boolean;
}

export function UserCard({ user, compact = false }: UserCardProps) {
  const { theme, token, currentUser } = useApp();
  const [following, setFollowing] = useState(user.is_following ?? false);
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    if (!token) return;
    setLoading(true);
    try {
      if (following) {
        await api.unfollow(user.username, token);
        setFollowing(false);
      } else {
        await api.follow(user.username, token);
        setFollowing(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: compact ? '8px 0' : '12px 16px',
      borderBottom: compact ? 'none' : `1px solid ${theme.border}`,
    }}>
      <Link to={`/profile/${user.username}`} style={{ textDecoration: 'none' }}>
        <Avatar src={user.avatar_url} name={user.display_name} size={compact ? 'sm' : 'md'} />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/profile/${user.username}`} style={{ textDecoration: 'none' }}>
          <div style={{ color: theme.text, fontWeight: 600, fontSize: compact ? 13 : 14,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.display_name}
          </div>
          <div style={{ color: theme.textMuted, fontSize: 12 }}>@{user.username}</div>
        </Link>
        {!compact && user.bio && (
          <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.bio}
          </div>
        )}
      </div>
      {token && currentUser?.id !== user.id && (
        <Button
          variant={following ? 'secondary' : 'primary'}
          size="sm"
          loading={loading}
          onClick={toggleFollow}
        >
          {following ? 'Following' : 'Follow'}
        </Button>
      )}
    </div>
  );
}
