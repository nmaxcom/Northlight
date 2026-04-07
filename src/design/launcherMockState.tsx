import type { LauncherAction, LauncherPreview, LauncherResult, LauncherSettings, LauncherStatus } from '../lib/search/types';
import type { LauncherBarMockState } from '../components/LauncherBar';

const noop = () => {};

function svgDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function action(id: string, label: string, hint: string, feedbackLabel?: string): LauncherAction {
  return {
    id,
    label,
    hint,
    feedbackLabel,
    run: noop
  };
}

const settings: LauncherSettings = {
  aliases: [],
  snippets: [],
  scopes: [],
  launcherThemeId: 'sandbox',
  watchFsChangesEnabled: true,
  previewEnabled: true,
  clipboardHistoryEnabled: true,
  snippetsEnabled: true,
  bestMatchEnabled: true,
  appFirstEnabled: true,
  quickLookEnabled: true,
  quickLookStartsOpen: true,
  maxClipboardItems: 20,
  launcherHotkey: 'CommandOrControl+Shift+Space',
  launcherPosition: null
};

const status: LauncherStatus = {
  appVersion: '0.8.41',
  indexEntryCount: 101398,
  indexReady: true,
  isRestoring: false,
  isRefreshing: false,
  searchMode: 'hybrid',
  catalogState: 'ready'
};

const appPreview: LauncherPreview = {
  title: 'Stremio',
  subtitle: '/Applications/Stremio.app',
  mediaUrl: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'><defs><linearGradient id='b' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#332f35'/><stop offset='1' stop-color='#0f1012'/></linearGradient><linearGradient id='p' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#9e75ff'/><stop offset='1' stop-color='#344dd4'/></linearGradient><filter id='shadow' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='10'/></filter></defs><rect x='28' y='28' width='264' height='264' rx='54' fill='url(#b)' stroke='rgba(255,255,255,0.18)' stroke-width='4'/><rect x='79' y='79' width='162' height='162' rx='30' transform='rotate(45 160 160)' fill='url(#p)'/><rect x='79' y='79' width='162' height='162' rx='30' transform='rotate(45 160 160)' fill='url(#p)' filter='url(#shadow)' opacity='0.34'/><path d='M145 117l54 43-54 43z' fill='white' opacity='0.92'/></svg>"
  ),
  mediaAlt: 'Stremio app icon',
  mediaKind: 'image',
  sections: [
    { label: 'Type', value: 'Application' },
    { label: 'Bundle', value: 'Stremio.app' },
    { label: 'Version', value: '5.1.14' },
    { label: 'Bundle ID', value: 'com.stremio.stremio-shell' }
  ]
};

function result(
  id: string,
  title: string,
  subtitle: string,
  kind: LauncherResult['kind'],
  path: string,
  actions: LauncherAction[],
  preview?: LauncherPreview,
  source: LauncherResult['source'] = 'local'
): LauncherResult {
  return {
    id,
    title,
    subtitle,
    icon: null,
    kind,
    score: 100,
    path,
    source,
    actions,
    preview
  };
}

