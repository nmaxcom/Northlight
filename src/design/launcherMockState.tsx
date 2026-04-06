import type { LauncherAction, LauncherPreview, LauncherResult, LauncherSettings, LauncherStatus } from '../lib/search/types';
import type { LauncherBarMockState } from '../components/LauncherBar';

const noop = () => {};

function action(id: string, label: string, hint: string, feedbackLabel?: string): LauncherAction {
  return {
    id,
    label,
    hint,
    feedbackLabel,
    run: noop
  };
}

const stremioPreview: LauncherPreview = {
  title: 'Stremio',
  subtitle: '/Applications/Stremio.app',
  body: 'macOS application bundle',
  mediaUrl:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 260'><defs><linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%23484a4f'/><stop offset='1' stop-color='%2324272d'/></linearGradient><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%239d7dff'/><stop offset='1' stop-color='%23384fca'/></linearGradient></defs><rect x='38' y='18' width='284' height='224' rx='42' fill='url(%23bg)' opacity='0.96'/><rect x='108' y='70' width='144' height='144' rx='34' transform='rotate(45 180 142)' fill='url(%23g)' stroke='rgba(255,255,255,0.14)' stroke-width='5'/><path d='M168 112 L217 147 L168 182 Z' fill='white' opacity='0.96'/></svg>",
  sections: [
    { label: 'Type', value: 'Application' },
    { label: 'Bundle', value: 'Stremio.app' },
    { label: 'Version', value: '5.1.14' },
    { label: 'Bundle ID', value: 'com.stremio.stremio-shell' }
  ]
};

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
  appVersion: '0.8.1',
  indexEntryCount: 30487,
  indexReady: true,
  isRestoring: false,
  isRefreshing: false,
  searchMode: 'hybrid',
  catalogState: 'ready'
};

const iconUrls: Record<string, string> = {
  '/Applications/Stremio.app':
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%239d7dff'/><stop offset='1' stop-color='%23384fca'/></linearGradient></defs><rect x='6' y='6' width='116' height='116' rx='30' fill='%23363a44'/><rect x='28' y='28' width='72' height='72' rx='18' transform='rotate(45 64 64)' fill='url(%23g)' stroke='rgba(255,255,255,0.16)' stroke-width='4'/><path d='M58 46 L82 64 L58 82 Z' fill='white' opacity='0.95'/></svg>",
  '/Applications/Keyboard Maestro.app':
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect x='5' y='5' width='54' height='54' rx='16' fill='%23363b45'/><path d='M17 21l30 0 0 22-30 0z' fill='white' opacity='0.95' transform='rotate(-12 32 32)'/><path d='M24 13l26 0 0 32-26 0z' fill='white' opacity='0.82' transform='rotate(10 37 29)'/><path d='M23 32c4-8 6-12 8-12 2 0 4 4 8 12M23 32c4 0 8 4 8 10M39 22c-3 1-4 3-4 6 0 4 4 6 4 10' stroke='%2351555d' stroke-width='2.5' fill='none' stroke-linecap='round'/></svg>",
  '/Applications/Adobe Photoshop 2026/Presets/Curves/Strong Contrast (RGB).acv':
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect x='8' y='6' width='48' height='52' rx='12' fill='%23f0f3f7'/><rect x='12' y='10' width='40' height='44' rx='8' fill='white'/><text x='20' y='34' font-family='Arial' font-size='18' font-weight='700' fill='%23363c46'>fx</text><text x='18' y='46' font-family='Arial' font-size='9' font-weight='700' fill='%23363c46'>CURVE</text></svg>",
  '/Applications/Adobe Photoshop 2026/Presets/Hue and Saturation/Strong Saturation.ahu':
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect x='8' y='6' width='48' height='52' rx='12' fill='%23f0f3f7'/><rect x='12' y='10' width='40' height='44' rx='8' fill='white'/><text x='20' y='34' font-family='Arial' font-size='18' font-weight='700' fill='%23363c46'>fx</text><text x='20' y='46' font-family='Arial' font-size='9' font-weight='700' fill='%23363c46'>HSL</text></svg>",
  '/Users/nm4/STUFF/Coding/tmp/stripe.com':
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%2388c8ff'/><stop offset='1' stop-color='%234d87cb'/></linearGradient></defs><path d='M9 22c0-5 4-9 9-9h10l4 5h14c5 0 9 4 9 9v18c0 5-4 9-9 9H18c-5 0-9-4-9-9V22z' fill='url(%23g)'/><path d='M9 26h46v18c0 6-4 10-10 10H19c-6 0-10-4-10-10V26z' fill='rgba(255,255,255,0.10)'/></svg>"
};

function result(id: string, title: string, subtitle: string, kind: LauncherResult['kind'], path: string, source: LauncherResult['source'], actions: LauncherAction[], preview?: LauncherPreview): LauncherResult {
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

const primaryActions = [
  action('open', 'Launch App', 'Enter', 'Launched app'),
  action('reveal', 'Reveal in Finder', 'Cmd+Enter', 'Revealed in Finder'),
  action('copy-path', 'Copy Path', 'Cmd+Shift+C', 'Copied path')
];

const results: LauncherResult[] = [
  result('stremio-app', 'Stremio.app', '/Applications/Stremio.app', 'app', '/Applications/Stremio.app', 'local', primaryActions, stremioPreview),
  result('keyboard-maestro', 'Keyboard Maestro.app', '/Applications/Keyboard Maestro.app', 'app', '/Applications/Keyboard Maestro.app', 'local', primaryActions),
  result('strong-contrast', 'Strong Contrast (RGB).acv', '/Applications/Adobe Photoshop 2026/Presets/Curves/Strong Contrast (RGB).acv', 'file', '/Applications/Adobe Photoshop 2026/Presets/Curves/Strong Contrast (RGB).acv', 'local', [action('open-file', 'Open File', 'Enter')]),
  result('strong-saturation', 'Strong Saturation.ahu', '/Applications/Adobe Photoshop 2026/Presets/Hue and Saturation/Strong Saturation.ahu', 'file', '/Applications/Adobe Photoshop 2026/Presets/Hue and Saturation/Strong Saturation.ahu', 'local', [action('open-file-2', 'Open File', 'Enter')]),
  result('stripe-folder', 'stripe.com', '/Users/nm4/STUFF/Coding/tmp/stripe.com', 'folder', '/Users/nm4/STUFF/Coding/tmp/stripe.com', 'local', [action('open-folder', 'Open Folder', 'Enter')]),
  {
    id: 'trace-dump',
    title: '/Users/nm4/Library/Application Support/Northlight/trace-dumps/trace-mnf8',
    subtitle: '4/1/2026, 1:06:55 AM',
    icon: null,
    kind: 'clipboard',
    score: 60,
    source: 'clipboard',
    actions: [action('copy-clipboard', 'Copy Clipboard', 'Enter')]
  },
  {
    id: 'trace-message',
    title: '[renderer] [trace dump] saved 402 events to /Users/nm4/Library/Applicati',
    subtitle: '4/1/2026, 1:04:20 AM',
    icon: null,
    kind: 'clipboard',
    score: 50,
    source: 'clipboard',
    actions: [action('copy-clipboard-2', 'Copy Clipboard', 'Enter')]
  }
];

export const launcherCurrentViewMock: LauncherBarMockState = {
  query: 'str',
  results,
  selectedIndex: 0,
  isResolving: false,
  isActionsOpen: false,
  actionQuery: '',
  actionSelectedIndex: 0,
  preview: stremioPreview,
  settings,
  status,
  iconUrls
};
