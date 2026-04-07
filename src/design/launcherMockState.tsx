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
  indexEntryCount: 123344,
  indexReady: true,
  isRestoring: false,
  isRefreshing: false,
  searchMode: 'hybrid',
  catalogState: 'ready'
};

const appPreview: LauncherPreview = {
  title: 'Stremio',
  subtitle: '/Applications/Stremio.app',
  mediaUrl:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'><defs><linearGradient id='b' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23332f35'/><stop offset='1' stop-color='%230f1012'/></linearGradient><linearGradient id='p' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%239e75ff'/><stop offset='1' stop-color='%23344dd4'/></linearGradient><filter id='shadow' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='10'/></filter></defs><rect x='28' y='28' width='264' height='264' rx='54' fill='url(%23b)' stroke='rgba(255,255,255,0.18)' stroke-width='4'/><rect x='79' y='79' width='162' height='162' rx='30' transform='rotate(45 160 160)' fill='url(%23p)'/><rect x='79' y='79' width='162' height='162' rx='30' transform='rotate(45 160 160)' fill='url(%23p)' filter='url(%23shadow)' opacity='0.34'/><path d='M145 117l54 43-54 43z' fill='white' opacity='0.92'/></svg>",
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
  result('stremio-app', 'Stremio.app', '/Applications/Stremio.app', 'app', '/Applications/Stremio.app', appActions, appPreview),
  result(
    'keyboard-maestro-app',
    'Keyboard Maestro.app',
    '/Applications/Keyboard Maestro.app',
    'app',
    '/Applications/Keyboard Maestro.app',
    appActions
  ),
  result(
    'strong-contrast',
    'Strong Contrast (RGB).acv',
    '/Applications/Adobe Photoshop 2026/Presets/Curves/Strong Contrast (RGB).acv',
    'file',
    '/Applications/Adobe Photoshop 2026/Presets/Curves/Strong Contrast (RGB).acv',
    fileActions
  ),
  result(
    'strong-saturation',
    'Strong Saturation.ahu',
    '/Applications/Adobe Photoshop 2026/Presets/Hue and Saturation/Strong Saturation.ahu',
    'file',
    '/Applications/Adobe Photoshop 2026/Presets/Hue and Saturation/Strong Saturation.ahu',
    fileActions
  ),
  result(
    'stripe-folder',
    'stripe.com',
    '/Users/nm4/STUFF/Coding/tmp/stripe.com',
    'folder',
    '/Users/nm4/STUFF/Coding/tmp/stripe.com',
    folderActions
  ),
  result(
    'trace-dump',
    '/Users/nm4/Library/Application Support/Northlight/trace-dumps/trace-mnf8',
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
  )
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
