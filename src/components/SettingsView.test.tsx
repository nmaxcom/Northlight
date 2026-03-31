import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it, vi } from 'vitest';
import { SettingsView } from './SettingsView';
import { theme } from '../theme';
import { launcherRuntime } from '../lib/search/runtime';
import { DEFAULT_LAUNCHER_SHORTCUT } from '../lib/shortcuts';

describe('SettingsView', () => {
  it('renders the effective launcher shortcut with Apple-style keycaps', async () => {
    window.launcher = {
      getSettings: vi.fn().mockResolvedValue({
        ...launcherRuntime.getSettingsSnapshot(),
        launcherHotkey: ''
      }),
      getEffectiveShortcut: vi.fn().mockResolvedValue(DEFAULT_LAUNCHER_SHORTCUT),
      saveSettings: vi.fn().mockImplementation(async (settings) => settings),
      onSettingsChanged: vi.fn().mockReturnValue(() => {})
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <SettingsView />
      </MantineProvider>
    );

    await screen.findByText('Northlight Settings');
    expect(screen.getByRole('button', { name: 'Launcher shortcut' })).toBeInTheDocument();
    expect(screen.getByText('⌘')).toBeInTheDocument();
    expect(screen.getByText('⇧')).toBeInTheDocument();
    expect(screen.getByText('␣')).toBeInTheDocument();
    expect(screen.getByText(/dev-session fallback shortcut/i)).toBeInTheDocument();
  });

  it('renders the filesystem watcher toggle and saves it', async () => {
    const saveSettings = vi.fn().mockImplementation(async (settings) => settings);

    window.launcher = {
      getSettings: vi.fn().mockResolvedValue({
        ...launcherRuntime.getSettingsSnapshot(),
        watchFsChangesEnabled: true
      }),
      getEffectiveShortcut: vi.fn().mockResolvedValue(DEFAULT_LAUNCHER_SHORTCUT),
      saveSettings,
      onSettingsChanged: vi.fn().mockReturnValue(() => {})
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <SettingsView />
      </MantineProvider>
    );

    await screen.findByText('Northlight Settings');
    fireEvent.click(screen.getByRole('button', { name: 'Scopes & Status' }));

    const toggle = await screen.findByRole('checkbox', { name: /watch filesystem changes/i });
    expect(toggle).toBeChecked();

    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalled();
    });

    expect(saveSettings.mock.calls.at(-1)?.[0].watchFsChangesEnabled).toBe(false);
  });
});
