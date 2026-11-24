/**
 * SKYLINE SMART RESIDENCE - USER AVATAR HELPER
 * Ensures all avatar displays across Sidebar, Topbar Dropdown, Profile, and Modals
 * strictly resolve clean, high-taste avatar URLs.
 */

export function formatApiAvatarUrl(rawAvatar?: string | null, name: string = 'Skyline'): string {
  if (!rawAvatar || typeof rawAvatar !== 'string') {
    const initials = encodeURIComponent((name || 'Skyline').slice(0, 2).toUpperCase());
    return `https://ui-avatars.com/api/?name=${initials}&background=1C2533&color=C5A880&bold=true`;
  }

  const trimmed = rawAvatar.trim();
  if (!trimmed) {
    const initials = encodeURIComponent((name || 'Skyline').slice(0, 2).toUpperCase());
    return `https://ui-avatars.com/api/?name=${initials}&background=1C2533&color=C5A880&bold=true`;
  }

  // Base64 data image from FaceID scan or upload
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return trimmed;
}

const avatarMemoryCache = new Map<string, string>();

export function setUserApiAvatarCache(userKey: string, url: string): void {
  if (userKey && url) avatarMemoryCache.set(userKey, url);
}

/**
 * Get user avatar prioritizing live API fields and memory overrides
 */
export function getUserApiAvatar(user?: any): string {
  if (!user) {
    return formatApiAvatarUrl(null, 'Skyline');
  }

  const userKey = user.phone || user.email || user.username || user.id || '';

  if (userKey && avatarMemoryCache.has(userKey)) {
    return formatApiAvatarUrl(avatarMemoryCache.get(userKey)!, user.full_name || user.fullname);
  }

  const candidate = user.avatar_url || user.avatar || user.avatarUrl;
  return formatApiAvatarUrl(candidate, user.full_name || user.fullname || user.name || 'Skyline');
}
