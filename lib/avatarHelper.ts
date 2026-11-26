/**
 * SKYLINE SMART RESIDENCE - USER AVATAR HELPER
 * Ensures all avatar displays across Sidebar, Topbar Dropdown, Profile, and Modals
 * strictly resolve clean, high-taste avatar URLs without external stock photo dependencies.
 */

export function getInitialsAvatar(name?: string): string {
  const clean = (name || 'SK').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : clean.slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#141B24"/><rect x="2" y="2" width="124" height="124" fill="none" stroke="#C5A880" stroke-width="3"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#C5A880" font-family="sans-serif" font-size="44" font-weight="700">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function formatApiAvatarUrl(rawAvatar?: string | null, name: string = 'Skyline'): string {
  if (!rawAvatar || typeof rawAvatar !== 'string') {
    return getInitialsAvatar(name);
  }

  const trimmed = rawAvatar.trim();
  if (!trimmed) {
    return getInitialsAvatar(name);
  }

  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
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
