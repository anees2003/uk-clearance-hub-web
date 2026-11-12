import React, { RefObject, useEffect, useState } from 'react';
import { ScrollTrigger } from '../../animations/gsap';
import { getLenisInstance } from '../../animations/useLenis';
import {
  CHAPTER_PROGRESS_STOPS,
  ChapterProgressState,
  computeChapterProgressState,
} from '../../data/assemblyChapters';

export interface ChapterProgressProps {
  chaptersWrapperRef: RefObject<HTMLElement | null>;
}

export const ChapterProgress: React.FC<ChapterProgressProps> = ({
  chaptersWrapperRef,
}) => {
  const [progressState, setProgressState] = useState<ChapterProgressState>(() => ({
    isVisible: false,
    fillProgress: 0,
    activeStopIndex: 0,
    activeStopId: CHAPTER_PROGRESS_STOPS[0].id,
  }));

  useEffect(() => {
    const updateFromScroll = () => {
      const wrapper = chaptersWrapperRef.current;
      if (!wrapper || typeof window === 'undefined') return;

      const rect = wrapper.getBoundingClientRect();
      const wrapperTopDocY = rect.top + window.scrollY;
      const nextState = computeChapterProgressState(
        window.scrollY,
        wrapperTopDocY,
        window.innerHeight
      );

      setProgressState((prev) => {
        if (
          prev.isVisible === nextState.isVisible &&
          prev.activeStopIndex === nextState.activeStopIndex &&
          Math.abs(prev.fillProgress - nextState.fillProgress) < 0.002
        ) {
          return prev;
        }
        return nextState;
      });
    };

    updateFromScroll();

    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', updateFromScroll, { passive: true });
    ScrollTrigger.addEventListener('refresh', updateFromScroll);

    return () => {
      window.removeEventListener('scroll', updateFromScroll);
      window.removeEventListener('resize', updateFromScroll);
      ScrollTrigger.removeEventListener('refresh', updateFromScroll);
    };
  }, [chaptersWrapperRef]);

  const handleStopClick = (chapterId: string) => {
    const targetEl = document.getElementById(chapterId);
    if (!targetEl) return;

    const lenis = getLenisInstance();
    if (lenis) {
      lenis.scrollTo(targetEl, { duration: 1.6 });
    } else {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Mobile / Tablet (<1024px): Thin 2px progress line along the top of the screen */}
      <div
        data-testid="chapter-progress-mobile"
        data-visible={progressState.isVisible ? 'true' : 'false'}
        aria-hidden="true"
        className={`fixed top-0 left-0 right-0 z-50 h-[2px] bg-border-strong lg:hidden pointer-events-none transition-opacity duration-300 ${
          progressState.isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          data-testid="chapter-progress-mobile-fill"
          className="h-full w-full bg-accent origin-left will-change-transform"
          style={{ transform: `scaleX(${progressState.fillProgress})` }}
        />
      </div>

      {/* Desktop (>=1024px): Fixed right-edge vertically centred chapter progress bar (>= 24px from edge) */}
      <nav
        aria-label="Bed assembly chapters"
        data-testid="chapter-progress-desktop"
        data-visible={progressState.isVisible ? 'true' : 'false'}
        data-active-stop={progressState.activeStopId}
        className={`hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 items-stretch transition-opacity duration-500 ${
          progressState.isVisible
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative flex flex-col justify-between py-0.5 pr-3">
          {CHAPTER_PROGRESS_STOPS.map((stop, idx) => {
            const isActive =
              progressState.isVisible && progressState.activeStopIndex === idx;

            return (
              <button
                key={stop.id}
                type="button"
                data-testid={`chapter-progress-stop-${stop.id}`}
                data-active={isActive ? 'true' : 'false'}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => handleStopClick(stop.id)}
                className={`group flex items-center justify-end gap-2.5 py-2 text-right font-sans text-[0.625rem] uppercase tracking-[0.2em] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                  isActive
                    ? 'text-text font-bold opacity-100'
                    : 'text-muted hover:text-text'
                }`}
              >
                <span className="whitespace-nowrap">{stop.label}</span>
                <span
                  aria-hidden="true"
                  className={`block rounded-full transition-transform duration-300 ${
                    isActive
                      ? 'w-2 h-2 bg-accent scale-125'
                      : 'w-1.5 h-1.5 bg-muted/60 scale-100 group-hover:bg-primary'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Thin vertical track line with filled primary progress */}
        <div
          aria-hidden="true"
          className="w-px self-stretch my-2 bg-border-strong relative overflow-hidden"
        >
          <div
            data-testid="chapter-progress-desktop-fill"
            className="w-full h-full bg-primary origin-top will-change-transform"
            style={{ transform: `scaleY(${progressState.fillProgress})` }}
          />
        </div>
      </nav>
    </>
  );
};
