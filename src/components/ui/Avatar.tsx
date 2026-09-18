import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = { sm: 32, md: 40, lg: 56, xl: 96 };

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const px = sizes[size];
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: px, height: px, background: 'linear-gradient(135deg,#9333ea,#ec4899)' }}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: px, height: px, objectFit: 'cover' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <div style={{ width: px, height: px, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: px * 0.36, color: '#fff', fontWeight: 700 }}>{initials}</span>
        </div>
      )}
    </div>
  );
}
