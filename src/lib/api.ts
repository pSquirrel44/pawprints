const BASE = import.meta.env?.VITE_API_URL || '';

type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider | null = null;

// Clerk session tokens are intentionally short-lived. AppProvider registers
// getToken here so every protected request receives a current token instead of
// reusing the snapshot captured when the user first signed in.
export function setApiTokenProvider(provider: TokenProvider | null) {
  tokenProvider = provider;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const currentToken = tokenProvider ? await tokenProvider() : token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Users
  syncUser: (data: object, token: string) =>
    request('/api/users/sync', { method: 'POST', body: JSON.stringify(data) }, token),
  getMe: (token: string) => request('/api/users/me', {}, token),
  getUser: (username: string, token?: string) =>
    request(`/api/users/${username}`, {}, token),
  updateMe: (data: object, token: string) =>
    request('/api/users/me', { method: 'PUT', body: JSON.stringify(data) }, token),
  getUserPosts: (username: string, token?: string) =>
    request(`/api/users/${username}/posts`, {}, token),
  searchUsers: (q: string, token?: string) =>
    request(`/api/users/search/query?q=${encodeURIComponent(q)}`, {}, token),

  // Posts
  getFeed: (token: string, cursor?: string) =>
    request(`/api/posts/feed${cursor ? `?cursor=${cursor}` : ''}`, {}, token),
  getExplore: (species: string, offset = 0, token?: string) =>
    request(`/api/posts/explore/${species}?offset=${offset}`, {}, token),
  getPost: (id: number, token?: string) => request(`/api/posts/${id}`, {}, token),
  createPost: (data: object, token: string) =>
    request('/api/posts', { method: 'POST', body: JSON.stringify(data) }, token),
  deletePost: (id: number, token: string) =>
    request(`/api/posts/${id}`, { method: 'DELETE' }, token),
  likePost: (id: number, token: string) =>
    request(`/api/posts/${id}/like`, { method: 'POST' }, token),
  unlikePost: (id: number, token: string) =>
    request(`/api/posts/${id}/like`, { method: 'DELETE' }, token),
  getComments: (postId: number, token?: string) =>
    request(`/api/posts/${postId}/comments`, {}, token),
  addComment: (postId: number, content: string, token: string) =>
    request(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }, token),

  // Follows
  follow: (username: string, token: string) =>
    request(`/api/follows/${username}`, { method: 'POST' }, token),
  unfollow: (username: string, token: string) =>
    request(`/api/follows/${username}`, { method: 'DELETE' }, token),
  getFollowers: (username: string) =>
    request(`/api/follows/${username}/followers`),
  getFollowing: (username: string) =>
    request(`/api/follows/${username}/following`),
  getSuggestions: (token: string) =>
    request('/api/follows/suggestions/list', {}, token),

  // Messages
  getConversations: (token: string) =>
    request('/api/messages/conversations', {}, token),
  getMessages: (username: string, token: string) =>
    request(`/api/messages/${username}`, {}, token),
  sendMessage: (username: string, content: string, token: string) =>
    request(`/api/messages/${username}`, { method: 'POST', body: JSON.stringify({ content }) }, token),

  // Notifications
  getNotifications: (token: string) =>
    request('/api/notifications', {}, token),
  getUnreadCount: (token: string) =>
    request('/api/notifications/unread-count', {}, token),
  markAllRead: (token: string) =>
    request('/api/notifications/read-all', { method: 'POST' }, token),
};
