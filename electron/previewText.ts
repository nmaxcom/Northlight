import { open } from 'node:fs/promises';

export const textPreviewExtensions = new Set([
  '.txt', '.md', '.markdown', '.mdx', '.json', '.jsonc', '.yaml', '.yml', '.toml', '.ini', '.conf', '.env',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.css', '.scss', '.sass', '.less', '.html', '.htm', '.xml',
  '.svg', '.sh', '.zsh', '.bash', '.py', '.rb', '.php', '.java', '.kt', '.swift', '.go', '.rs', '.c', '.cc',
  '.cpp', '.h', '.hpp', '.sql', '.graphql', '.gql', '.csv', '.log', '.plist'
]);

export const codePreviewExtensions = new Set([
  '.json', '.jsonc', '.yaml', '.yml', '.toml', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.css', '.scss',
  '.sass', '.less', '.html', '.htm', '.xml', '.sql', '.sh', '.zsh', '.bash', '.py', '.swift', '.go', '.rs',
  '.c', '.cc', '.cpp', '.h', '.hpp', '.java', '.kt', '.php', '.graphql', '.gql'
]);

const TEXT_PREVIEW_BYTE_LIMIT = 12_000;
const replacementCharacter = '\uFFFD';
const utf8Decoder = new TextDecoder('utf-8');

function countSuspiciousControls(text: string) {
  let count = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      count += 1;
    }
  }

  return count;
}

export function isProbablyPlainText(buffer: Buffer, extension = '') {
  if (buffer.length === 0) {
    return true;
  }

  if (buffer.includes(0)) {
    return false;
  }

  const decoded = utf8Decoder.decode(buffer);
  const replacementCount = decoded.split(replacementCharacter).length - 1;
  const suspiciousControls = countSuspiciousControls(decoded);
  const knownTextExtension = textPreviewExtensions.has(extension);

  if (knownTextExtension) {
    return replacementCount <= Math.max(3, Math.floor(decoded.length * 0.02));
  }

  return (
    replacementCount <= Math.max(1, Math.floor(decoded.length * 0.01)) &&
    suspiciousControls <= Math.max(2, Math.floor(decoded.length * 0.02))
  );
}

async function readLeadingBytes(path: string, byteLimit = TEXT_PREVIEW_BYTE_LIMIT) {
  const handle = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(byteLimit);
    const { bytesRead } = await handle.read(buffer, 0, byteLimit, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

export async function readFileTextPreview(path: string, extension: string) {
  const sample = await readLeadingBytes(path);
  if (!isProbablyPlainText(sample, extension)) {
    return null;
  }

  return {
    body: utf8Decoder.decode(sample),
    bodyMode: codePreviewExtensions.has(extension) ? ('code' as const) : ('plain' as const)
  };
}
