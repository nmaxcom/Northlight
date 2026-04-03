import { IconSettings } from '@tabler/icons-react';
import { buildOpenSystemSettingsActionDescriptor, resolveActionDescriptor } from './actions';
import { normalizeSearchText } from './scoring';
import type { LauncherResult } from './types';

type SystemSettingsTarget = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  keywords: string[];
};

const SYSTEM_SETTINGS_TARGETS: SystemSettingsTarget[] = [
  {
    id: 'system',
    title: 'Open System Settings',
    subtitle: 'macOS settings hub',
    url: 'x-apple.systempreferences:',
    keywords: ['settings', 'system settings', 'system preferences', 'preferences', 'mac settings', 'mac preferences']
  },
  {
    id: 'apple-account',
    title: 'Open Apple Account Settings',
    subtitle: 'Apple ID, iCloud, media, and purchases',
    url: 'x-apple.systempreferences:com.apple.systempreferences.AppleIDSettings',
    keywords: ['apple account', 'apple id', 'icloud account', 'account']
  },
  {
    id: 'general',
    title: 'Open General Settings',
    subtitle: 'About, Software Update, login items, sharing, and more',
    url: 'x-apple.systempreferences:com.apple.systempreferences.GeneralSettings',
    keywords: ['general', 'about mac', 'software update', 'login items', 'sharing']
  },
  {
    id: 'appearance',
    title: 'Open Appearance Settings',
    subtitle: 'Accent color, theme, and sidebar appearance',
    url: 'x-apple.systempreferences:com.apple.Appearance-Settings.extension',
    keywords: ['appearance', 'theme', 'accent color']
  },
  {
    id: 'control-center',
    title: 'Open Control Center Settings',
    subtitle: 'Menu bar and Control Center modules',
    url: 'x-apple.systempreferences:com.apple.ControlCenter',
    keywords: ['control center', 'menu bar']
  },
  {
    id: 'desktop-dock',
    title: 'Open Desktop & Dock Settings',
    subtitle: 'Dock behavior, Stage Manager, and window layout',
    url: 'x-apple.systempreferences:com.apple.Desktop-Settings.extension',
    keywords: ['desktop', 'dock', 'desktop & dock', 'stage manager']
  },
  {
    id: 'display',
    title: 'Open Display Settings',
    subtitle: 'Resolution, refresh rate, brightness, and arrangement',
    url: 'x-apple.systempreferences:com.apple.Displays-Settings.extension',
    keywords: ['display', 'displays', 'screen', 'monitor', 'brightness', 'resolution']
  },
  {
    id: 'wallpaper',
    title: 'Open Wallpaper Settings',
    subtitle: 'Wallpaper and desktop background',
    url: 'x-apple.systempreferences:com.apple.Wallpaper-Settings.extension',
    keywords: ['wallpaper', 'background', 'desktop background']
  },
  {
    id: 'notifications',
    title: 'Open Notifications Settings',
    subtitle: 'Notification permissions and alert behavior',
    url: 'x-apple.systempreferences:com.apple.Notifications',
    keywords: ['notifications', 'notification', 'alerts']
  },
  {
    id: 'sound',
    title: 'Open Sound Settings',
    subtitle: 'Input, output, volume, and system sounds',
    url: 'x-apple.systempreferences:com.apple.Sound',
    keywords: ['sound', 'sounds', 'audio', 'volume', 'speaker', 'microphone']
  },
  {
    id: 'wifi',
    title: 'Open Wi-Fi Settings',
    subtitle: 'Wireless network settings',
    url: 'x-apple.systempreferences:com.apple.Wi-Fi-Settings.extension',
    keywords: ['wifi', 'wi-fi', 'wireless']
  },
  {
    id: 'bluetooth',
    title: 'Open Bluetooth Settings',
    subtitle: 'Bluetooth devices and pairing',
    url: 'x-apple.systempreferences:com.apple.BluetoothSettings',
    keywords: ['bluetooth', 'bt', 'airpods']
  },
  {
    id: 'network',
    title: 'Open Network Settings',
    subtitle: 'Network services, DNS, proxies, and interfaces',
    url: 'x-apple.systempreferences:com.apple.Network',
    keywords: ['network', 'ethernet', 'dns', 'proxy']
  },
  {
    id: 'battery',
    title: 'Open Battery Settings',
    subtitle: 'Battery usage, charging, and power mode',
    url: 'x-apple.systempreferences:com.apple.Battery',
    keywords: ['battery', 'power', 'charging', 'low power']
  },
  {
    id: 'lock-screen',
    title: 'Open Lock Screen Settings',
    subtitle: 'Sleep timing, password timing, and lock behavior',
    url: 'x-apple.systempreferences:com.apple.Lock',
    keywords: ['lock screen', 'screen lock', 'lock', 'password after sleep']
  },
  {
    id: 'spotlight',
    title: 'Open Spotlight Settings',
    subtitle: 'Search results, privacy, and indexing behavior',
    url: 'x-apple.systempreferences:com.apple.Spotlight',
    keywords: ['spotlight', 'search indexing', 'search privacy']
  },
  {
    id: 'keyboard',
    title: 'Open Keyboard Settings',
    subtitle: 'Keyboard behavior, text replacements, and shortcuts',
    url: 'x-apple.systempreferences:com.apple.Keyboard',
    keywords: ['keyboard', 'kb', 'keys', 'shortcuts', 'text replacements', 'input sources']
  },
  {
    id: 'trackpad',
    title: 'Open Trackpad Settings',
    subtitle: 'Trackpad gestures and pointer behavior',
    url: 'x-apple.systempreferences:com.apple.Trackpad',
    keywords: ['trackpad', 'gestures']
  },
  {
    id: 'mouse',
    title: 'Open Mouse Settings',
    subtitle: 'Mouse speed, gestures, and scrolling',
    url: 'x-apple.systempreferences:com.apple.Mouse',
    keywords: ['mouse', 'pointer speed', 'scroll direction']
  },
  {
    id: 'accessibility',
    title: 'Open Accessibility Settings',
    subtitle: 'Vision, hearing, motor, and interaction features',
    url: 'x-apple.systempreferences:com.apple.Accessibility',
    keywords: ['accessibility', 'voiceover', 'zoom', 'switch control', 'voice control']
  },
  {
    id: 'privacy-security',
    title: 'Open Privacy & Security Settings',
    subtitle: 'Permissions, FileVault, firewall, and security options',
    url: 'x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension',
    keywords: ['privacy', 'security', 'privacy & security', 'permissions', 'filevault', 'firewall']
  },
  {
    id: 'screen-time',
    title: 'Open Screen Time Settings',
    subtitle: 'Usage limits, downtime, and app limits',
    url: 'x-apple.systempreferences:com.apple.Screen-Time',
    keywords: ['screen time', 'downtime', 'app limits']
  },
  {
    id: 'siri',
    title: 'Open Siri Settings',
    subtitle: 'Siri, Apple Intelligence, and voice invocation',
    url: 'x-apple.systempreferences:com.apple.Siri',
    keywords: ['siri', 'apple intelligence', 'voice assistant']
  },
  {
    id: 'focus',
    title: 'Open Focus Settings',
    subtitle: 'Focus modes and notification filtering',
    url: 'x-apple.systempreferences:com.apple.Focus',
    keywords: ['focus', 'do not disturb']
  },
  {
    id: 'vpn',
    title: 'Open VPN Settings',
    subtitle: 'VPN profiles and network tunnels',
    url: 'x-apple.systempreferences:com.apple.Network',
    keywords: ['vpn', 'tunnel']
  }
];

