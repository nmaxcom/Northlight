import { describe, expect, it } from 'vitest';
import { buildSystemSettingsCommandResults } from './systemSettings';

describe('buildSystemSettingsCommandResults', () => {
  it('assigns native macOS bundle paths for representative pane icons', () => {
    const wifi = buildSystemSettingsCommandResults('wifi')[0];
    const privacy = buildSystemSettingsCommandResults('privacy')[0];
    const keyboard = buildSystemSettingsCommandResults('keyboard')[0];

    expect(wifi?.iconPath).toBe('/System/Library/ExtensionKit/Extensions/Wi-Fi.appex');
    expect(wifi?.iconUrl).toMatch(/^data:image\/svg\+xml/);
    expect(privacy?.iconPath).toBe(
      '/System/Library/ExtensionKit/Extensions/SecurityPrivacyExtension.appex'
    );
    expect(privacy?.iconUrl).toMatch(/^data:image\/svg\+xml/);
    expect(keyboard?.iconPath).toBe('/System/Library/ExtensionKit/Extensions/KeyboardSettings.appex');
    expect(keyboard?.iconUrl).toMatch(/^data:image\/svg\+xml/);
  });

  it('falls back to the System Settings app icon for generic settings entry points', () => {
    const settings = buildSystemSettingsCommandResults('settings')[0];
    const siri = buildSystemSettingsCommandResults('siri')[0];

    expect(settings?.iconPath).toBe('/System/Applications/System Settings.app');
    expect(settings?.iconUrl).toMatch(/^data:image\/svg\+xml/);
    expect(siri?.iconPath).toBe('/System/Applications/System Settings.app');
    expect(siri?.iconUrl).toMatch(/^data:image\/svg\+xml/);
  });
});
