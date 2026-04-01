import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { within } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LauncherBar } from './LauncherBar';
import { launcherRuntime } from '../lib/search/runtime';
import { theme } from '../theme';

describe('LauncherBar', () => {
  beforeEach(() => {
    window.launcher = undefined;
    launcherRuntime.clearRankStore();
  });

  it('renders the launcher prompt', async () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    expect(screen.getByLabelText('Launcher query')).toBeInTheDocument();
    expect(screen.getByText('Start from recent context')).toBeInTheDocument();
    await screen.findByText('10 indexed');
    expect(screen.getByText('v0.8.0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actions/i })).toBeDisabled();
  });

  it('shows fixture results and updates the bottom bar for the selected row', async () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    fireEvent.change(input, { target: { value: 'product' } });

    await waitFor(() => {
      expect(screen.getAllByText('product-brief.md').length).toBeGreaterThan(0);
    });

    const scrollContainer = document.querySelector('[data-results-scroll="true"]') as HTMLDivElement | null;
    expect(scrollContainer).toBeTruthy();
    expect(scrollContainer?.getAttribute('tabindex')).toBeNull();
    expect(screen.getAllByText('Open File').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /actions cmd k/i })).toBeEnabled();
  });

  it('shows a conversion result immediately for deterministic input', async () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    await act(async () => {
      fireEvent.change(input, { target: { value: '30mph to kmh' } });
      await Promise.resolve();
    });

    expect(screen.getAllByText('30 m/h = 48.28 km/h').length).toBeGreaterThan(0);
  });

  it('shows implicit unit suggestions when the query already looks like a unit amount', async () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    await act(async () => {
      fireEvent.change(input, { target: { value: '30cm' } });
      await Promise.resolve();
    });

    expect(screen.getAllByText('30 cm = 11.81 in').length).toBeGreaterThan(0);
    expect(screen.getByText('30 cm = 0.98 ft')).toBeInTheDocument();
  });

  it('renders media inside the preview pane when the preview provides it', async () => {
    const getPathPreview = vi.fn().mockResolvedValue({
      title: 'product-brief.md',
      subtitle: '/Users/test/product-brief.md',
      mediaUrl: 'data:image/png;base64,abc',
      mediaAlt: 'product-brief.md',
      sections: [{ label: 'Type', value: 'PNG' }]
    });

    window.launcher = {
      ready: vi.fn().mockResolvedValue(undefined),
      getPathPreview,
      getStatus: vi.fn().mockResolvedValue({
        appVersion: '0.8.0',
        indexEntryCount: 10,
        indexReady: true,
        isRestoring: false,
        isRefreshing: false
      }),
      getSettings: vi.fn().mockResolvedValue(launcherRuntime.getSettingsSnapshot()),
      getClipboardHistory: vi.fn().mockResolvedValue([]),
      openPath: vi.fn().mockResolvedValue(undefined),
      revealPath: vi.fn().mockResolvedValue(undefined),
      openInTerminal: vi.fn().mockResolvedValue(undefined),
      openWithTextEdit: vi.fn().mockResolvedValue(undefined),
      trashPath: vi.fn().mockResolvedValue(undefined),
      hide: vi.fn().mockResolvedValue(undefined)
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    fireEvent.change(input, { target: { value: 'product' } });

    await waitFor(() => {
      expect(screen.getAllByText('product-brief.md').length).toBeGreaterThan(0);
    });

    const image = await screen.findByAltText('product-brief.md');
    expect(image).toHaveAttribute('src', 'data:image/png;base64,abc');
  });

  it('wraps result selection with arrow keys', async () => {
    const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    fireEvent.change(input, { target: { value: 's' } });
    fireEvent.change(input, { target: { value: 'st' } });

    await waitFor(() => {
      expect(screen.getByText('steel-moodboard')).toBeInTheDocument();
      expect(screen.getByText('strategy-notes.md')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    const selectedRows = document.querySelectorAll('[data-selected="true"]');
    expect(selectedRows).toHaveLength(1);
    expect(scrollSpy).toHaveBeenCalled();
  });

  it('keeps focus on the textbox after clicking shell chrome', async () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    await screen.findByText('10 indexed');
    fireEvent.mouseDown(document.querySelector('[data-results-scroll="true"]')!);

    expect(input).toHaveFocus();
  });

  it('keeps tab focus pinned to the textbox', async () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    await screen.findByText('10 indexed');

    fireEvent.keyDown(window, { key: 'Tab' });

    expect(input).toHaveFocus();
  });

  it('opens an actions panel with cmd+k and filters actions while keeping focus in actions mode', async () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    fireEvent.change(input, { target: { value: 'product' } });

    await waitFor(() => {
      expect(screen.getAllByText('product-brief.md').length).toBeGreaterThan(0);
    });

    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    const actionFilter = await screen.findByLabelText('Action filter');
    expect(actionFilter).toHaveFocus();
    expect(document.querySelector('[data-actions-panel="true"]')).toBeTruthy();
    expect(screen.getAllByText('Reveal in Finder').length).toBeGreaterThan(0);

    fireEvent.change(actionFilter, { target: { value: 'finder' } });
    const panel = document.querySelector('[data-actions-panel="true"]') as HTMLElement;
    expect(within(panel).getAllByText('Reveal in Finder').length).toBeGreaterThan(0);
    expect(within(panel).queryByText('Copy Path')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(actionFilter).toHaveFocus();
  });

  it('redirects stray focus back to the textbox', async () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    await screen.findByText('10 indexed');
    fireEvent.change(input, { target: { value: 'steel' } });

    await waitFor(() => {
      expect(screen.getAllByText('steel-moodboard').length).toBeGreaterThan(0);
    });

    const row = document.querySelector('[data-selected="true"]') as HTMLButtonElement;
    row.focus();

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it('dismisses after running an enter action that requests dismissal', async () => {
    const hide = vi.fn().mockResolvedValue(undefined);
    const ready = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.assign(navigator, {
      clipboard: { writeText }
    });

    window.launcher = {
      ready,
      hide,
      searchLocal: vi.fn().mockResolvedValue([]),
      openPath: vi.fn().mockResolvedValue(undefined),
      revealPath: vi.fn().mockResolvedValue(undefined),
      openInTerminal: vi.fn().mockResolvedValue(undefined),
      openWithTextEdit: vi.fn().mockResolvedValue(undefined),
      trashPath: vi.fn().mockResolvedValue(undefined)
    };

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    fireEvent.change(input, { target: { value: '30mph to kmh' } });

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Enter' });
      await Promise.resolve();
    });

    expect(hide).toHaveBeenCalled();
  });

  it('clears the query on escape before hiding the launcher', async () => {
    const hide = vi.fn().mockResolvedValue(undefined);

    window.launcher = {
      ready: vi.fn().mockResolvedValue(undefined),
      hide,
      searchLocal: vi.fn().mockResolvedValue([]),
      openPath: vi.fn().mockResolvedValue(undefined),
      revealPath: vi.fn().mockResolvedValue(undefined),
      openInTerminal: vi.fn().mockResolvedValue(undefined),
      openWithTextEdit: vi.fn().mockResolvedValue(undefined),
      trashPath: vi.fn().mockResolvedValue(undefined)
    };

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'coding' } });

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
      await Promise.resolve();
    });

    expect(input.value).toBe('');
    expect(hide).not.toHaveBeenCalled();
  });

  it('shows result actions in the actions panel', async () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    fireEvent.change(input, { target: { value: 'steel' } });

    await waitFor(() => {
      expect(screen.getAllByText('steel-moodboard').length).toBeGreaterThan(0);
    });

    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    await waitFor(() => {
      expect(screen.getAllByText('Open In Terminal').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Copy Name').length).toBeGreaterThan(0);
      expect(screen.queryByText('Quick Look')).not.toBeInTheDocument();
    });
  });

  it('does not open native quick look with ArrowRight for a local result', async () => {
    const quickLookPath = vi.fn().mockResolvedValue(undefined);

    window.launcher = {
      ready: vi.fn().mockResolvedValue(undefined),
      quickLookPath,
      getSettings: vi.fn().mockResolvedValue({
        ...launcherRuntime.getSettingsSnapshot(),
        quickLookEnabled: true
      }),
      getStatus: vi.fn().mockResolvedValue({
        appVersion: '0.2.0',
        indexEntryCount: 10,
        indexReady: true,
        isRestoring: false,
        isRefreshing: false
      }),
      searchLocal: vi.fn().mockResolvedValue([
        {
          id: '/Users/nm4/Documents/Brand/steel-moodboard',
          path: '/Users/nm4/Documents/Brand/steel-moodboard',
          name: 'steel-moodboard',
          kind: 'folder',
          score: 132
        }
      ]),
      getClipboardHistory: vi.fn().mockResolvedValue([]),
      openSettings: vi.fn().mockResolvedValue(undefined),
      getPathPreview: vi.fn().mockResolvedValue(null),
      openPath: vi.fn().mockResolvedValue(undefined),
      revealPath: vi.fn().mockResolvedValue(undefined),
      openInTerminal: vi.fn().mockResolvedValue(undefined),
      openWithTextEdit: vi.fn().mockResolvedValue(undefined),
      trashPath: vi.fn().mockResolvedValue(undefined),
      saveSettings: vi.fn().mockResolvedValue(launcherRuntime.getSettingsSnapshot())
    };

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    fireEvent.change(input, { target: { value: 'steel' } });

    await waitFor(() => {
      expect(screen.getAllByText('steel-moodboard').length).toBeGreaterThan(0);
    });

    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      await Promise.resolve();
    });

    expect(quickLookPath).not.toHaveBeenCalled();
  });

  it('keeps existing results visible while an index refresh is resolving', async () => {
    let onIndexChanged: (() => void) | undefined;
    let resolveRefresh: ((items: Array<{ id: string; path: string; name: string; kind: 'file'; score: number }>) => void) | undefined;
    const searchLocal = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: '/Users/nm4/Documents/product-brief.md',
          path: '/Users/nm4/Documents/product-brief.md',
          name: 'product-brief.md',
          kind: 'file',
          score: 140
        }
      ])
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve;
          })
      );

    window.launcher = {
      ready: vi.fn().mockResolvedValue(undefined),
      searchLocal,
      getStatus: vi.fn().mockResolvedValue({
        appVersion: '0.8.0',
        indexEntryCount: 10,
        indexReady: true,
        isRestoring: false,
        isRefreshing: false
      }),
      getSettings: vi.fn().mockResolvedValue(launcherRuntime.getSettingsSnapshot()),
      getClipboardHistory: vi.fn().mockResolvedValue([]),
      onIndexChanged: vi.fn().mockImplementation((callback) => {
        onIndexChanged = callback;
        return () => {};
      }),
      openPath: vi.fn().mockResolvedValue(undefined),
      revealPath: vi.fn().mockResolvedValue(undefined),
      openInTerminal: vi.fn().mockResolvedValue(undefined),
      openWithTextEdit: vi.fn().mockResolvedValue(undefined),
      trashPath: vi.fn().mockResolvedValue(undefined),
      hide: vi.fn().mockResolvedValue(undefined)
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    fireEvent.change(input, { target: { value: 'product' } });

    await waitFor(() => {
      expect(screen.getAllByText('product-brief.md').length).toBeGreaterThan(0);
    });

    act(() => {
      onIndexChanged?.();
    });

    expect(screen.getAllByText('product-brief.md').length).toBeGreaterThan(0);
    expect(screen.queryByText('Searching...')).not.toBeInTheDocument();

    await act(async () => {
      resolveRefresh?.([
        {
          id: '/Users/nm4/Documents/product-brief.md',
          path: '/Users/nm4/Documents/product-brief.md',
          name: 'product-brief.md',
          kind: 'file',
          score: 140
        }
      ]);
      await Promise.resolve();
    });
  });

  it('keeps the resolved preview visible while the same result refreshes', async () => {
    let onIndexChanged: (() => void) | undefined;
    let resolveRefresh: ((items: Array<{ id: string; path: string; name: string; kind: 'file'; score: number }>) => void) | undefined;
    const getPathPreview = vi
      .fn()
      .mockResolvedValueOnce({
        title: 'product-brief.md',
        subtitle: '/Users/nm4/Documents/product-brief.md',
        mediaUrl: 'data:image/png;base64,stable',
        mediaAlt: 'product-brief.md',
        sections: [{ label: 'Type', value: 'PNG' }]
      })
      .mockResolvedValueOnce({
        title: 'product-brief.md',
        subtitle: '/Users/nm4/Documents/product-brief.md',
        mediaUrl: 'data:image/png;base64,stable',
        mediaAlt: 'product-brief.md',
        sections: [{ label: 'Type', value: 'PNG' }]
      });
    const searchLocal = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: '/Users/nm4/Documents/product-brief.md',
          path: '/Users/nm4/Documents/product-brief.md',
          name: 'product-brief.md',
          kind: 'file',
          score: 140
        }
      ])
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve;
          })
      );

    window.launcher = {
      ready: vi.fn().mockResolvedValue(undefined),
      searchLocal,
      getPathPreview,
      getStatus: vi.fn().mockResolvedValue({
        appVersion: '0.8.0',
        indexEntryCount: 10,
        indexReady: true,
        isRestoring: false,
        isRefreshing: false
      }),
      getSettings: vi.fn().mockResolvedValue(launcherRuntime.getSettingsSnapshot()),
      getClipboardHistory: vi.fn().mockResolvedValue([]),
      onIndexChanged: vi.fn().mockImplementation((callback) => {
        onIndexChanged = callback;
        return () => {};
      }),
      openPath: vi.fn().mockResolvedValue(undefined),
      revealPath: vi.fn().mockResolvedValue(undefined),
      openInTerminal: vi.fn().mockResolvedValue(undefined),
      openWithTextEdit: vi.fn().mockResolvedValue(undefined),
      trashPath: vi.fn().mockResolvedValue(undefined),
      hide: vi.fn().mockResolvedValue(undefined)
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    fireEvent.change(screen.getByLabelText('Launcher query'), { target: { value: 'product' } });

    const image = await screen.findByAltText('product-brief.md');
    expect(image).toHaveAttribute('src', 'data:image/png;base64,stable');

    act(() => {
      onIndexChanged?.();
    });

    expect(screen.getByAltText('product-brief.md')).toHaveAttribute('src', 'data:image/png;base64,stable');

    await act(async () => {
      resolveRefresh?.([
        {
          id: '/Users/nm4/Documents/product-brief.md',
          path: '/Users/nm4/Documents/product-brief.md',
          name: 'product-brief.md',
          kind: 'file',
          score: 140
        }
      ]);
      await Promise.resolve();
    });
  });

  it('traces cancelled search requests when a newer query overtakes them', async () => {
    let resolveFirstSearch: ((items: Array<{ id: string; path: string; name: string; kind: 'file'; score: number }>) => void) | undefined;
    const traceEvent = vi.fn().mockResolvedValue(undefined);
    const searchLocal = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstSearch = resolve;
          })
      )
      .mockResolvedValueOnce([
        {
          id: '/Users/nm4/Documents/product-plan.md',
          path: '/Users/nm4/Documents/product-plan.md',
          name: 'product-plan.md',
          kind: 'file',
          score: 130
        }
      ]);

    window.launcher = {
      ready: vi.fn().mockResolvedValue(undefined),
      getTraceState: vi.fn().mockResolvedValue({
        enabled: true,
        sessionId: 'trace-session'
      }),
      traceEvent,
      searchLocal,
      getStatus: vi.fn().mockResolvedValue({
        appVersion: '0.7.10',
        indexEntryCount: 10,
        indexReady: true,
        isRestoring: false,
        isRefreshing: false
      }),
      getSettings: vi.fn().mockResolvedValue(launcherRuntime.getSettingsSnapshot()),
      getClipboardHistory: vi.fn().mockResolvedValue([]),
      openPath: vi.fn().mockResolvedValue(undefined),
      revealPath: vi.fn().mockResolvedValue(undefined),
      openInTerminal: vi.fn().mockResolvedValue(undefined),
      openWithTextEdit: vi.fn().mockResolvedValue(undefined),
      trashPath: vi.fn().mockResolvedValue(undefined),
      hide: vi.fn().mockResolvedValue(undefined)
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    const input = screen.getByLabelText('Launcher query');
    fireEvent.change(input, { target: { value: 'prod' } });
    fireEvent.change(input, { target: { value: 'product' } });

    await act(async () => {
      resolveFirstSearch?.([
        {
          id: '/Users/nm4/Documents/prod.md',
          path: '/Users/nm4/Documents/prod.md',
          name: 'prod.md',
          kind: 'file',
          score: 101
        }
      ]);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getAllByText('product-plan.md').length).toBeGreaterThan(0);
    });

    expect(
      traceEvent.mock.calls.some(
        ([event]) => event.subsystem === 'search' && event.event === 'cancel' && event.outcome === 'obsolete'
      )
    ).toBe(true);
  });

  it('dumps the current trace snapshot with cmd+shift+d', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const writeTraceDump = vi.fn().mockResolvedValue({
      path: '/Users/nm4/Library/Application Support/Northlight/trace-dumps/trace-session.json',
      sessionId: 'trace-session',
      generatedAt: Date.now(),
      eventCount: 12
    });

    window.launcher = {
      ready: vi.fn().mockResolvedValue(undefined),
      getTraceState: vi.fn().mockResolvedValue({
        enabled: true,
        sessionId: 'trace-session'
      }),
      traceEvent: vi.fn().mockResolvedValue(undefined),
      writeTraceDump,
      getStatus: vi.fn().mockResolvedValue({
        appVersion: '0.7.10',
        indexEntryCount: 10,
        indexReady: true,
        isRestoring: false,
        isRefreshing: false
      }),
      getSettings: vi.fn().mockResolvedValue(launcherRuntime.getSettingsSnapshot()),
      getClipboardHistory: vi.fn().mockResolvedValue([]),
      openPath: vi.fn().mockResolvedValue(undefined),
      revealPath: vi.fn().mockResolvedValue(undefined),
      openInTerminal: vi.fn().mockResolvedValue(undefined),
      openWithTextEdit: vi.fn().mockResolvedValue(undefined),
      trashPath: vi.fn().mockResolvedValue(undefined),
      hide: vi.fn().mockResolvedValue(undefined)
    } as never;

    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <LauncherBar />
      </MantineProvider>
    );

    await act(async () => {
      fireEvent.keyDown(window, { key: 'D', metaKey: true, shiftKey: true });
      await Promise.resolve();
    });

    expect(writeTraceDump).toHaveBeenCalled();
    expect(screen.getByText('Trace saved')).toBeInTheDocument();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('/Users/nm4/Library/Application Support/Northlight/trace-dumps/trace-session.json')
    );

    logSpy.mockRestore();
  });
});
