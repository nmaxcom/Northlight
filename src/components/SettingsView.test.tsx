import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it, vi } from 'vitest';
import { SettingsViewV3 } from './SettingsViewV3';
import { theme } from '../theme';
import { launcherRuntime } from '../lib/search/runtime';
import { DEFAULT_LAUNCHER_SHORTCUT } from '../lib/shortcuts';

describe('SettingsViewV3', () => {
  it('renders the effective launcher shortcut with Apple-style keycaps', async () => {
    window.launcher = {
      getSettings: vi.fn().mockResolvedValue({
        ...launcherRuntime.getSettingsSnapshot(),
        launcherHotkey: ''
      }),
      getSearchPerformance: vi.fn().mockResolvedValue({
        samples: [],
        summary: launcherRuntime.getSearchPerformanceSnapshot().summary
      }),
      getScopeInsights: vi.fn().mockResolvedValue([]),
      getEffectiveShortcut: vi.fn().mockResolvedValue(DEFAULT_LAUNCHER_SHORTCUT),
      saveSettings: vi.fn().mockImplementation(async (settings) => settings),
      onSettingsChanged: vi.fn().mockReturnValue(() => {})
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <SettingsViewV3 />
      </MantineProvider>
    );

    await screen.findByText('Settings');
    expect(screen.getByRole('button', { name: 'Launcher shortcut' })).toBeInTheDocument();
    expect(screen.getByText('⌘')).toBeInTheDocument();
    expect(screen.getByText('⇧')).toBeInTheDocument();
    expect(screen.getByText('␣')).toBeInTheDocument();
    expect(screen.getByText(/dev-session fallback shortcut/i)).toBeInTheDocument();
  });

  it('renders settings tabs outside the scrollable content region and marks the active tab', async () => {
    window.launcher = {
      getSettings: vi.fn().mockResolvedValue(launcherRuntime.getSettingsSnapshot()),
      getSearchPerformance: vi.fn().mockResolvedValue({
        samples: [],
        summary: launcherRuntime.getSearchPerformanceSnapshot().summary
      }),
      getScopeInsights: vi.fn().mockResolvedValue([]),
      getEffectiveShortcut: vi.fn().mockResolvedValue(DEFAULT_LAUNCHER_SHORTCUT),
      saveSettings: vi.fn().mockImplementation(async (settings) => settings),
      onSettingsChanged: vi.fn().mockReturnValue(() => {})
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <SettingsViewV3 />
      </MantineProvider>
    );

    await screen.findByText('Settings');

    const tabs = screen.getByRole('tablist', { name: /settings sections/i });
    const panel = screen.getByRole('tabpanel');
    const activeTab = screen.getByRole('tab', { name: 'Overview' });

    expect(tabs).toBeInTheDocument();
    expect(panel).toBeInTheDocument();
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(panel).not.toContainElement(tabs);
  });

  it('shows scope guidance and adds the library preset without duplicating it', async () => {
    window.launcher = {
      getSettings: vi.fn().mockResolvedValue({
        ...launcherRuntime.getSettingsSnapshot(),
        scopes: [
          { id: 'scope-0', path: '/Applications', enabled: true, hot: true },
          { id: 'scope-1', path: '/Users/nm4/Documents', enabled: true, hot: true }
        ]
      }),
      getSearchPerformance: vi.fn().mockResolvedValue({
        samples: [],
        summary: launcherRuntime.getSearchPerformanceSnapshot().summary
      }),
      getScopeInsights: vi.fn().mockResolvedValue([
        {
          id: 'scope-0',
          path: '/Applications',
          enabled: true,
          hot: true,
          estimatedItems: 120,
          cost: 'low',
          recommendation: 'Good for Fast Path.'
        }
      ]),
      getEffectiveShortcut: vi.fn().mockResolvedValue(DEFAULT_LAUNCHER_SHORTCUT),
      saveSettings: vi.fn().mockImplementation(async (settings) => settings),
      onSettingsChanged: vi.fn().mockReturnValue(() => {})
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <SettingsViewV3 />
      </MantineProvider>
    );

    await screen.findByText('Settings');
    fireEvent.click(screen.getByRole('tab', { name: 'Scopes & Status' }));

    expect(screen.getByRole('button', { name: /library/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entire disk/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /library/i }));
    expect((screen.getAllByLabelText('Path').at(-1) as HTMLInputElement).value).toBe('/Users/nm4/Library');

    fireEvent.click(screen.getByRole('button', { name: /library/i }));
    expect(screen.getAllByDisplayValue('/Users/nm4/Library')).toHaveLength(1);
  });

  it('opens a custom scope composer instead of creating an empty scope immediately', async () => {
    window.launcher = {
      getSettings: vi.fn().mockResolvedValue({
        ...launcherRuntime.getSettingsSnapshot(),
        scopes: [{ id: 'scope-0', path: '/Applications', enabled: true, hot: true }]
      }),
      getSearchPerformance: vi.fn().mockResolvedValue({
        samples: [],
        summary: launcherRuntime.getSearchPerformanceSnapshot().summary
      }),
      getScopeInsights: vi.fn().mockResolvedValue([]),
      getEffectiveShortcut: vi.fn().mockResolvedValue(DEFAULT_LAUNCHER_SHORTCUT),
      saveSettings: vi.fn().mockImplementation(async (settings) => settings),
      onSettingsChanged: vi.fn().mockReturnValue(() => {})
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <SettingsViewV3 />
      </MantineProvider>
    );

    await screen.findByText('Settings');
    fireEvent.click(screen.getByRole('tab', { name: 'Scopes & Status' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add scope' }));

    expect(screen.getByText('Custom path')).toBeInTheDocument();
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
      getSearchPerformance: vi.fn().mockResolvedValue({
        samples: [],
        summary: launcherRuntime.getSearchPerformanceSnapshot().summary
      }),
      getScopeInsights: vi.fn().mockResolvedValue([]),
      getEffectiveShortcut: vi.fn().mockResolvedValue(DEFAULT_LAUNCHER_SHORTCUT),
      saveSettings,
      onSettingsChanged: vi.fn().mockReturnValue(() => {})
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <SettingsViewV3 />
      </MantineProvider>
    );

    await screen.findByText('Settings');
    fireEvent.click(screen.getByRole('tab', { name: 'Scopes & Status' }));

    const toggle = await screen.findByRole('checkbox', { name: /watch filesystem for changes/i });
    expect(toggle).toBeChecked();

    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalled();
    });

    expect(saveSettings.mock.calls.at(-1)?.[0].watchFsChangesEnabled).toBe(false);
  });

  it('lets the user promote a custom scope into the fast path tier and persists it', async () => {
    const saveSettings = vi.fn().mockImplementation(async (settings) => settings);

    window.launcher = {
      getSettings: vi.fn().mockResolvedValue({
        ...launcherRuntime.getSettingsSnapshot(),
        scopes: [{ id: 'scope-0', path: '/Users/nm4/Work', enabled: true, hot: false }]
      }),
      getSearchPerformance: vi.fn().mockResolvedValue({
        samples: [],
        summary: launcherRuntime.getSearchPerformanceSnapshot().summary
      }),
      getScopeInsights: vi.fn().mockResolvedValue([
        {
          id: 'scope-0',
          path: '/Users/nm4/Work',
          enabled: true,
          hot: false,
          estimatedItems: 9400,
          cost: 'medium',
          recommendation: 'Good candidate for deep search unless you need very fast recall.'
        }
      ]),
      getEffectiveShortcut: vi.fn().mockResolvedValue(DEFAULT_LAUNCHER_SHORTCUT),
      saveSettings,
      onSettingsChanged: vi.fn().mockReturnValue(() => {})
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <SettingsViewV3 />
      </MantineProvider>
    );

    await screen.findByText('Settings');
    fireEvent.click(screen.getByRole('tab', { name: 'Scopes & Status' }));

    const toggle = await screen.findByRole('checkbox', { name: /fast path/i });
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalled();
    });

    expect(saveSettings.mock.calls.at(-1)?.[0].scopes[0]).toEqual(
      expect.objectContaining({
        path: '/Users/nm4/Work',
        hot: true
      })
    );
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
      getSearchPerformance: vi.fn().mockResolvedValue({
        samples: [],
        summary: launcherRuntime.getSearchPerformanceSnapshot().summary
      }),
      getScopeInsights: vi.fn().mockResolvedValue([]),
      getEffectiveShortcut: vi.fn().mockResolvedValue(DEFAULT_LAUNCHER_SHORTCUT),
      saveSettings,
      onSettingsChanged: vi.fn().mockReturnValue(() => {})
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <SettingsViewV3 />
      </MantineProvider>
    );

    await screen.findByText('Settings');

    fireEvent.click(screen.getByRole('checkbox', { name: /prefer apps/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();

    resolveSave?.({
      ...launcherRuntime.getSettingsSnapshot(),
      appFirstEnabled: false
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Settings' })).toBeDisabled();
    });
  });

  it('renders scope cost guidance and recent search performance summaries', async () => {
    window.launcher = {
      getSettings: vi.fn().mockResolvedValue({
        ...launcherRuntime.getSettingsSnapshot(),
        scopes: [{ id: 'scope-0', path: '/Users/nm4', enabled: true, hot: false }]
      }),
      getSearchPerformance: vi.fn().mockResolvedValue({
        samples: [],
        summary: {
          sampleCount: 12,
          hotAverageMs: 24,
          hotP95Ms: 41,
          deepAverageMs: 138,
          deepP95Ms: 260,
          firstVisibleAverageMs: 12,
          firstUsefulAverageMs: 19,
          topReplacementRate: 0.08,
          clipboardFirstFlashRate: 0.02,
          lastRecordedAt: Date.now()
        }
      }),
      getScopeInsights: vi.fn().mockResolvedValue([
        {
          id: 'scope-0',
          path: '/Users/nm4',
          enabled: true,
          hot: false,
          estimatedItems: 31500,
          cost: 'high',
          recommendation: 'Better kept as deep search.'
        }
      ]),
      getEffectiveShortcut: vi.fn().mockResolvedValue(DEFAULT_LAUNCHER_SHORTCUT),
      saveSettings: vi.fn().mockImplementation(async (settings) => settings),
      onSettingsChanged: vi.fn().mockReturnValue(() => {})
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <SettingsViewV3 />
      </MantineProvider>
    );

    await screen.findByText('Settings');
    fireEvent.click(screen.getByRole('tab', { name: 'Scopes & Status' }));

    expect(screen.getByText('Latency (local samples)')).toBeInTheDocument();
    expect(screen.getByText('Hot Avg')).toBeInTheDocument();
    expect(screen.getByText('24 ms')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText(/31,500 items/i)).toBeInTheDocument();
    expect(screen.getByText('Better kept as deep search.')).toBeInTheDocument();
  });
});
