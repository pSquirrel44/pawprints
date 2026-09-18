import React from 'react';
import { useApp } from '../../lib/AppContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children, variant = 'primary', size = 'md', loading, disabled, style, ...props
}: ButtonProps) {
  const { theme } = useApp();

  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, fontWeight: 600, borderRadius: 10, border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.15s, transform 0.1s', opacity: disabled || loading ? 0.6 : 1,
    fontFamily: 'inherit',
  };

  const sizes = {
    sm: { padding: '6px 14px', fontSize: 13 },
    md: { padding: '10px 20px', fontSize: 15 },
    lg: { padding: '14px 28px', fontSize: 17 },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: theme.gradientBtn, color: '#fff' },
    secondary: { background: theme.surface, color: theme.text, border: `1px solid ${theme.border}` },
    ghost: { background: 'transparent', color: theme.textMuted },
    danger: { background: '#ef4444', color: '#fff' },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled && !loading) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = disabled || loading ? '0.6' : '1'; }}
    >
      {loading ? <span className="spin">⟳</span> : children}
    </button>
  );
}
