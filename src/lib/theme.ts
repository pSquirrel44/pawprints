import { Species } from '../types/index';

export interface Theme {
  primary: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textMuted: string;
  gradient: string;
  gradientBtn: string;
  emoji: string;
  platformName: string;
  tagline: string;
}

export const themes: Record<Species, Theme> = {
  cat: {
    primary: '#9333ea',      // purple
    primaryDark: '#7e22ce',
    accent: '#ec4899',       // pink
    accentLight: '#fdf4ff',
    bg: '#0f0a1e',
    surface: '#1a1030',
    surfaceHover: '#221540',
    border: '#3b1f6e',
    text: '#f3e8ff',
    textMuted: '#a78bca',
    gradient: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
    gradientBtn: 'linear-gradient(135deg, #9333ea, #ec4899)',
    emoji: '🐱',
    platformName: 'The Catwalk',
    tagline: 'Where cats reign supreme',
  },
  dog: {
    primary: '#0d9488',      // teal
    primaryDark: '#0f766e',
    accent: '#f59e0b',       // amber
    accentLight: '#f0fdfa',
    bg: '#051a18',
    surface: '#0d2e2a',
    surfaceHover: '#163d38',
    border: '#14534e',
    text: '#ccfbf1',
    textMuted: '#5eead4',
    gradient: 'linear-gradient(135deg, #0d9488 0%, #f59e0b 100%)',
    gradientBtn: 'linear-gradient(135deg, #0d9488, #06b6d4)',
    emoji: '🐶',
    platformName: 'The Dog Park',
    tagline: 'Good dogs, great posts',
  },
};

export function getTheme(species: Species): Theme {
  return themes[species];
}

// Returns which platform we're on based on hostname
export function detectSpecies(): Species {
  if (typeof window === 'undefined') return 'cat';
  const host = window.location.hostname;
  if (host.includes('instawoof') || host.includes('dog')) return 'dog';
  return 'cat';
}
