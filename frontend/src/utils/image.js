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
  // otherwise assume it's a raw base64 string and prefix a PNG data URL
  return `data:image/png;base64,${trimmed}`;
}
