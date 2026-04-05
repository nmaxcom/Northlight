import { describe, expect, it } from 'vitest';
import { buildSystemSettingsCommandResults } from './systemSettings';

describe('buildSystemSettingsCommandResults', () => {
  it('assigns native macOS bundle paths for representative pane icons', () => {
    expect(buildSystemSettingsCommandResults('wifi')[0]?.iconPath).toBe('/System/Library/ExtensionKit/Extensions/Wi-Fi.appex');
    expect(buildSystemSettingsCommandResults('privacy')[0]?.iconPath).toBe(
      '/System/Library/ExtensionKit/Extensions/SecurityPrivacyExtension.appex'
    );
    expect(buildSystemSettingsCommandResults('keyboard')[0]?.iconPath).toBe('/System/Library/ExtensionKit/Extensions/KeyboardSettings.appex');
  });

  it('falls back to the System Settings app icon for generic settings entry points', () => {
    expect(buildSystemSettingsCommandResults('settings')[0]?.iconPath).toBe('/System/Applications/System Settings.app');
    expect(buildSystemSettingsCommandResults('siri')[0]?.iconPath).toBe('/System/Applications/System Settings.app');
  });
});
