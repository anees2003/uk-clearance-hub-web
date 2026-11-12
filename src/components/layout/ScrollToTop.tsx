import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { getLenisInstance } from '../../animations/useLenis';
import { ScrollTrigger } from '../../animations/gsap';

export const DEALS_SCROLL_STORAGE_KEY = 'ukch_deals_scroll_y';

export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();

  // Continuously record scroll position while browsing /deals
  useEffect(() => {
    if (pathname !== '/deals') return;

    const handleScroll = () => {
      try {
        window.sessionStorage.setItem(
          DEALS_SCROLL_STORAGE_KEY,
          String(Math.round(window.scrollY))
        );
      } catch {
        // Ignore sessionStorage errors
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname, search]);

  useEffect(() => {
    const lenis = getLenisInstance();

    // Restore scroll position on browser back/forward (POP) to /deals
    if (pathname === '/deals' && navigationType === 'POP') {
      let targetY = 0;
      try {
        const saved = window.sessionStorage.getItem(DEALS_SCROLL_STORAGE_KEY);
        const parsed = saved ? Number(saved) : 0;
        if (Number.isFinite(parsed) && parsed > 0) {
          targetY = parsed;
        }
      } catch {
        targetY = 0;
      }

      if (targetY > 0) {
        requestAnimationFrame(() => {
          if (lenis) {
            lenis.scrollTo(targetY, { immediate: true });
          }
          window.scrollTo({
            top: targetY,
            left: 0,
            behavior: 'instant' as ScrollBehavior,
          });
          ScrollTrigger.refresh();
        });
        return;
      }
    }

    // Standard route change: scroll immediately to top
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    ScrollTrigger.refresh();
  }, [pathname, navigationType]);

  return null;
};
