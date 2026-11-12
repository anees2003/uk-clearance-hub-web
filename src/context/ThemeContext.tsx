import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  ThemeMode,
  computeCircularRevealRadius,
  getNextTheme,
  getThemeToggleAriaLabel,
  resolveInitialTheme,
} from '../data/theme';

export interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: (event?: React.MouseEvent<HTMLElement>) => void;
  toggleAriaLabel: string;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
  toggleAriaLabel: getThemeToggleAriaLabel(DEFAULT_THEME),
});

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const domAttr = document.documentElement.getAttribute('data-theme');
    if (domAttr === 'dark' || domAttr === 'light') {
      return domAttr;
    }
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return resolveInitialTheme(raw);
  } catch {
    return DEFAULT_THEME;
  }
}

function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    applyThemeToDocument(next);
  }, []);

  const toggleTheme = useCallback(
    (event?: React.MouseEvent<HTMLElement>) => {
      const nextTheme = getNextTheme(theme);

      if (typeof document === 'undefined' || typeof window === 'undefined') {
        setTheme(nextTheme);
        return;
      }

      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Determine click origin (x, y) from toggle button centre or click coordinates
      let x = window.innerWidth / 2;
      let y = 32;
      if (event) {
        if (event.clientX > 0 || event.clientY > 0) {
          x = event.clientX;
          y = event.clientY;
        } else if (event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
      }

      const docWithVT = document as Document & {
        startViewTransition?: (callback: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
          skipTransition?: () => void;
        };
      };

      // Use View Transition circular clip-path reveal when supported on hardware-accelerated browsers
      const isSoftwareOrHeadless = (() => {
        if (typeof navigator !== 'undefined') {
          if (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent)) {
            return true;
          }
        }
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          if (!gl) return true;
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
          const gpu = String(gl.getParameter(param));
          gl.getExtension('WEBGL_lose_context')?.loseContext();
          return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        } catch {
          return false;
        }
      })();

      if (
        !prefersReducedMotion &&
        !isSoftwareOrHeadless &&
        typeof docWithVT.startViewTransition === 'function'
      ) {
        const endRadius = computeCircularRevealRadius(
          x,
          y,
          window.innerWidth,
          window.innerHeight
        );

        try {
          const root = document.documentElement;
          root.style.setProperty('--vt-x', `${x}px`);
          root.style.setProperty('--vt-y', `${y}px`);
          root.style.setProperty('--vt-r', `${endRadius}px`);

          const transition = docWithVT.startViewTransition(() => {
            flushSync(() => {
              setThemeState(nextTheme);
              applyThemeToDocument(nextTheme);
            });
          });

          const safetyTimer = window.setTimeout(() => {
            try {
              transition.skipTransition?.();
            } catch {
              // Ignore if already finished
            }
          }, 780);

          transition.finished
            .finally(() => {
              window.clearTimeout(safetyTimer);
            })
            .catch(() => {});

          transition.ready
            .then(() => {
              document.documentElement.animate(
                {
                  clipPath: [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${endRadius}px at ${x}px ${y}px)`,
                  ],
                },
                {
                  duration: 700,
                  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  pseudoElement: '::view-transition-new(root)',
                }
              );
            })
            .catch(() => {
              // Fallback if ViewTransition pseudoElement animation is interrupted
            });
          return;
        } catch {
          // Fall through to 250ms crossfade
        }
      }

      // Fallback where unsupported or prefers-reduced-motion: quick 250ms cross-fade
      const root = document.documentElement;
      root.setAttribute('data-theme-crossfade', 'true');
      setThemeState(nextTheme);
      applyThemeToDocument(nextTheme);
      window.setTimeout(() => {
        root.removeAttribute('data-theme-crossfade');
      }, 260);
    },
    [theme, setTheme]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      toggleAriaLabel: getThemeToggleAriaLabel(theme),
    }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