function commandScore(query: string, keywords: string[]) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return 0;
  }

  let bestScore = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeSearchText(keyword);

    if (!normalizedKeyword) {
      continue;
    }

    if (normalizedKeyword === normalizedQuery) {
      bestScore = Math.max(bestScore, 188);
      continue;
    }

    if (normalizedQuery.length < 3) {
      continue;
    }

    if (normalizedKeyword.startsWith(normalizedQuery)) {
      bestScore = Math.max(bestScore, 166);
      continue;
    }

    if (normalizedKeyword.includes(normalizedQuery) || normalizedQuery.includes(normalizedKeyword)) {
      bestScore = Math.max(bestScore, 132);
    }
  }

  return bestScore;
}

export function buildSystemSettingsCommandResults(query: string): LauncherResult[] {
  return SYSTEM_SETTINGS_TARGETS
    .map((target) => ({
      target,
      score: commandScore(query, target.keywords)
    }))
    .filter((entry) => entry.score > 0)
    .map(({ target, score }) => ({
      id: `command:system-settings:${target.id}`,
      title: target.title,
      subtitle: target.subtitle,
      kind: 'command' as const,
      score,
      value: 'Command',
      icon: <IconSettings size={18} stroke={1.7} />,
      source: 'command' as const,
      preview: {
        title: target.title,
        subtitle: target.subtitle,
        body: `Opens the corresponding macOS System Settings destination.`,
        sections: [
          { label: 'Action', value: target.title.replace(/^Open /, '') },
          { label: 'Target', value: target.url }
        ]
      },
      actions: [
        resolveActionDescriptor(buildOpenSystemSettingsActionDescriptor(target.title, target.url))
      ]
    }));
}
