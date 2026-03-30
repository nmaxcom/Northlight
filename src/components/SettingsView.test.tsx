import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it, vi } from 'vitest';
import { SettingsView } from './SettingsView';
import { theme } from '../theme';
import { launcherRuntime } from '../lib/search/runtime';

describe('SettingsView', () => {
  it('renders the filesystem watcher toggle and saves it', async () => {
    const saveSettings = vi.fn().mockImplementation(async (settings) => settings);

    window.launcher = {
      getSettings: vi.fn().mockResolvedValue({
        ...launcherRuntime.getSettingsSnapshot(),
        watchFsChangesEnabled: true
      }),
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
