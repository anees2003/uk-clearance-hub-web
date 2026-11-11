import React, { useEffect, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { gsap, ScrollTrigger } from '../../animations/gsap';
import { getLenisInstance } from '../../animations/useLenis';
import { MODEL_URL } from '../../three/modelUrl';
import { useStudioProgress } from '../../three/StudioScene';
import {
  computeMonotonicProgress,
  formatPreloaderCounter,
} from '../../data/assemblyChapters';

// Ensure the GLB model is preloaded even if the user first visits a non-3D route
useGLTF.preload(MODEL_URL);

export const APP_READY_EVENT = 'app:ready';

let hasShownInitialPreloader = false;
let appReadyDispatched = false;

export function isAppReady(): boolean {
  return appReadyDispatched;
}

const WORDMARK_TEXT = 'UK Clearance Hub';

export const Preloader: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(() => !hasShownInitialPreloader);
  const [preloaderState, setPreloaderState] = useState<'loading' | 'exiting' | 'done'>(
    () => (hasShownInitialPreloader ? 'done' : 'loading')
  );

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const charsWrapperRef = useRef<HTMLHeadingElement | null>(null);
  const progressBarFillRef = useRef<HTMLDivElement | null>(null);
  const progressTrackRef = useRef<HTMLDivElement | null>(null);
  const counterInnerRef = useRef<HTMLSpanElement | null>(null);
  const eyebrowInnerRef = useRef<HTMLSpanElement | null>(null);

  const maxProgressRef = useRef<number>(0);
  const displayProgressObjRef = useRef<{ value: number }>({ value: 0 });
  const exitStartedRef = useRef<boolean>(false);

  const [fontsReady, setFontsReady] = useState<boolean>(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState<boolean>(false);
  const [glbReady, setGlbReady] = useState<boolean>(false);

  const { active, progress, loaded, total } = useStudioProgress();

  // Lock Lenis & document scrolling while the preloader is visible
  useEffect(() => {
    if (!isVisible) return;

    document.documentElement.style.overflow = 'hidden';
    getLenisInstance()?.stop();

    const lockInterval = window.setInterval(() => {
      if (!exitStartedRef.current) {
        getLenisInstance()?.stop();
      }
    }, 60);

    return () => {
      window.clearInterval(lockInterval);
      document.documentElement.style.overflow = '';
    };
  }, [isVisible]);

  // Initial entrance animation for the letter-by-letter wordmark, eyebrow, and counter
  useEffect(() => {
    if (!isVisible || !overlayRef.current) return;

    const ctx = gsap.context(() => {
      const charEls = charsWrapperRef.current
        ? Array.from(
            charsWrapperRef.current.querySelectorAll<HTMLElement>(
              '[data-preloader-char]'
            )
          )
        : [];

      gsap.set(overlayRef.current, {
        clipPath: 'inset(0% 0% 0% 0%)',
      });

      if (charEls.length > 0) {
        gsap.fromTo(
          charEls,
          { yPercent: 115 },
          {
            yPercent: 0,
            stagger: 0.024,
            duration: 0.75,
            ease: 'power3.out',
          }
        );
      }

      if (eyebrowInnerRef.current) {
        gsap.fromTo(
          eyebrowInnerRef.current,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 0.7,
            delay: 0.1,
            ease: 'power3.out',
          }
        );
      }

      if (counterInnerRef.current) {
        gsap.fromTo(
          counterInnerRef.current,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 0.7,
            delay: 0.1,
            ease: 'power3.out',
          }
        );
      }
    }, overlayRef);

    return () => ctx.revert();
  }, [isVisible]);

  // Track minimum 1.2s display time and document.fonts.ready
  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;

    const minTimer = window.setTimeout(() => {
      if (!cancelled) {
        setMinTimeElapsed(true);
      }
    }, 1200);

    // Fallback in case a non-3D route has 0 assets queued in THREE.DefaultLoadingManager
    const fallbackGlbTimer = window.setTimeout(() => {
      if (!cancelled && !active) {
        maxProgressRef.current = 100;
        setGlbReady(true);
      }
    }, 1800);

    const fontsPromise =
      typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready
        ? document.fonts.ready
        : Promise.resolve();

    fontsPromise.then(() => {
      if (!cancelled) {
        setFontsReady(true);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(minTimer);
      window.clearTimeout(fallbackGlbTimer);
    };
  }, [isVisible, active]);

  // Smoothly tween counter ("000" -> "100") and progress bar with real drei useProgress
  useEffect(() => {
    if (!isVisible) return;

    const monotonic = computeMonotonicProgress(
      maxProgressRef.current,
      progress,
      active,
      loaded,
      total
    );
    maxProgressRef.current = monotonic;

    gsap.to(displayProgressObjRef.current, {
      value: monotonic,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => {
        const currentVal = displayProgressObjRef.current.value;
        if (counterInnerRef.current) {
          counterInnerRef.current.textContent = formatPreloaderCounter(currentVal);
        }
        if (progressBarFillRef.current) {
          progressBarFillRef.current.style.transform = `scaleX(${Math.max(
            0,
            Math.min(1, currentVal / 100)
          )})`;
        }
      },
      onComplete: () => {
        if (monotonic >= 100) {
          setGlbReady(true);
        }
      },
    });

    if (monotonic >= 100 && !active) {
      setGlbReady(true);
    }
  }, [isVisible, active, progress, loaded, total]);

  // Trigger exit sequence once GLB is at 100%, document.fonts.ready resolved, and >= 1.2s elapsed
  useEffect(() => {
    if (
      !isVisible ||
      exitStartedRef.current ||
      !glbReady ||
      !fontsReady ||
      !minTimeElapsed
    ) {
      return;
    }

    exitStartedRef.current = true;
    hasShownInitialPreloader = true;

    const overlayEl = overlayRef.current;
    if (!overlayEl) return;

    const charEls = charsWrapperRef.current
      ? Array.from(
          charsWrapperRef.current.querySelectorAll<HTMLElement>(
            '[data-preloader-char]'
          )
        )
      : [];

    const tl = gsap.timeline({
      onComplete: () => {
        setPreloaderState('done');
        document.body.setAttribute('data-preloader-state', 'done');
        document.documentElement.style.overflow = '';
        getLenisInstance()?.start();
        ScrollTrigger.refresh();
        setIsVisible(false);
      },
    });

    // Ensure counter and bar finish at exact 100 before sliding up
    tl.to(displayProgressObjRef.current, {
      value: 100,
      duration: 0.2,
      ease: 'power2.out',
      onUpdate: () => {
        const currentVal = displayProgressObjRef.current.value;
        if (counterInnerRef.current) {
          counterInnerRef.current.textContent = formatPreloaderCounter(currentVal);
        }
        if (progressBarFillRef.current) {
          progressBarFillRef.current.style.transform = `scaleX(${Math.max(
            0,
            Math.min(1, currentVal / 100)
          )})`;
        }
      },
    });

    // Fire "app:ready" as the preloader exit begins so Home intro animations start
    tl.add(() => {
      setPreloaderState('exiting');
      document.body.setAttribute('data-preloader-state', 'exiting');
      document.body.setAttribute('data-app-ready', 'true');
      appReadyDispatched = true;
      window.dispatchEvent(new CustomEvent(APP_READY_EVENT));
    });

    // 1. Wordmark letters, progress track, eyebrow, and counter slide up out of their masks
    if (charEls.length > 0) {
      tl.to(
        charEls,
        {
          yPercent: -115,
          stagger: 0.015,
          duration: 0.45,
          ease: 'power3.inOut',
        },
        'exitText'
      );
    }

    if (progressTrackRef.current) {
      tl.to(
        progressTrackRef.current,
        {
          yPercent: -120,
          opacity: 0,
          duration: 0.4,
          ease: 'power3.inOut',
        },
        'exitText'
      );
    }

    if (eyebrowInnerRef.current) {
      tl.to(
        eyebrowInnerRef.current,
        {
          yPercent: -115,
          duration: 0.45,
          ease: 'power3.inOut',
        },
        'exitText'
      );
    }

    if (counterInnerRef.current) {
      tl.to(
        counterInnerRef.current,
        {
          yPercent: -115,
          duration: 0.45,
          ease: 'power3.inOut',
        },
        'exitText'
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
      '-=0.15'
    );
  }, [isVisible, glbReady, fontsReady, minTimeElapsed]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      data-testid="preloader-overlay"
      data-preloader-state={preloaderState}
      aria-label="Loading UK Clearance Hub showroom"
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#1C1C1E] text-[#F3EFE9] px-6 py-8 md:px-12 md:py-10 select-none"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
    >
      {/* Top spacer for vertical balance */}
      <div aria-hidden="true" className="h-6" />

      {/* Centre: Serif wordmark revealed letter by letter + thin ivory progress line */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div
          ref={charsWrapperRef}
          data-testid="preloader-wordmark"
          aria-label={WORDMARK_TEXT}
          className="font-serif text-[clamp(2.25rem,5vw,4.5rem)] font-normal tracking-[-0.01em] text-[#F3EFE9] leading-none"
        >
          {WORDMARK_TEXT.split('').map((char, idx) => (
            <span
              key={idx}
              className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em]"
            >
              <span
                data-preloader-char="true"
                className="inline-block will-change-transform"
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            </span>
          ))}
        </div>

        {/* Thin ivory progress line below wordmark */}
        <div className="mt-6 overflow-hidden w-56 sm:w-72">
          <div
            ref={progressTrackRef}
            className="h-px w-full bg-[#F3EFE9]/20 relative overflow-hidden"
          >
            <div
              ref={progressBarFillRef}
              data-testid="preloader-progress-line"
              className="h-full w-full bg-[#F3EFE9] origin-left will-change-transform"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Eyebrow on Bottom-Left, Large Tabular Counter on Bottom-Right */}
      <div className="flex items-end justify-between w-full">
        <div className="overflow-hidden">
          <span
            ref={eyebrowInnerRef}
            data-testid="preloader-eyebrow"
            className="block type-eyebrow text-[#F3EFE9]/70 will-change-transform"
          >
            Preparing your showroom
          </span>
        </div>

        <div className="overflow-hidden">
          <span
            ref={counterInnerRef}
            data-testid="preloader-counter"
            className="block font-sans text-[clamp(2.75rem,6vw,5.5rem)] font-normal leading-none tracking-[-0.03em] text-[#F3EFE9] tabular-nums will-change-transform"
          >
            000
          </span>
        </div>
      </div>
    </div>
  );
};
