import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from '../../animations/gsap';
import { getLenisInstance } from '../../animations/useLenis';
import { useTheme } from '../../context/ThemeContext';
import { useStudioProgressSubscription } from '../../utils/studioProgressStore';
import { formatPreloaderCounter } from '../../data/assemblyChapters';
import { doesRouteWaitFor3DModel } from '../../data/homePageData';
import { getBrandLogoUrl } from '../../data/brand';
import { Container } from '../ui/Container';

export const APP_READY_EVENT = 'uk-clearance-hub:ready';

let hasPreloaderCompletedOnce = false;

export function isAppReady(): boolean {
  return hasPreloaderCompletedOnce;
}

export const Preloader: React.FC = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const waitFor3DModel = doesRouteWaitFor3DModel(location.pathname);

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        hasPreloaderCompletedOnce = true;
        return true;
      }
    }
    return hasPreloaderCompletedOnce;
  });

  const { progress, active, loaded, total } = useStudioProgressSubscription();

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const logoInnerRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const counterElRef = useRef<HTMLSpanElement | null>(null);
  const eyebrowInnerRef = useRef<HTMLSpanElement | null>(null);

  const [fontsReady, setFontsReady] = useState(false);
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  const [counterReached100, setCounterReached100] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const maxTargetRef = useRef(0);
  const tweenObjRef = useRef({ value: 0 });
  const isExitingRef = useRef(false);

  // Dispatch ready immediately if skipped via ?autostart=1 or already completed
  useEffect(() => {
    if (dismissed) {
      hasPreloaderCompletedOnce = true;
      window.dispatchEvent(new CustomEvent(APP_READY_EVENT));
    }
  }, [dismissed]);

  // Lock page scroll (body overflow + Lenis) while preloader is active
  // and wait for document.fonts.ready + 1.2s minimum display time
  useEffect(() => {
    if (dismissed) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    getLenisInstance()?.stop();

    let cancelled = false;

    const minTimer = window.setTimeout(() => {
      if (!cancelled) {
        setMinDelayPassed(true);
      }
    }, 1200);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready
        .then(() => {
          if (!cancelled) setFontsReady(true);
        })
        .catch(() => {
          if (!cancelled) setFontsReady(true);
        });
    } else {
      setFontsReady(true);
    }

    // Entrance animation for the centre full logo and bottom labels
    const ctx = gsap.context(() => {
      if (logoInnerRef.current) {
        gsap.fromTo(
          logoInnerRef.current,
          { yPercent: 105 },
          {
            yPercent: 0,
            duration: 0.85,
            ease: 'power3.out',
          }
        );
      }
      if (eyebrowInnerRef.current) {
        gsap.fromTo(
          eyebrowInnerRef.current,
          { yPercent: 105 },
          {
            yPercent: 0,
            duration: 0.7,
            delay: 0.12,
            ease: 'power3.out',
          }
        );
      }
    }, overlayRef);

    return () => {
      cancelled = true;
      window.clearTimeout(minTimer);
      ctx.revert();
      document.body.style.overflow = prevOverflow;
    };
  }, [dismissed]);

  // Smoothly tween counter 000 -> 100:
  // On 3D showroom pages (/home-living, etc.), driven by real drei useProgress.
  // On the homepage (/) and non-3D pages, does not wait for the 3D model — tweens smoothly to 100 immediately.
  useEffect(() => {
    if (dismissed) return;

    let rawTarget: number;
    if (!waitFor3DModel) {
      rawTarget = 100;
    } else {
      const glbFinished =
        !active && (progress >= 100 || (total > 0 && loaded >= total));
      rawTarget = glbFinished ? 100 : Math.min(99, Math.max(0, progress));
    }

    // Never jump backwards
    const nextTarget = Math.max(maxTargetRef.current, rawTarget);
    maxTargetRef.current = nextTarget;

    gsap.to(tweenObjRef.current, {
      value: nextTarget,
      duration: waitFor3DModel ? 0.55 : 0.85,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => {
        const v = tweenObjRef.current.value;
        if (counterElRef.current) {
          counterElRef.current.textContent = formatPreloaderCounter(v);
        }
        if (progressFillRef.current) {
          progressFillRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, v / 100))})`;
        }
        if (v >= 99.9) {
          setCounterReached100(true);
        }
      },
      onComplete: () => {
        if (tweenObjRef.current.value >= 99.9) {
          setCounterReached100(true);
        }
      },
    });
  }, [progress, active, loaded, total, dismissed, waitFor3DModel]);

  // Safety fallback if a 3D route has 0 active items in useProgress
  useEffect(() => {
    if (dismissed) return;
    const fallbackTimer = window.setTimeout(() => {
      if (!active && total === 0 && maxTargetRef.current < 100) {
        maxTargetRef.current = 100;
        gsap.to(tweenObjRef.current, {
          value: 100,
          duration: 0.6,
          ease: 'power2.out',
          onUpdate: () => {
            const v = tweenObjRef.current.value;
            if (counterElRef.current) {
              counterElRef.current.textContent = formatPreloaderCounter(v);
            }
            if (progressFillRef.current) {
              progressFillRef.current.style.transform = `scaleX(${v / 100})`;
            }
          },
          onComplete: () => setCounterReached100(true),
        });
      }
    }, 800);
    return () => window.clearTimeout(fallbackTimer);
  }, [active, total, dismissed]);

  // Exit choreography once GLB is at 100%, fonts are ready, and >= 1.2s has elapsed
  useEffect(() => {
    if (dismissed || isExitingRef.current) return;
    if (!counterReached100 || !fontsReady || !minDelayPassed) return;

    isExitingRef.current = true;

    const overlayEl = overlayRef.current;
    if (!overlayEl) {
      hasPreloaderCompletedOnce = true;
      document.body.style.overflow = '';
      getLenisInstance()?.start();
      setDismissed(true);
      window.dispatchEvent(new CustomEvent(APP_READY_EVENT));
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        hasPreloaderCompletedOnce = true;
        document.body.style.overflow = '';
        getLenisInstance()?.start();
        setDismissed(true);
        window.dispatchEvent(new CustomEvent(APP_READY_EVENT));
      },
    });

    // 1. Logo, eyebrow, and counter slide up out of their masks
    if (logoInnerRef.current) {
      tl.to(
        logoInnerRef.current,
        {
          yPercent: -115,
          duration: 0.55,
          ease: 'power3.inOut',
        },
        0
      );
    }

    if (counterElRef.current) {
      tl.to(
        counterElRef.current,
        {
          yPercent: -115,
          duration: 0.5,
          ease: 'power3.inOut',
        },
        0.04
      );
    }

    if (eyebrowInnerRef.current) {
      tl.to(
        eyebrowInnerRef.current,
        {
          yPercent: -115,
          duration: 0.5,
          ease: 'power3.inOut',
        },
        0.04
      );
    }

    if (progressFillRef.current?.parentElement) {
      tl.to(
        progressFillRef.current.parentElement,
        {
          opacity: 0,
          duration: 0.35,
          ease: 'power2.out',
        },
        0.15
      );
    }

    // 2. Whole overlay wipes upwards (clip-path inset from bottom, ease "expo.inOut", 1.1s)
    tl.fromTo(
      overlayEl,
      { clipPath: 'inset(0% 0% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.1,
        ease: 'expo.inOut',
      },
      0.38
    );
  }, [counterReached100, fontsReady, minDelayPassed, dismissed]);

  if (dismissed) {
    return null;
  }

  const activeLogoUrl = getBrandLogoUrl(theme);

  return (
    <div
      ref={overlayRef}
      data-testid="preloader-overlay"
      data-theme={theme}
      aria-label="Loading UK Clearance Hub showroom"
      className="fixed inset-0 z-[100] bg-bg text-text py-6 sm:py-10 md:py-12 select-none bg-hero-glow"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
    >
      <Container className="h-full flex flex-col justify-between">
        {/* Top spacer to keep logo optically centred */}
        <div aria-hidden="true" className="h-6" />

        {/* Centre: Full UK Clearance Hub Logo revealed with an overflow mask + thin accent progress line */}
        <div className="flex flex-col items-center justify-center my-auto">
          <div
            data-testid="preloader-wordmark"
            className="overflow-hidden py-2 px-4"
          >
            <div
              ref={logoInnerRef}
              className="flex flex-col items-center gap-3 will-change-transform"
            >
              {!logoError ? (
                <img
                  src={activeLogoUrl}
                  alt="UK Clearance Hub"
                  width={220}
                  height={140}
                  decoding="async"
                  onError={() => setLogoError(true)}
                  className="h-20 sm:h-24 md:h-28 w-auto object-contain"
                />
              ) : (
                <span className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.02em] whitespace-nowrap">
                  <span className="text-text">UK Clearance </span>
                  <span className="text-accent">Hub</span>
                </span>
              )}
            </div>
          </div>

          {/* Thin orange progress line growing with real loading progress */}
          <div className="mt-6 w-52 sm:w-64 md:w-72 h-[3px] bg-border-strong rounded-full overflow-hidden">
            <div
              ref={progressFillRef}
              data-testid="preloader-progress-line"
              className="h-full w-full bg-accent origin-left will-change-transform"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </div>

        {/* Bottom Row: Left Eyebrow + Right Large Tabular Counter 000 -> 100 */}
        <div className="flex items-end justify-between w-full">
          <div className="overflow-hidden py-1">
            <span
              ref={eyebrowInnerRef}
              data-testid="preloader-eyebrow"
              className="block type-eyebrow text-muted"
            >
              Preparing your showroom
            </span>
          </div>

          <div className="overflow-hidden py-1">
            <span
              ref={counterElRef}
              data-testid="preloader-counter"
              className="block font-sans font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight text-text tabular-nums leading-none"
            >
              000
            </span>
          </div>
        </div>
      </Container>
    </div>
  );
};
