import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignOutButton, useAuth } from '@clerk/clerk-react';
import { useApp } from '../../lib/AppContext';

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/explore', label: 'Explore', icon: '🔍' },
  { path: '/messages', label: 'Messages', icon: '✉️' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

export function Sidebar() {
  const { theme, currentUser, unreadCount } = useApp();
  const { isSignedIn } = useAuth();
  const location = useLocation();

  return (
    <nav style={{
      width: 240, flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      display: 'flex', flexDirection: 'column', padding: '20px 0',
      borderRight: `1px solid ${theme.border}`, background: theme.bg,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 22, fontWeight: 800, background: theme.gradient,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {theme.emoji} {theme.platformName}
          </div>
        </Link>
      </div>

      {/* Nav links */}
      {navItems.map(item => {
        const isActive = location.pathname === item.path ||
          (item.path === '/profile' && location.pathname.startsWith('/profile'));
        const showBadge = item.path === '/notifications' && unreadCount > 0;
        return (
          <Link key={item.path} to={item.path === '/profile' && currentUser
            ? `/profile/${currentUser.username}` : item.path}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px', textDecoration: 'none', fontSize: 15,
              color: isActive ? theme.text : theme.textMuted,
              fontWeight: isActive ? 700 : 400,
              background: isActive ? theme.surface : 'transparent',
              borderRadius: 10, margin: '2px 10px',
              transition: 'background 0.15s',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
            {showBadge && (
              <span style={{
                marginLeft: 'auto', background: theme.accent, color: '#fff',
                borderRadius: 10, padding: '1px 7px', fontSize: 12, fontWeight: 700,
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* User info + sign out */}
      {isSignedIn && currentUser && (
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <img src={currentUser.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${currentUser.username}`}
              alt={currentUser.display_name}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: theme.text, fontWeight: 600, fontSize: 13,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.display_name}
              </div>
              <div style={{ color: theme.textMuted, fontSize: 12 }}>@{currentUser.username}</div>
            </div>
          </div>
          <SignOutButton>
            <button style={{
              width: '100%', padding: '8px', background: theme.surface,
              border: `1px solid ${theme.border}`, borderRadius: 8,
              color: theme.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
            }}>
              Sign out
            </button>
          </SignOutButton>
        </div>
      )}
    </nav>
  );
}
