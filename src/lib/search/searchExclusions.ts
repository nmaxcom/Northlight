export function isPathInsideRoot(path: string, root: string) {
  return path === root || path.startsWith(`${root}/`);
}

export function isPrivateNorthlightPath(path: string, userDataRoot: string) {
  return isPathInsideRoot(path, userDataRoot);
}
