export function formatDistanceToNow(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Read a username from the URL, e.g. "/messages/ricky" -> "ricky".
 * Pages like Messages and Profile are shown as tabs (not <Route>s), so
 * React Router's useParams() is always empty for them. Use this instead.
 */
export function getPathUsername(pathname: string, section: string): string | undefined {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== section || !parts[1]) return undefined;
  try {
    return decodeURIComponent(parts[1]);
  } catch {
    return parts[1];
  }
}