const icons = {
  stremio: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#25272e'/><stop offset='1' stop-color='#050608'/></linearGradient><linearGradient id='p' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#a47eff'/><stop offset='1' stop-color='#394de1'/></linearGradient></defs><rect x='3' y='3' width='58' height='58' rx='15' fill='url(#bg)'/><rect x='16' y='16' width='32' height='32' rx='8' transform='rotate(45 32 32)' fill='url(#p)'/><path d='M28 22l14 10-14 10z' fill='white' opacity='.96'/></svg>"
  ),
  keyboardMaestro: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect x='6' y='6' width='52' height='52' rx='14' fill='#2b3040'/><rect x='11' y='11' width='42' height='42' rx='8' fill='#faf7f4' transform='rotate(-10 32 32)'/><path d='M22 19l20 26' stroke='#4d5361' stroke-width='4' stroke-linecap='round'/><path d='M22 45l20-26' stroke='#aeb5c6' stroke-width='4' stroke-linecap='round' opacity='.8'/><text x='25' y='39' font-size='21' font-family='Arial' fill='#656b79'>⌘</text></svg>"
  ),
  file: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><path d='M15 6h24l10 10v42H15z' fill='#fcfcfc'/><path d='M39 6v11h10' fill='#e9edf2'/><path d='M39 6l10 10H39z' fill='#e2e7ed'/></svg>"
  ),
  fileArrow: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><path d='M15 6h24l10 10v42H15z' fill='#fcfcfc'/><path d='M39 6v11h10' fill='#e9edf2'/><path d='M39 6l10 10H39z' fill='#e2e7ed'/><path d='M32 22v17' stroke='#59a3c8' stroke-width='4' stroke-linecap='round'/><path d='M24 33l8 8 8-8' fill='none' stroke='#59a3c8' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/></svg>"
  ),
  fileH: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><path d='M15 6h24l10 10v42H15z' fill='#fcfcfc'/><path d='M39 6v11h10' fill='#e9edf2'/><path d='M39 6l10 10H39z' fill='#e2e7ed'/><text x='24' y='44' font-size='24' font-family='Arial' fill='#a4a6ac'>h</text></svg>"
  ),
  fileCpp: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><path d='M15 6h24l10 10v42H15z' fill='#fcfcfc'/><path d='M39 6v11h10' fill='#e9edf2'/><path d='M39 6l10 10H39z' fill='#e2e7ed'/><text x='20' y='44' font-size='18' font-family='Arial' fill='#9f62ff'>C++</text></svg>"
  ),
  clipboard: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#5c437e'/><stop offset='1' stop-color='#3f315e'/></linearGradient></defs><rect x='8' y='8' width='48' height='48' rx='14' fill='url(#g)'/><rect x='24' y='18' width='16' height='6' rx='3' fill='rgba(255,255,255,0.28)'/><rect x='22' y='23' width='20' height='24' rx='4' fill='rgba(255,255,255,0.08)' stroke='rgba(255,255,255,0.24)'/><path d='M28 31h8M28 36h8M28 41h6' stroke='rgba(255,255,255,0.78)' stroke-width='2' stroke-linecap='round'/></svg>"
  ),
  folderBlue: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#87cfff'/><stop offset='1' stop-color='#4e8ed8'/></linearGradient></defs><path d='M8 20c0-4 3-7 7-7h11l5 5h18c4 0 7 3 7 7v18c0 7-5 12-12 12H20c-7 0-12-5-12-12V20z' fill='url(#g)'/><path d='M8 25h48v18c0 7-5 12-12 12H20c-7 0-12-5-12-12V25z' fill='rgba(255,255,255,0.16)'/></svg>"
  )
};

const appActions = [
  action('launch-app', 'Launch App', 'Enter', 'Launched app'),
  action('reveal-app', 'Reveal in Finder', 'Cmd+Enter', 'Revealed in Finder'),
  action('copy-app-path', 'Copy Path', 'Cmd+Shift+C', 'Copied path')
];

const fileActions = [
  action('open-file', 'Open File', 'Enter', 'Opened file'),
  action('reveal-file', 'Reveal in Finder', 'Cmd+Enter', 'Revealed in Finder'),
  action('copy-file-path', 'Copy Path', 'Cmd+Shift+C', 'Copied path')
];

const folderActions = [
  action('open-folder', 'Open Folder', 'Enter', 'Opened folder'),
  action('open-folder-terminal', 'Open In Terminal', 'Cmd+Shift+T', 'Opened in Terminal'),
  action('copy-folder-path', 'Copy Path', 'Cmd+Shift+C', 'Copied path')
];

