import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Notification } from '../types/index';
import { useApp } from '../lib/AppContext';
import { api } from '../lib/api';
import { formatDistanceToNow } from '../lib/utils';

const icons: Record<string, string> = {
  like: '♥',
  comment: '💬',
  follow: '👤',
  message: '✉️',
};

const labels: Record<string, string> = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'followed you',
  message: 'sent you a message',
};

export default function NotificationsPage() {
  const { theme, token, refreshUnread } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.getNotifications(token)
      .then(d => setNotifications(d as Notification[]))
      .finally(() => setLoading(false));
    api.markAllRead(token).then(() => refreshUnread());
  }, [token]);

  if (!token) return <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>Sign in to view notifications</div>;

  return (
    <div>
      <div style={{ padding: '16px', fontWeight: 700, color: theme.text, fontSize: 18,
        borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, background: theme.bg, zIndex: 10 }}>
        Notifications
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>Loading…</div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <div style={{ color: theme.textMuted }}>No notifications yet</div>
        </div>
      ) : (
        <div>
          {notifications.map(n => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
              borderBottom: `1px solid ${theme.border}`,
              background: n.read_at ? 'transparent' : theme.surface,
            }}>
              <div style={{ fontSize: 20, width: 32, textAlign: 'center', flexShrink: 0 }}>
                {icons[n.type]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.text, fontSize: 14 }}>
                  <Link to={`/profile/${n.actor_username}`}
                    style={{ color: theme.text, fontWeight: 700, textDecoration: 'none' }}>
                    {n.actor_name}
                  </Link>{' '}
                  {labels[n.type]}
                </div>
                {n.post_preview && (
                  <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{n.post_preview}"
                  </div>
                )}
                <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                  {formatDistanceToNow(n.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
