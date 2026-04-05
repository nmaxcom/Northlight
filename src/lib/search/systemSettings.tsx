import {
  IconAdjustments,
  IconBattery,
  IconBell,
  IconBluetooth,
  IconBulb,
  IconColorSwatch,
  IconDeviceDesktop,
  IconFocus2,
  IconKeyboard,
  IconLock,
  IconMenu2,
  IconMoon,
  IconNetwork,
  IconPalette,
  IconRosetteDiscountCheck,
  IconSearch,
  IconSettings,
  IconUserCircle,
  IconWallpaper,
  IconWifi
} from '@tabler/icons-react';
import { buildOpenSystemSettingsActionDescriptor, resolveActionDescriptor } from './actions';
import { normalizeSearchText } from './scoring';
import type { LauncherResult } from './types';

type SystemSettingsTarget = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  keywords: string[];
  icon: ReactNode;
  iconPath: string;
};

const SYSTEM_SETTINGS_APP_PATH = '/System/Applications/System Settings.app';
const SETTINGS_EXTENSION_ROOT = '/System/Library/ExtensionKit/Extensions';

const SYSTEM_SETTINGS_TARGETS: SystemSettingsTarget[] = [
  {
    id: 'system',
    title: 'Open System Settings',
    subtitle: 'macOS settings hub',
    url: 'x-apple.systempreferences:',
    keywords: ['settings', 'system settings', 'system preferences', 'preferences', 'mac settings', 'mac preferences'],
    icon: <IconSettings size={18} stroke={1.7} />,
    iconPath: SYSTEM_SETTINGS_APP_PATH
  },
  {
    id: 'apple-account',
    title: 'Open Apple Account Settings',
    subtitle: 'Apple ID, iCloud, media, and purchases',
    url: 'x-apple.systempreferences:com.apple.systempreferences.AppleIDSettings',
    keywords: ['apple account', 'apple id', 'icloud account', 'account'],
    icon: <IconUserCircle size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/AppleIDSettings.appex`
  },
  {
    id: 'general',
    title: 'Open General Settings',
    subtitle: 'About, Software Update, login items, sharing, and more',
    url: 'x-apple.systempreferences:com.apple.systempreferences.GeneralSettings',
    keywords: ['general', 'about mac', 'software update', 'login items', 'sharing'],
    icon: <IconAdjustments size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/AboutExtension.appex`
  },
  {
    id: 'appearance',
    title: 'Open Appearance Settings',
    subtitle: 'Accent color, theme, and sidebar appearance',
    url: 'x-apple.systempreferences:com.apple.Appearance-Settings.extension',
    keywords: ['appearance', 'theme', 'accent color'],
    icon: <IconPalette size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/Appearance.appex`
  },
  {
    id: 'control-center',
    title: 'Open Control Center Settings',
    subtitle: 'Menu bar and Control Center modules',
    url: 'x-apple.systempreferences:com.apple.ControlCenter',
    keywords: ['control center', 'menu bar'],
    icon: <IconMenu2 size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/ControlCenterSettings.appex`
  },
  {
    id: 'desktop-dock',
    title: 'Open Desktop & Dock Settings',
    subtitle: 'Dock behavior, Stage Manager, and window layout',
    url: 'x-apple.systempreferences:com.apple.Desktop-Settings.extension',
    keywords: ['desktop', 'dock', 'desktop & dock', 'stage manager'],
    icon: <IconDeviceDesktop size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/DesktopSettings.appex`
  },
  {
    id: 'display',
    title: 'Open Display Settings',
    subtitle: 'Resolution, refresh rate, brightness, and arrangement',
    url: 'x-apple.systempreferences:com.apple.Displays-Settings.extension',
    keywords: ['display', 'displays', 'screen', 'monitor', 'brightness', 'resolution'],
    icon: <IconDeviceDesktop size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/DisplaysExt.appex`
  },
  {
    id: 'wallpaper',
    title: 'Open Wallpaper Settings',
    subtitle: 'Wallpaper and desktop background',
    url: 'x-apple.systempreferences:com.apple.Wallpaper-Settings.extension',
    keywords: ['wallpaper', 'background', 'desktop background'],
    icon: <IconWallpaper size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/WallpaperIntentsExtension.appex`
  },
  {
    id: 'notifications',
    title: 'Open Notifications Settings',
    subtitle: 'Notification permissions and alert behavior',
    url: 'x-apple.systempreferences:com.apple.Notifications',
    keywords: ['notifications', 'notification', 'alerts'],
    icon: <IconBell size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/NotificationsSettingsIntents.appex`
  },
  {
    id: 'sound',
    title: 'Open Sound Settings',
    subtitle: 'Input, output, volume, and system sounds',
    url: 'x-apple.systempreferences:com.apple.Sound',
    keywords: ['sound', 'sounds', 'audio', 'volume', 'speaker', 'microphone'],
    icon: <IconBulb size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/Sound.appex`
  },
  {
    id: 'wifi',
    title: 'Open Wi-Fi Settings',
    subtitle: 'Wireless network settings',
    url: 'x-apple.systempreferences:com.apple.Wi-Fi-Settings.extension',
    keywords: ['wifi', 'wi-fi', 'wireless'],
    icon: <IconWifi size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/Wi-Fi.appex`
  },
  {
    id: 'bluetooth',
    title: 'Open Bluetooth Settings',
    subtitle: 'Bluetooth devices and pairing',
    url: 'x-apple.systempreferences:com.apple.BluetoothSettings',
    keywords: ['bluetooth', 'bt', 'airpods'],
    icon: <IconBluetooth size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/Bluetooth.appex`
  },
  {
    id: 'network',
    title: 'Open Network Settings',
    subtitle: 'Network services, DNS, proxies, and interfaces',
    url: 'x-apple.systempreferences:com.apple.Network',
    keywords: ['network', 'ethernet', 'dns', 'proxy'],
    icon: <IconNetwork size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/Network.appex`
  },
  {
    id: 'battery',
    title: 'Open Battery Settings',
    subtitle: 'Battery usage, charging, and power mode',
    url: 'x-apple.systempreferences:com.apple.Battery',
    keywords: ['battery', 'power', 'charging', 'low power'],
    icon: <IconBattery size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/BatterySettingsIntentsExtension.appex`
  },
  {
    id: 'lock-screen',
    title: 'Open Lock Screen Settings',
    subtitle: 'Sleep timing, password timing, and lock behavior',
    url: 'x-apple.systempreferences:com.apple.Lock',
    keywords: ['lock screen', 'screen lock', 'lock', 'password after sleep'],
    icon: <IconLock size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/LockScreen.appex`
  },
  {
    id: 'spotlight',
    title: 'Open Spotlight Settings',
    subtitle: 'Search results, privacy, and indexing behavior',
    url: 'x-apple.systempreferences:com.apple.Spotlight',
    keywords: ['spotlight', 'search indexing', 'search privacy'],
    icon: <IconSearch size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/SpotlightPreferenceExtension.appex`
  },
  {
    id: 'keyboard',
    title: 'Open Keyboard Settings',
    subtitle: 'Keyboard behavior, text replacements, and shortcuts',
    url: 'x-apple.systempreferences:com.apple.Keyboard',
    keywords: ['keyboard', 'kb', 'keys', 'shortcuts', 'text replacements', 'input sources'],
    icon: <IconKeyboard size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/KeyboardSettings.appex`
  },
  {
    id: 'trackpad',
    title: 'Open Trackpad Settings',
    subtitle: 'Trackpad gestures and pointer behavior',
    url: 'x-apple.systempreferences:com.apple.Trackpad',
    keywords: ['trackpad', 'gestures'],
    icon: <IconAdjustments size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/TrackpadExtension.appex`
  },
  {
    id: 'mouse',
    title: 'Open Mouse Settings',
    subtitle: 'Mouse speed, gestures, and scrolling',
    url: 'x-apple.systempreferences:com.apple.Mouse',
    keywords: ['mouse', 'pointer speed', 'scroll direction'],
    icon: <IconAdjustments size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/MouseExtension.appex`
  },
  {
    id: 'accessibility',
    title: 'Open Accessibility Settings',
    subtitle: 'Vision, hearing, motor, and interaction features',
    url: 'x-apple.systempreferences:com.apple.Accessibility',
    keywords: ['accessibility', 'voiceover', 'zoom', 'switch control', 'voice control'],
    icon: <IconAdjustments size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/AccessibilitySettingsExtension.appex`
  },
  {
    id: 'privacy-security',
    title: 'Open Privacy & Security Settings',
    subtitle: 'Permissions, FileVault, firewall, and security options',
    url: 'x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension',
    keywords: ['privacy', 'security', 'privacy & security', 'permissions', 'filevault', 'firewall'],
    icon: <IconLock size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/SecurityPrivacyExtension.appex`
  },
  {
    id: 'screen-time',
    title: 'Open Screen Time Settings',
    subtitle: 'Usage limits, downtime, and app limits',
    url: 'x-apple.systempreferences:com.apple.Screen-Time',
    keywords: ['screen time', 'downtime', 'app limits'],
    icon: <IconMoon size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/ScreenTimePreferencesExtension.appex`
  },
  {
    id: 'siri',
    title: 'Open Siri Settings',
    subtitle: 'Siri, Apple Intelligence, and voice invocation',
    url: 'x-apple.systempreferences:com.apple.Siri',
    keywords: ['siri', 'apple intelligence', 'voice assistant'],
    icon: <IconRosetteDiscountCheck size={18} stroke={1.7} />,
    iconPath: SYSTEM_SETTINGS_APP_PATH
  },
  {
    id: 'focus',
    title: 'Open Focus Settings',
    subtitle: 'Focus modes and notification filtering',
    url: 'x-apple.systempreferences:com.apple.Focus',
    keywords: ['focus', 'do not disturb'],
    icon: <IconFocus2 size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/FocusSettingsExtension.appex`
  },
  {
    id: 'vpn',
    title: 'Open VPN Settings',
    subtitle: 'VPN profiles and network tunnels',
    url: 'x-apple.systempreferences:com.apple.Network',
    keywords: ['vpn', 'tunnel'],
    icon: <IconColorSwatch size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/VPN.appex`
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
      icon: target.icon,
      iconPath: target.iconPath,
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
import type { ReactNode } from 'react';
