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
const utf16LeDecoder = new TextDecoder('utf-16le');
const utf16BeDecoder = new TextDecoder('utf-16be');

type TextEncoding = 'utf8' | 'utf16le' | 'utf16be';

function stripBom(text: string) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function countZeroBytes(buffer: Buffer, parity: 0 | 1) {
  let count = 0;
  for (let index = parity; index < buffer.length; index += 2) {
    if (buffer[index] === 0) {
      count += 1;
    }
  }

  return count;
}

function detectUtf16Encoding(buffer: Buffer): TextEncoding | null {
  if (buffer.length < 2) {
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return 'utf16le';
  }

  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    return 'utf16be';
  }

  if (buffer.length < 8) {
    return null;
  }

  const evenZeros = countZeroBytes(buffer, 0);
  const oddZeros = countZeroBytes(buffer, 1);
  const pairCount = Math.floor(buffer.length / 2);
  const threshold = Math.max(3, Math.floor(pairCount * 0.4));

  if (oddZeros >= threshold && evenZeros <= Math.max(2, Math.floor(pairCount * 0.08))) {
    return 'utf16le';
  }

  if (evenZeros >= threshold && oddZeros <= Math.max(2, Math.floor(pairCount * 0.08))) {
    return 'utf16be';
  }

  return null;
}

function decodeWithEncoding(buffer: Buffer, encoding: TextEncoding) {
  switch (encoding) {
    case 'utf16le':
      return stripBom(utf16LeDecoder.decode(buffer));
    case 'utf16be':
      return stripBom(utf16BeDecoder.decode(buffer));
    case 'utf8':
    default:
      return stripBom(utf8Decoder.decode(buffer));
  }
}

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

function isDecodedTextLikelyPlain(decoded: string, extension = '') {
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

export function detectPlainTextEncoding(buffer: Buffer, extension = ''): TextEncoding | null {
  if (buffer.length === 0) {
    return 'utf8';
  }

  const utf16Encoding = detectUtf16Encoding(buffer);
  if (utf16Encoding) {
    const decoded = decodeWithEncoding(buffer, utf16Encoding);
    return isDecodedTextLikelyPlain(decoded, extension) ? utf16Encoding : null;
  }

  if (buffer.includes(0)) {
    return null;
  }

  const decoded = decodeWithEncoding(buffer, 'utf8');
  return isDecodedTextLikelyPlain(decoded, extension) ? 'utf8' : null;
}

export function isProbablyPlainText(buffer: Buffer, extension = '') {
  return detectPlainTextEncoding(buffer, extension) !== null;
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
  const encoding = detectPlainTextEncoding(sample, extension);
  if (!encoding) {
    return null;
  }

  return {
    body: decodeWithEncoding(sample, encoding),
    bodyMode: codePreviewExtensions.has(extension) ? ('code' as const) : ('plain' as const)
  };
}
