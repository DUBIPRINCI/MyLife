export function mediaUrl(path) {
  if (!path || !path.startsWith('/uploads/')) return path;
  const token = localStorage.getItem('token');
  return `${path}?token=${encodeURIComponent(token)}`;
}
