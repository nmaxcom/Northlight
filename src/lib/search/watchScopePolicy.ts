export function isWatchableScope(path: string, homePath: string) {
  const normalized = path.replace(/\/+$/, '') || '/';
  const normalizedHome = homePath.replace(/\/+$/, '') || '/';
  const libraryRoot = `${normalizedHome}/Library`;

  if (normalized === '/') {
    return false;
  }

  if (normalized === normalizedHome) {
    return false;
  }

  if (normalized === libraryRoot) {
    return false;
  }

  return true;
}
