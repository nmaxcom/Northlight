const designs = [
  '/design/',
  '/design/launcher-current-view.html',
  '/design/launcher-folder-preview.html',
  '/design/launcher-app-preview.html',
  '/design/launcher-folder-listing-preview.html',
  '/design/launcher-file-preview.html',
  '/design/settings-current-view.html'
];

export function logAvailableDesigns(currentPath: string) {
  const origin = window.location.origin;
  console.log('[design] available mockups:');
  for (const path of designs) {
    const marker = path === currentPath ? '->' : '  ';
    console.log(`${marker} ${origin}${path}`);
  }
}
