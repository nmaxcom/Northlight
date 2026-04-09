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

function cloneMockState(state: LauncherBarMockState): LauncherBarMockState {
  return JSON.parse(JSON.stringify(state)) as LauncherBarMockState;
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
  appVersion: '0.8.45',
  indexEntryCount: 102005,
  indexReady: true,
  isRestoring: false,
  isRefreshing: false,
  searchMode: 'hybrid',
  catalogState: 'ready'
};

const icons = {
  stremio: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#25272e'/><stop offset='1' stop-color='#050608'/></linearGradient><linearGradient id='p' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#a47eff'/><stop offset='1' stop-color='#394de1'/></linearGradient></defs><rect x='3' y='3' width='58' height='58' rx='15' fill='url(#bg)'/><rect x='16' y='16' width='32' height='32' rx='8' transform='rotate(45 32 32)' fill='url(#p)'/><path d='M28 22l14 10-14 10z' fill='white' opacity='.96'/></svg>"
  ),
  keyboardMaestro: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'><defs><radialGradient id='halo' cx='50%' cy='44%' r='60%'><stop offset='0%' stop-color='rgba(255,255,255,0.08)'/><stop offset='45%' stop-color='rgba(172,215,111,0.18)'/><stop offset='75%' stop-color='rgba(106,75,214,0.12)'/><stop offset='100%' stop-color='rgba(0,0,0,0)'/></radialGradient><filter id='blur' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='7'/></filter><linearGradient id='pen' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#fafbff'/><stop offset='32%' stop-color='#2a2b3f'/><stop offset='68%' stop-color='#090b15'/><stop offset='100%' stop-color='#fdfefe'/></linearGradient><linearGradient id='card' x1='0' y1='0' x2='0.9' y2='1'><stop offset='0%' stop-color='#f8f8fb'/><stop offset='100%' stop-color='#d7d8df'/></linearGradient></defs><rect width='320' height='320' rx='40' fill='#1d2129'/><circle cx='160' cy='156' r='110' fill='url(#halo)' filter='url(#blur)' opacity='0.9'/><g fill='rgba(255,255,255,0.82)'><circle cx='44' cy='92' r='4'/><circle cx='252' cy='46' r='5'/><circle cx='286' cy='94' r='6'/><circle cx='296' cy='176' r='4'/><circle cx='228' cy='258' r='4'/><circle cx='84' cy='266' r='3'/></g><g opacity='0.55' stroke='rgba(255,255,255,0.95)'><path d='M32 92h24'/><path d='M44 80v24'/><path d='M240 46h24'/><path d='M252 34v24'/><path d='M274 94h24'/><path d='M286 82v24'/></g><g transform='translate(44 64) rotate(-14 116 102)'><rect x='0' y='18' width='190' height='190' rx='30' fill='url(#card)'/><rect x='0' y='18' width='190' height='190' rx='30' fill='rgba(255,255,255,0.42)' opacity='0.3'/><path d='M28 188l148 0' stroke='rgba(255,255,255,0.58)' stroke-width='8' stroke-linecap='round'/><path d='M22 180l154 0' stroke='rgba(0,0,0,0.08)' stroke-width='2' stroke-linecap='round'/><path d='M58 60c12-12 32-12 44 0 12-12 32-12 44 0 12 12 12 32 0 44 12 12 12 32 0 44-12 12-32 12-44 0-12 12-32 12-44 0-12-12-12-32 0-44-12-12-12-32 0-44zm22 22c-6 6-6 16 0 22l36 36c6 6 16 6 22 0 6-6 6-16 0-22L102 82c-6-6-16-6-22 0zm58 0c-6 6-6 16 0 22l18 18c6 6 16 6 22 0 6-6 6-16 0-22l-18-18c-6-6-16-6-22 0zM80 140c-6 6-6 16 0 22 6 6 16 6 22 0l18-18c6-6 6-16 0-22-6-6-16-6-22 0l-18 18zm58 0l-36 36c-6 6-6 16 0 22 6 6 16 6 22 0l36-36c6-6 6-16 0-22-6-6-16-6-22 0z' fill='#8d8f97'/></g><g transform='translate(188 70) rotate(32 34 114)'><rect x='22' y='6' width='24' height='214' rx='12' fill='url(#pen)'/><rect x='22' y='6' width='24' height='18' rx='9' fill='rgba(255,255,255,0.94)'/><rect x='22' y='196' width='24' height='24' rx='9' fill='rgba(255,255,255,0.94)'/></g></svg>"
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
  folderBlue: svgDataUri(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#87cfff'/><stop offset='1' stop-color='#4e8ed8'/></linearGradient></defs><path d='M8 20c0-4 3-7 7-7h11l5 5h18c4 0 7 3 7 7v18c0 7-5 12-12 12H20c-7 0-12-5-12-12V20z' fill='url(#g)'/><path d='M8 25h48v18c0 7-5 12-12 12H20c-7 0-12-5-12-12V25z' fill='rgba(255,255,255,0.16)'/></svg>"
  )
};

const stremioPreview: LauncherPreview = {
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
    { label: 'Bundle ID', value: 'com.stremio.stremio-shell-macos' }
  ]
};

const keyboardMaestroPreview: LauncherPreview = {
  title: 'Keyboard Maestro',
  subtitle: '/Applications/Keyboard Maestro.app',
  mediaUrl: icons.keyboardMaestro,
  mediaAlt: 'Keyboard Maestro app icon',
  mediaKind: 'image',
  sections: [
    { label: 'Type', value: 'Application' },
    { label: 'Bundle', value: 'Keyboard Maestro.app' },
    { label: 'Version', value: '11.0.4' },
    { label: 'Bundle ID', value: 'com.stairways.keyboardmaestro.editor' }
  ]
};

