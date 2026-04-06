import {
  IconAdjustments,
  IconBattery,
  IconBell,
  IconBluetooth,
  IconBulb,
  IconHandStop,
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
import { renderToStaticMarkup } from 'react-dom/server';
import { buildOpenSystemSettingsActionDescriptor, resolveActionDescriptor } from './actions';
import { normalizeSearchText } from './scoring';
import type { LauncherResult } from './types';
import type { ComponentType, ReactNode } from 'react';

type SystemSettingsTarget = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  keywords: string[];
  icon: ReactNode;
  iconPath: string;
  iconUrl: string;
};

const SYSTEM_SETTINGS_APP_PATH = '/System/Applications/System Settings.app';
const SETTINGS_EXTENSION_ROOT = '/System/Library/ExtensionKit/Extensions';

type SystemSettingsIconRecipe = {
  iconComponent: ComponentType<{ size?: number | string; stroke?: number | string; color?: string }>;
  background: string;
  strokeWidth?: number;
};

function buildSystemSettingsIconUrl({ iconComponent: IconComponent, background, strokeWidth = 2.25 }: SystemSettingsIconRecipe) {
  const iconSvg = renderToStaticMarkup(<IconComponent size={30} stroke={strokeWidth} color="#ffffff" />);
  const encoded = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="bg" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${background}"/>
          <stop offset="1" stop-color="${background}CC"/>
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="16" fill="url(#bg)"/>
      <g transform="translate(17 17)">${iconSvg}</g>
    </svg>`
  );

  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

const SYSTEM_SETTINGS_ICON_RECIPES: Record<string, SystemSettingsIconRecipe> = {
  system: { iconComponent: IconSettings, background: '#7D8A96' },
  'apple-account': { iconComponent: IconUserCircle, background: '#6B7280' },
  general: { iconComponent: IconAdjustments, background: '#6B7280' },
  appearance: { iconComponent: IconPalette, background: '#6B7280' },
  'control-center': { iconComponent: IconMenu2, background: '#6B7280' },
  'desktop-dock': { iconComponent: IconDeviceDesktop, background: '#4B83F5' },
  display: { iconComponent: IconDeviceDesktop, background: '#4B83F5' },
  wallpaper: { iconComponent: IconWallpaper, background: '#38BDF8' },
  notifications: { iconComponent: IconBell, background: '#EF4444' },
  sound: { iconComponent: IconBulb, background: '#EF4444' },
  wifi: { iconComponent: IconWifi, background: '#4B83F5' },
  bluetooth: { iconComponent: IconBluetooth, background: '#4B83F5' },
  network: { iconComponent: IconNetwork, background: '#4B83F5' },
  battery: { iconComponent: IconBattery, background: '#22C55E' },
  'lock-screen': { iconComponent: IconLock, background: '#6B7280' },
  spotlight: { iconComponent: IconSearch, background: '#6B7280' },
  keyboard: { iconComponent: IconKeyboard, background: '#6B7280' },
  trackpad: { iconComponent: IconAdjustments, background: '#6B7280' },
  mouse: { iconComponent: IconAdjustments, background: '#6B7280' },
  accessibility: { iconComponent: IconAdjustments, background: '#4B83F5' },
  'privacy-security': { iconComponent: IconHandStop, background: '#4B83F5', strokeWidth: 2.1 },
  'screen-time': { iconComponent: IconMoon, background: '#7C3AED' },
  siri: { iconComponent: IconRosetteDiscountCheck, background: '#F43F5E' },
  focus: { iconComponent: IconFocus2, background: '#7C3AED' },
  vpn: { iconComponent: IconColorSwatch, background: '#4B83F5' }
};

function systemSettingsIconUrl(id: string) {
  return buildSystemSettingsIconUrl(SYSTEM_SETTINGS_ICON_RECIPES[id] ?? SYSTEM_SETTINGS_ICON_RECIPES.system);
}

const SYSTEM_SETTINGS_TARGETS: SystemSettingsTarget[] = [
  {
    id: 'system',
    title: 'Open System Settings',
    subtitle: 'macOS settings hub',
    url: 'x-apple.systempreferences:',
    keywords: ['settings', 'system settings', 'system preferences', 'preferences', 'mac settings', 'mac preferences'],
    icon: <IconSettings size={18} stroke={1.7} />,
    iconPath: SYSTEM_SETTINGS_APP_PATH,
    iconUrl: systemSettingsIconUrl('system')
  },
  {
    id: 'apple-account',
    title: 'Open Apple Account Settings',
    subtitle: 'Apple ID, iCloud, media, and purchases',
    url: 'x-apple.systempreferences:com.apple.systempreferences.AppleIDSettings',
    keywords: ['apple account', 'apple id', 'icloud account', 'account'],
    icon: <IconUserCircle size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/AppleIDSettings.appex`,
    iconUrl: systemSettingsIconUrl('apple-account')
  },
  {
    id: 'general',
    title: 'Open General Settings',
    subtitle: 'About, Software Update, login items, sharing, and more',
    url: 'x-apple.systempreferences:com.apple.systempreferences.GeneralSettings',
    keywords: ['general', 'about mac', 'software update', 'login items', 'sharing'],
    icon: <IconAdjustments size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/AboutExtension.appex`,
    iconUrl: systemSettingsIconUrl('general')
  },
  {
    id: 'appearance',
    title: 'Open Appearance Settings',
    subtitle: 'Accent color, theme, and sidebar appearance',
    url: 'x-apple.systempreferences:com.apple.Appearance-Settings.extension',
    keywords: ['appearance', 'theme', 'accent color'],
    icon: <IconPalette size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/Appearance.appex`,
    iconUrl: systemSettingsIconUrl('appearance')
  },
  {
    id: 'control-center',
    title: 'Open Control Center Settings',
    subtitle: 'Menu bar and Control Center modules',
    url: 'x-apple.systempreferences:com.apple.ControlCenter',
    keywords: ['control center', 'menu bar'],
    icon: <IconMenu2 size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/ControlCenterSettings.appex`,
    iconUrl: systemSettingsIconUrl('control-center')
  },
  {
    id: 'desktop-dock',
    title: 'Open Desktop & Dock Settings',
    subtitle: 'Dock behavior, Stage Manager, and window layout',
    url: 'x-apple.systempreferences:com.apple.Desktop-Settings.extension',
    keywords: ['desktop', 'dock', 'desktop & dock', 'stage manager'],
    icon: <IconDeviceDesktop size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/DesktopSettings.appex`,
    iconUrl: systemSettingsIconUrl('desktop-dock')
  },
  {
    id: 'display',
    title: 'Open Display Settings',
    subtitle: 'Resolution, refresh rate, brightness, and arrangement',
    url: 'x-apple.systempreferences:com.apple.Displays-Settings.extension',
    keywords: ['display', 'displays', 'screen', 'monitor', 'brightness', 'resolution'],
    icon: <IconDeviceDesktop size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/DisplaysExt.appex`,
    iconUrl: systemSettingsIconUrl('display')
  },
  {
    id: 'wallpaper',
    title: 'Open Wallpaper Settings',
    subtitle: 'Wallpaper and desktop background',
    url: 'x-apple.systempreferences:com.apple.Wallpaper-Settings.extension',
    keywords: ['wallpaper', 'background', 'desktop background'],
    icon: <IconWallpaper size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/WallpaperIntentsExtension.appex`,
    iconUrl: systemSettingsIconUrl('wallpaper')
  },
  {
    id: 'notifications',
    title: 'Open Notifications Settings',
    subtitle: 'Notification permissions and alert behavior',
    url: 'x-apple.systempreferences:com.apple.Notifications',
    keywords: ['notifications', 'notification', 'alerts'],
    icon: <IconBell size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/NotificationsSettingsIntents.appex`,
    iconUrl: systemSettingsIconUrl('notifications')
  },
  {
    id: 'sound',
    title: 'Open Sound Settings',
    subtitle: 'Input, output, volume, and system sounds',
    url: 'x-apple.systempreferences:com.apple.Sound',
    keywords: ['sound', 'sounds', 'audio', 'volume', 'speaker', 'microphone'],
    icon: <IconBulb size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/Sound.appex`,
    iconUrl: systemSettingsIconUrl('sound')
  },
  {
    id: 'wifi',
    title: 'Open Wi-Fi Settings',
    subtitle: 'Wireless network settings',
    url: 'x-apple.systempreferences:com.apple.Wi-Fi-Settings.extension',
    keywords: ['wifi', 'wi-fi', 'wireless'],
    icon: <IconWifi size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/Wi-Fi.appex`,
    iconUrl: systemSettingsIconUrl('wifi')
  },
  {
    id: 'bluetooth',
    title: 'Open Bluetooth Settings',
    subtitle: 'Bluetooth devices and pairing',
    url: 'x-apple.systempreferences:com.apple.BluetoothSettings',
    keywords: ['bluetooth', 'bt', 'airpods'],
    icon: <IconBluetooth size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/Bluetooth.appex`,
    iconUrl: systemSettingsIconUrl('bluetooth')
  },
  {
    id: 'network',
    title: 'Open Network Settings',
    subtitle: 'Network services, DNS, proxies, and interfaces',
    url: 'x-apple.systempreferences:com.apple.Network',
    keywords: ['network', 'ethernet', 'dns', 'proxy'],
    icon: <IconNetwork size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/Network.appex`,
    iconUrl: systemSettingsIconUrl('network')
  },
  {
    id: 'battery',
    title: 'Open Battery Settings',
    subtitle: 'Battery usage, charging, and power mode',
    url: 'x-apple.systempreferences:com.apple.Battery',
    keywords: ['battery', 'power', 'charging', 'low power'],
    icon: <IconBattery size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/BatterySettingsIntentsExtension.appex`,
    iconUrl: systemSettingsIconUrl('battery')
  },
  {
    id: 'lock-screen',
    title: 'Open Lock Screen Settings',
    subtitle: 'Sleep timing, password timing, and lock behavior',
    url: 'x-apple.systempreferences:com.apple.Lock',
    keywords: ['lock screen', 'screen lock', 'lock', 'password after sleep'],
    icon: <IconLock size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/LockScreen.appex`,
    iconUrl: systemSettingsIconUrl('lock-screen')
  },
  {
    id: 'spotlight',
    title: 'Open Spotlight Settings',
    subtitle: 'Search results, privacy, and indexing behavior',
    url: 'x-apple.systempreferences:com.apple.Spotlight',
    keywords: ['spotlight', 'search indexing', 'indexing'],
    icon: <IconSearch size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/SpotlightPreferenceExtension.appex`,
    iconUrl: systemSettingsIconUrl('spotlight')
  },
  {
    id: 'keyboard',
    title: 'Open Keyboard Settings',
    subtitle: 'Keyboard behavior, text replacements, and shortcuts',
    url: 'x-apple.systempreferences:com.apple.Keyboard',
    keywords: ['keyboard', 'kb', 'keys', 'shortcuts', 'text replacements', 'input sources'],
    icon: <IconKeyboard size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/KeyboardSettings.appex`,
    iconUrl: systemSettingsIconUrl('keyboard')
  },
  {
    id: 'trackpad',
    title: 'Open Trackpad Settings',
    subtitle: 'Trackpad gestures and pointer behavior',
    url: 'x-apple.systempreferences:com.apple.Trackpad',
    keywords: ['trackpad', 'gestures'],
    icon: <IconAdjustments size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/TrackpadExtension.appex`,
    iconUrl: systemSettingsIconUrl('trackpad')
  },
  {
    id: 'mouse',
    title: 'Open Mouse Settings',
    subtitle: 'Mouse speed, gestures, and scrolling',
    url: 'x-apple.systempreferences:com.apple.Mouse',
    keywords: ['mouse', 'pointer speed', 'scroll direction'],
    icon: <IconAdjustments size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/MouseExtension.appex`,
    iconUrl: systemSettingsIconUrl('mouse')
  },
  {
    id: 'accessibility',
    title: 'Open Accessibility Settings',
    subtitle: 'Vision, hearing, motor, and interaction features',
    url: 'x-apple.systempreferences:com.apple.Accessibility',
    keywords: ['accessibility', 'voiceover', 'zoom', 'switch control', 'voice control'],
    icon: <IconAdjustments size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/AccessibilitySettingsExtension.appex`,
    iconUrl: systemSettingsIconUrl('accessibility')
  },
  {
    id: 'privacy-security',
    title: 'Open Privacy & Security Settings',
    subtitle: 'Permissions, FileVault, firewall, and security options',
    url: 'x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension',
    keywords: ['privacy', 'security', 'privacy & security', 'permissions', 'filevault', 'firewall'],
    icon: <IconLock size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/SecurityPrivacyExtension.appex`,
    iconUrl: systemSettingsIconUrl('privacy-security')
  },
  {
    id: 'screen-time',
    title: 'Open Screen Time Settings',
    subtitle: 'Usage limits, downtime, and app limits',
    url: 'x-apple.systempreferences:com.apple.Screen-Time',
    keywords: ['screen time', 'downtime', 'app limits'],
    icon: <IconMoon size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/ScreenTimePreferencesExtension.appex`,
    iconUrl: systemSettingsIconUrl('screen-time')
  },
  {
    id: 'siri',
    title: 'Open Siri Settings',
    subtitle: 'Siri, Apple Intelligence, and voice invocation',
    url: 'x-apple.systempreferences:com.apple.Siri',
    keywords: ['siri', 'apple intelligence', 'voice assistant'],
    icon: <IconRosetteDiscountCheck size={18} stroke={1.7} />,
    iconPath: SYSTEM_SETTINGS_APP_PATH,
    iconUrl: systemSettingsIconUrl('siri')
  },
  {
    id: 'focus',
    title: 'Open Focus Settings',
    subtitle: 'Focus modes and notification filtering',
    url: 'x-apple.systempreferences:com.apple.Focus',
    keywords: ['focus', 'do not disturb'],
    icon: <IconFocus2 size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/FocusSettingsExtension.appex`,
    iconUrl: systemSettingsIconUrl('focus')
  },
  {
    id: 'vpn',
    title: 'Open VPN Settings',
    subtitle: 'VPN profiles and network tunnels',
    url: 'x-apple.systempreferences:com.apple.Network',
    keywords: ['vpn', 'tunnel'],
    icon: <IconColorSwatch size={18} stroke={1.7} />,
    iconPath: `${SETTINGS_EXTENSION_ROOT}/VPN.appex`,
    iconUrl: systemSettingsIconUrl('vpn')
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
      iconUrl: target.iconUrl,
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
