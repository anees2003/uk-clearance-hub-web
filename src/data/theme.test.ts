import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_THEME,
  THEME_PALETTES,
  STUDIO_3D_THEME_CONFIG,
  resolveInitialTheme,
  getNextTheme,
  getThemeToggleAriaLabel,
  computeCircularRevealRadius,
} from './theme';
import {
  BRAND_LOGO_DARK_URL,
  BRAND_LOGO_LIGHT_URL,
  BRAND_ICON_URL,
  getBrandLogoUrl,
} from './brand';

test('resolveInitialTheme defaults to dark when storage is empty or invalid', () => {
  assert.equal(DEFAULT_THEME, 'dark');
  assert.equal(resolveInitialTheme(null), 'dark');
  assert.equal(resolveInitialTheme(undefined), 'dark');
  assert.equal(resolveInitialTheme('invalid'), 'dark');
  assert.equal(resolveInitialTheme('light'), 'light');
  assert.equal(resolveInitialTheme('dark'), 'dark');
});

test('getNextTheme and getThemeToggleAriaLabel alternate cleanly between dark and light', () => {
  assert.equal(getNextTheme('dark'), 'light');
  assert.equal(getNextTheme('light'), 'dark');
  assert.equal(getThemeToggleAriaLabel('dark'), 'Switch to light theme');
  assert.equal(getThemeToggleAriaLabel('light'), 'Switch to dark theme');
});

test('THEME_PALETTES match Step 9B exact dark and light tokens', () => {
  assert.equal(THEME_PALETTES.dark.bg, '#07090F');
  assert.equal(THEME_PALETTES.dark.bgElevated, '#0D1220');
  assert.equal(THEME_PALETTES.dark.surface, '#111827');
  assert.equal(THEME_PALETTES.dark.surface2, '#172036');
  assert.equal(THEME_PALETTES.dark.text, '#F5F7FB');
  assert.equal(THEME_PALETTES.dark.textMuted, '#9AA6C2');
  assert.equal(THEME_PALETTES.dark.primary, '#16A5F4');
  assert.equal(THEME_PALETTES.dark.primaryHover, '#3BB7FF');
  assert.equal(THEME_PALETTES.dark.accent, '#FD7209');
  assert.equal(THEME_PALETTES.dark.accentHover, '#FF8A2B');

  assert.equal(THEME_PALETTES.light.bg, '#F6F8FC');
  assert.equal(THEME_PALETTES.light.bgElevated, '#EEF2F9');
  assert.equal(THEME_PALETTES.light.surface, '#FFFFFF');
  assert.equal(THEME_PALETTES.light.surface2, '#EEF2F9');
  assert.equal(THEME_PALETTES.light.text, '#041C58');
  assert.equal(THEME_PALETTES.light.textMuted, '#5B6785');
  assert.equal(THEME_PALETTES.light.primary, '#1170D8');
  assert.equal(THEME_PALETTES.light.primaryHover, '#041C58');
  assert.equal(THEME_PALETTES.light.accent, '#FD7209');
  assert.equal(THEME_PALETTES.light.accentHover, '#E56300');
});

test('STUDIO_3D_THEME_CONFIG uses deep #0B0F18 studio in dark mode and #F6F8FC in light mode', () => {
  assert.equal(STUDIO_3D_THEME_CONFIG.dark.backgroundHex, '#0B0F18');
  assert.equal(STUDIO_3D_THEME_CONFIG.dark.floorHex, '#0B0F18');
  assert.ok(
    STUDIO_3D_THEME_CONFIG.dark.rimLightIntensity >
      STUDIO_3D_THEME_CONFIG.light.rimLightIntensity
  );
  assert.ok(
    STUDIO_3D_THEME_CONFIG.dark.bloomIntensity <
      STUDIO_3D_THEME_CONFIG.light.bloomIntensity
  );
  assert.equal(STUDIO_3D_THEME_CONFIG.light.backgroundHex, '#F6F8FC');
});

test('getBrandLogoUrl returns theme-specific logo URLs', () => {
  assert.equal(
    BRAND_LOGO_DARK_URL,
    'https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-logo-dark.png'
  );
  assert.equal(
    BRAND_LOGO_LIGHT_URL,
    'https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-logo.png'
  );
  assert.equal(
    BRAND_ICON_URL,
    'https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/uk-clearance-hub-icon.png'
  );
  assert.equal(getBrandLogoUrl('dark'), BRAND_LOGO_DARK_URL);
  assert.equal(getBrandLogoUrl('light'), BRAND_LOGO_LIGHT_URL);
});

test('computeCircularRevealRadius covers the farthest corner of the viewport', () => {
  const r = computeCircularRevealRadius(1350, 40, 1440, 900);
  assert.ok(r > 1550 && r < 1650);
});
