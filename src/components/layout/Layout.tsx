import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { gsap, ScrollTrigger } from '../../animations/gsap';
import { useLenis } from '../../animations/useLenis';
import { useHasMountedSharedView } from '../../utils/studioProgressStore';
import { FilmGrain } from '../ui/FilmGrain';
import { FloatingWhatsAppButton } from '../ui/FloatingWhatsAppButton';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollToTop } from './ScrollToTop';
import { Preloader } from './Preloader';
import { CookieConsentBanner } from './CookieConsentBanner';

const LazySharedViewCanvas = lazy(() =>
  import('../../three/SharedViewCanvas').then((m) => ({
    default: m.SharedViewCanvas,
  }))
);

export const Layout: React.FC = () => {
  useLenis();
  const location = useLocation();
  const hasMountedSharedView = useHasMountedSharedView();
  const mainRef = useRef<HTMLElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const prevPathRef = useRef<string>(location.pathname);

  // Step 12 route transition (~520ms total): top sky-blue -> orange progress bar + smooth page fade/slide + ScrollTrigger refresh
  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;

    const mainEl = mainRef.current;
    const barEl = progressBarRef.current;
    if (!mainEl) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      const fadeTween = gsap.fromTo(
        mainEl,
        { opacity: 0.7 },
        {
          opacity: 1,
          duration: 0.25,
          ease: 'none',
          clearProps: 'opacity',
          onComplete: () => {
            ScrollTrigger.refresh();
          },
        }
      );
      return () => {
        fadeTween.kill();
      };
    }

    const tl = gsap.timeline({
      onComplete: () => {
        ScrollTrigger.refresh();
      },
    });

    if (barEl) {
      tl.set(barEl, {
        scaleX: 0,
        opacity: 1,
        transformOrigin: 'left center',
      })
        .to(
          barEl,
          {
            scaleX: 1,
            duration: 0.42,
            ease: 'power3.out',
          },
          0
        )
        .to(
          barEl,
          {
            opacity: 0,
            duration: 0.16,
            ease: 'power2.out',
          },
          0.4
        );
    }

    tl.fromTo(
      mainEl,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.52,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      },
      0.04
    );

    return () => {
      tl.kill();
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text relative">
      {/* WCAG 2.2 AA Skip to main content link */}
      <a
        href="#main-content"
        data-testid="skip-to-content-link"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[120] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-primary focus:text-white focus:font-heading focus:font-bold focus:text-sm focus:shadow-theme focus:outline-2 focus:outline-offset-2 focus:outline-amber"
      >
        Skip to main content
      </a>

      {/* Top Route Transition Progress Bar (Sky Blue -> Orange) */}
      <div
        ref={progressBarRef}
        data-testid="route-transition-bar"
        aria-hidden="true"
        className="fixed top-0 inset-x-0 z-50 h-[2.5px] bg-gradient-to-r from-primary via-primary to-accent pointer-events-none opacity-0 scale-x-0 origin-left"
      />
      <Preloader />
      <FilmGrain />
      <ScrollToTop />
      <Header />
      {hasMountedSharedView && (
        <Suspense fallback={null}>
          <LazySharedViewCanvas />
        </Suspense>
      )}
      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="flex-1 focus:outline-none"
      >
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="min-h-[65dvh] w-full bg-bg"
            />
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <FloatingWhatsAppButton />
      <CookieConsentBanner />
      <Footer />
    </div>
  );
};

