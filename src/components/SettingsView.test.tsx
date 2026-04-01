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

  it('shows scope guidance and adds the library preset without duplicating it', async () => {
    window.launcher = {
      getSettings: vi.fn().mockResolvedValue({
        ...launcherRuntime.getSettingsSnapshot(),
        scopes: [
          { id: 'scope-0', path: '/Applications', enabled: true },
          { id: 'scope-1', path: '/Users/nm4/Documents', enabled: true }
        ]
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
    fireEvent.click(screen.getByRole('button', { name: 'Scopes & Status' }));

    expect(screen.getByText(/choose which roots northlight hydrates and prefers/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add ~\/library/i })).toBeInTheDocument();
    expect(screen.getByText(/widest coverage, but the slowest and noisiest option/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add ~\/library/i }));
    expect((screen.getAllByLabelText('Path').at(-1) as HTMLInputElement).value).toBe('/Users/nm4/Library');

    fireEvent.click(screen.getByRole('button', { name: /add ~\/library/i }));
    expect(screen.getAllByDisplayValue('/Users/nm4/Library')).toHaveLength(1);
  });

  it('opens a custom scope composer instead of creating an empty scope immediately', async () => {
    window.launcher = {
      getSettings: vi.fn().mockResolvedValue({
        ...launcherRuntime.getSettingsSnapshot(),
        scopes: [{ id: 'scope-0', path: '/Applications', enabled: true }]
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
    fireEvent.click(screen.getByRole('button', { name: 'Scopes & Status' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add Scope' }));

    expect(screen.getByText('Add Custom Scope')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Path')).toHaveLength(1);
    expect(screen.queryByText('Scopes cannot be empty.')).not.toBeInTheDocument();
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

  it('shows visible saving feedback while settings are being persisted', async () => {
    let resolveSave: ((settings: ReturnType<typeof launcherRuntime.getSettingsSnapshot>) => void) | undefined;
    const saveSettings = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );

    window.launcher = {
      getSettings: vi.fn().mockResolvedValue(launcherRuntime.getSettingsSnapshot()),
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

    fireEvent.click(screen.getByRole('checkbox', { name: /best match section/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();

    resolveSave?.({
      ...launcherRuntime.getSettingsSnapshot(),
      bestMatchEnabled: false
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Settings' })).toBeDisabled();
    });
  });
});
