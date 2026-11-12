import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * WCAG 2.2 AA Modal / Sheet / Menu focus trap hook:
 * 1. Captures the previously focused element when `isOpen` becomes true.
 * 2. Focuses the first focusable element inside `containerRef` (or the container itself).
 * 3. Traps Tab / Shift+Tab navigation inside `containerRef`.
 * 4. Invokes `onClose` when Escape is pressed.
 * 5. Restores focus to the original trigger element when `isOpen` becomes false.
 */
export function useModalFocusTrap(
  isOpen: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body) {
      previousFocusRef.current = active;
    }

    const container = containerRef.current;
    const focusTimer = window.setTimeout(() => {
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length > 0) {
        focusable[0]?.focus();
      } else {
        container.focus();
      }
    }, 30);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusable = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute('disabled'));

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!current || current === first || !containerRef.current.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (!current || current === last || !containerRef.current.contains(current)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      const prev = previousFocusRef.current;
      if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
        window.setTimeout(() => {
          try {
            prev.focus();
          } catch {
            // Ignore focus restoration errors
          }
        }, 10);
      }
    };
  }, [isOpen, containerRef]);
}
