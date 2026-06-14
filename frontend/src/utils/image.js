const BACKEND_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export function normalizeImageSrc(pic) {
  // Return null when there's no valid src so React omits the `src` attribute
  if (!pic) return null;
  if (typeof pic !== 'string') return null;
  const trimmed = pic.trim();
  if (!trimmed) return null;
  // already a data URL or an absolute/relative http URL
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
    return trimmed;
  }
  // Relative path from the backend (e.g. /upload/forum/img.jpg) – resolve to backend origin
  if (trimmed.startsWith('/')) {
    return `${BACKEND_BASE}${trimmed}`;
  }
  // otherwise assume it's a raw base64 string and prefix a PNG data URL
  return `data:image/png;base64,${trimmed}`;
}
