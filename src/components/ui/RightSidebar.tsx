import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types/index';
import { useApp } from '../../lib/AppContext';
import { api } from '../../lib/api';
import { UserCard } from '../social/UserCard';

export function RightSidebar() {
  const { theme, token } = useApp();
  const [suggestions, setSuggestions] = useState<User[]>([]);

  useEffect(() => {
    if (!token) return;
    api.getSuggestions(token).then(data => setSuggestions((data as User[]).slice(0, 5))).catch(() => {});
  }, [token]);

  return (
    <aside style={{
      width: 320, flexShrink: 0, padding: '20px 0 20px 24px',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    }}>
      {suggestions.length > 0 && (
        <div style={{
          background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: 16, overflow: 'hidden', marginBottom: 16,
        }}>
          <div style={{ padding: '14px 16px', fontWeight: 700, color: theme.text, fontSize: 15 }}>
            Who to follow
          </div>
          {suggestions.map(u => (
            <UserCard key={u.id} user={u} compact />
          ))}
        </div>
      )}

      <div style={{
        fontSize: 12, color: theme.textMuted, padding: '0 4px', lineHeight: 2,
      }}>
        <Link to="/terms" style={{ color: theme.textMuted, marginRight: 12, textDecoration: 'none' }}>Terms</Link>
        <Link to="/privacy" style={{ color: theme.textMuted, marginRight: 12, textDecoration: 'none' }}>Privacy</Link>
        <br />
        © 2026 Pawprint Network LLC
      </div>
    </aside>
  );
}
