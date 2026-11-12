export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'uk-clearance-hub-theme';
export const DEFAULT_THEME: ThemeMode = 'dark';

export interface ThemeSemanticPalette {
  bg: string;
  bgElevated: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  accent: string;
  accentHover: string;
  amber: string;
  navyDeep: string;
  success: string;
  focusRing: string;
}

export const THEME_PALETTES: Record<ThemeMode, ThemeSemanticPalette> = {
  dark: {
    bg: '#07090F',
    bgElevated: '#0D1220',
    surface: '#111827',
    surface2: '#172036',
    border: 'rgba(255,255,255,0.08)',
    text: '#F5F7FB',
    textMuted: '#9AA6C2',
    primary: '#16A5F4',
    primaryHover: '#3BB7FF',
    accent: '#FD7209',
    accentHover: '#FF8A2B',
    amber: '#FFC829',
    navyDeep: '#041C58',
    success: '#25D366',
    focusRing: '#16A5F4',
  },
  light: {
    bg: '#F6F8FC',
    bgElevated: '#EEF2F9',
    surface: '#FFFFFF',
    surface2: '#EEF2F9',
    border: 'rgba(4,28,88,0.10)',
    text: '#041C58',
    textMuted: '#5B6785',
    primary: '#1170D8',
    primaryHover: '#041C58',
    accent: '#FD7209',
    accentHover: '#E56300',
    amber: '#FFC829',
    navyDeep: '#041C58',
    success: '#25D366',
    focusRing: '#16A5F4',
  },
};

export interface Studio3DThemeConfig {
  backgroundHex: string;
  fogHex: string;
  floorHex: string;
  viewFloorHex: string;
  shadowMaterialOpacity: number;
  shadowMaterialColor: string;
  contactShadowOpacity: number;
  contactShadowColor: string;
  rimLightIntensity: number;
  topSoftboxIntensity: number;
  frontFillIntensity: number;
  bloomIntensity: number;
}

export const STUDIO_3D_THEME_CONFIG: Record<ThemeMode, Studio3DThemeConfig> = {
  dark: {
    backgroundHex: '#0B0F18',
    fogHex: '#0B0F18',
    floorHex: '#0B0F18',
    viewFloorHex: '#0D1220',
    shadowMaterialOpacity: 0.34,
    shadowMaterialColor: '#02040A',
    contactShadowOpacity: 0.72,
    contactShadowColor: '#02040A',
    rimLightIntensity: 1.95,
    topSoftboxIntensity: 2.25,
    frontFillIntensity: 1.05,
    bloomIntensity: 0.08,
  },
  light: {
    backgroundHex: '#F6F8FC',
    fogHex: '#F6F8FC',
    floorHex: '#F6F8FC',
    viewFloorHex: '#EEF2F9',
    shadowMaterialOpacity: 0.14,
    shadowMaterialColor: '#041C58',
    contactShadowOpacity: 0.55,
    contactShadowColor: '#041C58',
    rimLightIntensity: 1.35,
    topSoftboxIntensity: 2.0,
    frontFillIntensity: 0.85,
    bloomIntensity: 0.15,
  },
};

export function resolveInitialTheme(storedValue?: string | null): ThemeMode {
  if (storedValue === 'light' || storedValue === 'dark') {
    return storedValue;
  }
  return DEFAULT_THEME;
}

export function getNextTheme(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}

export function getThemeToggleAriaLabel(current: ThemeMode): string {
  return current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
}

export function computeCircularRevealRadius(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number
): number {
  const maxX = Math.max(x, Math.max(0, viewportWidth - x));
  const maxY = Math.max(y, Math.max(0, viewportHeight - y));
  return Math.hypot(maxX, maxY);
}
