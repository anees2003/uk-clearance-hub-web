import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLenisInstance } from '../../animations/useLenis';
import { ScrollTrigger } from '../../animations/gsap';

export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const lenis = getLenisInstance();
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
};