const stracePreview: LauncherPreview = {
  title: 'strace',
  subtitle: '/Users/nm4/.config/cheat/cheatsheets/community/strace',
  sections: [
    { label: 'Type', value: 'Folder' },
    { label: 'Path', value: '/Users/nm4/.config/cheat/cheatsheets/community/strace' }
  ]
};

const stripePreview: LauncherPreview = {
  title: 'stripe',
  subtitle: '/Users/nm4/.oh-my-zsh/plugins/stripe',
  body: 'README.md\nstripe.plugin.zsh',
  bodyMode: 'plain',
  sections: [
    { label: 'Type', value: 'Folder' },
    { label: 'Items', value: '2' },
    { label: 'Folders', value: '0' },
    { label: 'Files', value: '2' }
  ]
};

const stringCmpPreview: LauncherPreview = {
  title: 'string_cmp.h',
  subtitle: '/Users/nm4/.powerlevel10k/gitstatus/src/string_cmp.h',
  body: `// Copyright 2019 Roman Perepelitsa.\n//\n// This file is part of GitStatus.\n//\n// GitStatus is free software: you can redistribute it and/or modify\n// it under the terms of the GNU General Public License as published by\n// the Free Software Foundation, either version 3 of the License, or\n// (at your option) any later version.`,
  bodyMode: 'plain',
  sections: [
    { label: 'Type', value: 'H' },
    { label: 'Size', value: '4 KB' },
    { label: 'Modified', value: 'Nov 16, 2024, 12:24 AM' }
  ]
};

function result(
  id: string,
  title: string,
  subtitle: string,
  kind: LauncherResult['kind'],
  path: string,
  actions: LauncherAction[],
  preview?: LauncherPreview
): LauncherResult {
  return {
    id,
    title,
    subtitle,
    icon: null,
    kind,
    score: 100,
    path,
    source: 'local',
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

const results: LauncherResult[] = [
  {
    ...result('stremio-app', 'Stremio.app', '/Applications/Stremio.app', 'app', '/Applications/Stremio.app', appActions, stremioPreview),
    iconUrl: icons.stremio
  },
  {
    ...result('keyboard-maestro-app', 'Keyboard Maestro.app', '/Applications/Keyboard Maestro.app', 'app', '/Applications/Keyboard Maestro.app', appActions, keyboardMaestroPreview),
    iconUrl: icons.keyboardMaestro
  },
  {
    ...result('strace-folder', 'strace', '/Users/nm4/.config/cheat/cheatsheets/community/strace', 'folder', '/Users/nm4/.config/cheat/cheatsheets/community/strace', folderActions, stracePreview),
    iconUrl: icons.file
  },
  {
    ...result('strace-md', 'strace.md', '/Users/nm4/.tldr/tldr/pages/linux/strace.md', 'file', '/Users/nm4/.tldr/tldr/pages/linux/strace.md', fileActions),
    iconUrl: icons.fileArrow
  },
  {
    ...result('string-cmp', 'string_cmp.h', '/Users/nm4/.powerlevel10k/gitstatus/src/string_cmp.h', 'file', '/Users/nm4/.powerlevel10k/gitstatus/src/string_cmp.h', fileActions, stringCmpPreview),
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
    ...result('stripe-folder', 'stripe', '/Users/nm4/.oh-my-zsh/plugins/stripe', 'folder', '/Users/nm4/.oh-my-zsh/plugins/stripe', folderActions, stripePreview),
    iconUrl: icons.folderBlue
  },
  {
    ...result('stripe-com', 'stripe.com', '/Users/nm4/STUFF/Coding/tmp/stripe.com', 'file', '/Users/nm4/STUFF/Coding/tmp/stripe.com', fileActions),
    iconUrl: icons.folderBlue
  },
  {
    ...result('stripe-plugin', 'stripe.plugin.zsh', '/Users/nm4/.oh-my-zsh/plugins/stripe/stripe.plugin.zsh', 'file', '/Users/nm4/.oh-my-zsh/plugins/stripe/stripe.plugin.zsh', fileActions),
    iconUrl: icons.fileArrow
  },
  {
    ...result('strug-theme', 'strug.zsh-theme', '/Users/nm4/.oh-my-zsh/themes/strug.zsh-theme', 'file', '/Users/nm4/.oh-my-zsh/themes/strug.zsh-theme', fileActions),
    iconUrl: icons.file
  }
];

function buildLauncherMockState(selectedIndex: number): LauncherBarMockState {
  return {
    query: 'str',
    results,
    selectedIndex,
    pointerActive: false,
    isResolving: false,
    isActionsOpen: false,
    actionQuery: '',
    actionSelectedIndex: 0,
    preview: results[selectedIndex]?.preview ?? null,
    settings,
    status
  };
}

const launcherMockStates = {
  current: buildLauncherMockState(0),
  folderPreview: buildLauncherMockState(2),
  appPreview: buildLauncherMockState(1),
  folderListingPreview: buildLauncherMockState(8),
  filePreview: buildLauncherMockState(4)
} satisfies Record<string, LauncherBarMockState>;

export type LauncherMockVariant = keyof typeof launcherMockStates;

export function getLauncherMockState(variant: LauncherMockVariant = 'current') {
  return cloneMockState(launcherMockStates[variant]);
}

export const launcherCurrentViewMock = getLauncherMockState('current');
