import { CatProfile, Post, Story, NotificationItem } from '../types';
import { 
  INITIAL_PROFILES, INITIAL_POSTS, INITIAL_STORIES, INITIAL_NOTIFICATIONS,
  INITIAL_DOG_PROFILES, INITIAL_DOG_POSTS, INITIAL_DOG_STORIES, INITIAL_DOG_NOTIFICATIONS
} from '../data/mockData';

export function getStoredProfiles(species: 'cat' | 'dog' = 'cat'): CatProfile[] {
  if (typeof window === 'undefined') return species === 'dog' ? INITIAL_DOG_PROFILES : INITIAL_PROFILES;
  try {
    const key = `${species}_profiles_v1`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : (species === 'dog' ? INITIAL_DOG_PROFILES : INITIAL_PROFILES);
  } catch (e) {
    console.error(`Failed to load ${species} profiles:`, e);
    return species === 'dog' ? INITIAL_DOG_PROFILES : INITIAL_PROFILES;
  }
}

export function saveProfiles(profiles: CatProfile[], species: 'cat' | 'dog' = 'cat') {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${species}_profiles_v1`, JSON.stringify(profiles));
  } catch (e) {
    console.error(`Failed to save ${species} profiles:`, e);
  }
}

export function getStoredPosts(species: 'cat' | 'dog' = 'cat'): Post[] {
  if (typeof window === 'undefined') return species === 'dog' ? INITIAL_DOG_POSTS : INITIAL_POSTS;
  try {
    const key = `${species}_posts_v1`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : (species === 'dog' ? INITIAL_DOG_POSTS : INITIAL_POSTS);
  } catch (e) {
    console.error(`Failed to load ${species} posts:`, e);
    return species === 'dog' ? INITIAL_DOG_POSTS : INITIAL_POSTS;
  }
}

export function savePosts(posts: Post[], species: 'cat' | 'dog' = 'cat') {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${species}_posts_v1`, JSON.stringify(posts));
  } catch (e) {
    console.error(`Failed to save ${species} posts:`, e);
  }
}

export function getStoredStories(species: 'cat' | 'dog' = 'cat'): Story[] {
  if (typeof window === 'undefined') return species === 'dog' ? INITIAL_DOG_STORIES : INITIAL_STORIES;
  try {
    const key = `${species}_stories_v1`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : (species === 'dog' ? INITIAL_DOG_STORIES : INITIAL_STORIES);
  } catch (e) {
    console.error(`Failed to load ${species} stories:`, e);
    return species === 'dog' ? INITIAL_DOG_STORIES : INITIAL_STORIES;
  }
}

export function saveStories(stories: Story[], species: 'cat' | 'dog' = 'cat') {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${species}_stories_v1`, JSON.stringify(stories));
  } catch (e) {
    console.error(`Failed to save ${species} stories:`, e);
  }
}

export function getStoredNotifications(species: 'cat' | 'dog' = 'cat'): NotificationItem[] {
  if (typeof window === 'undefined') return species === 'dog' ? INITIAL_DOG_NOTIFICATIONS : INITIAL_NOTIFICATIONS;
  try {
    const key = `${species}_notifications_v1`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : (species === 'dog' ? INITIAL_DOG_NOTIFICATIONS : INITIAL_NOTIFICATIONS);
  } catch (e) {
    console.error(`Failed to load ${species} notifications:`, e);
    return species === 'dog' ? INITIAL_DOG_NOTIFICATIONS : INITIAL_NOTIFICATIONS;
  }
}

export function saveNotifications(notifications: NotificationItem[], species: 'cat' | 'dog' = 'cat') {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${species}_notifications_v1`, JSON.stringify(notifications));
  } catch (e) {
    console.error(`Failed to save ${species} notifications:`, e);
  }
}

export function getActiveProfileId(species: 'cat' | 'dog' = 'cat'): string {
  const defaultId = species === 'dog' ? 'dog_1' : 'cat_1';
  if (typeof window === 'undefined') return defaultId;
  try {
    return localStorage.getItem(`${species}_active_profile_id_v1`) || defaultId;
  } catch (e) {
    return defaultId;
  }
}

export function setActiveProfileId(id: string, species: 'cat' | 'dog' = 'cat') {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${species}_active_profile_id_v1`, id);
  } catch (e) {
    console.error(`Failed to set active ${species} profile:`, e);
  }
}