const clipboardActions = [
  action('copy-clipboard-entry', 'Copy Clipboard Entry', 'Enter', 'Copied clipboard entry'),
  action('copy-clipboard-path', 'Copy Path', 'Cmd+Shift+C', 'Copied path')
];

const results: LauncherResult[] = [
  {
    ...result('stremio-app', 'Stremio.app', '/Applications/Stremio.app', 'app', '/Applications/Stremio.app', appActions, appPreview),
    iconUrl: icons.stremio
  },
  {
    ...result(
      'keyboard-maestro-app',
      'Keyboard Maestro.app',
      '/Applications/Keyboard Maestro.app',
      'app',
      '/Applications/Keyboard Maestro.app',
      appActions
    ),
    iconUrl: icons.keyboardMaestro
  },
  {
    ...result('strace-folder', 'strace', '/Users/nm4/.config/cheat/cheatsheets/community/strace', 'folder', '/Users/nm4/.config/cheat/cheatsheets/community/strace', folderActions),
    iconUrl: icons.file
  },
  {
    ...result('strace-md', 'strace.md', '/Users/nm4/.tldr/tldr/pages/linux/strace.md', 'file', '/Users/nm4/.tldr/tldr/pages/linux/strace.md', fileActions),
    iconUrl: icons.fileArrow
  },
  {
    ...result('string-cmp', 'string_cmp.h', '/Users/nm4/.powerlevel10k/gitstatus/src/string_cmp.h', 'file', '/Users/nm4/.powerlevel10k/gitstatus/src/string_cmp.h', fileActions),
    iconUrl: icons.fileH
  },
  {
    ...result('string-view', 'string_view.h', '/Users/nm4/.powerlevel10k/gitstatus/src/string_view.h', 'file', '/Users/nm4/.powerlevel10k/gitstatus/src/string_view.h', fileActions),
    iconUrl: icons.fileH
  },
  {
    ...result('strings-cc', 'strings.cc', '/Users/nm4/.powerlevel10k/gitstatus/src/strings.cc', 'file', '/Users/nm4/.powerlevel10k/gitstatus/src/strings.cc', fileActions),
    iconUrl: icons.fileCpp
  },
  {
    ...result('strings-h', 'strings.h', '/Users/nm4/.powerlevel10k/gitstatus/src/strings.h', 'file', '/Users/nm4/.powerlevel10k/gitstatus/src/strings.h', fileActions),
    iconUrl: icons.fileH
  },
  {
    ...result('stripe-folder', 'stripe', '/Users/nm4/.oh-my-zsh/plugins/stripe', 'folder', '/Users/nm4/.oh-my-zsh/plugins/stripe', folderActions),
    iconUrl: icons.folderBlue
  },
  {
    ...result(
      'trace-dump',
      '[renderer][trace dump] saved 402 events to /Users/nm4/Library/Application Support/Northlight/trace-dumps/trace-mnf8',
      '4/1/2026, 1:06:55 AM',
      'clipboard',
      '/Users/nm4/Library/Application Support/Northlight/trace-dumps/trace-mnf8',
      clipboardActions,
      {
        title: 'trace-mnf8',
        subtitle: '/Users/nm4/Library/Application Support/Northlight/trace-dumps/trace-mnf8',
        body: '[renderer][trace dump] saved 402 events to /Users/nm4/Library/Application Support/Northlight/trace-dumps/trace-mnf8',
        bodyMode: 'plain',
        sections: [
          { label: 'Type', value: 'Clipboard' },
          { label: 'Copied', value: '4/1/2026, 1:06:55 AM' }
        ]
      },
      'clipboard'
    ),
    iconUrl: icons.clipboard
  }
];

export const launcherCurrentViewMock: LauncherBarMockState = {
  query: 'str',
  results,
  selectedIndex: 0,
  pointerActive: false,
  isResolving: false,
  isActionsOpen: false,
  actionQuery: '',
  actionSelectedIndex: 0,
  preview: appPreview,
  settings,
  status
};
