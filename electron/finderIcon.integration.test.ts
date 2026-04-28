import { mkdtemp, readdir } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveFinderIconDataUrl } from './finderIcon';

describe('resolveFinderIconDataUrl integration', () => {
  it('returns distinct real macOS app icons for Calendar and Calculator', async () => {
    if (process.platform !== 'darwin') {
      return;
    }

    const userDataPath = await mkdtemp(join(tmpdir(), 'northlight-finder-icon-it-'));
    const calendarIcon = await resolveFinderIconDataUrl(userDataPath, '/System/Applications/Calendar.app', 256);
    const calculatorIcon = await resolveFinderIconDataUrl(userDataPath, '/System/Applications/Calculator.app', 256);

    expect(calendarIcon?.startsWith('data:image/png;base64,')).toBe(true);
    expect(calculatorIcon?.startsWith('data:image/png;base64,')).toBe(true);
    expect(calendarIcon).not.toBe(calculatorIcon);
  }, 120_000);

  it('returns a real file icon for mkv files when they exist locally', async () => {
    if (process.platform !== 'darwin') {
      return;
    }

    const downloadsPath = join(homedir(), 'Downloads');
    const entries = await readdir(downloadsPath).catch(() => []);
    const mkvName = entries.find((entry) => entry.toLowerCase().endsWith('.mkv'));

    if (!mkvName) {
      return;
    }

    const userDataPath = await mkdtemp(join(tmpdir(), 'northlight-finder-icon-it-'));
    const icon = await resolveFinderIconDataUrl(userDataPath, join(downloadsPath, mkvName), 128);

    expect(icon?.startsWith('data:image/png;base64,')).toBe(true);
  }, 120_000);
});

