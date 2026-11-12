import React, { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../animations/gsap';
import { splitLines, SplitLinesResult } from '../../animations/splitLines';
import { ChapterDefinition } from '../../data/assemblyChapters';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { HeroChapterSection } from './HeroChapterSection';

export interface AssemblyChapterPanelProps {
  chapter: ChapterDefinition;
}

export const AssemblyChapterPanel: React.FC<AssemblyChapterPanelProps> = ({
  chapter,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const copyRef = useRef<HTMLParagraphElement | null>(null);
  const specsListRef = useRef<HTMLUListElement | null>(null);
  const ctasRef = useRef<HTMLDivElement | null>(null);

  const { panel } = chapter;

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const panelEl = panelRef.current;
    const headingEl = headingRef.current;
    if (!panel || !sectionEl || !panelEl || !headingEl) return;

    let splitResult: SplitLinesResult | null = null;
    let resizeTimer: number | null = null;
    let isPanelActive = false;

    const getReducedMotion = () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const getDividerEls = (): HTMLElement[] =>
      specsListRef.current
        ? Array.from(
            specsListRef.current.querySelectorAll<HTMLElement>(
              '[data-spec-divider]'
            )
          )
        : [];

    const getSpecTextEls = (): HTMLElement[] =>
      specsListRef.current
        ? Array.from(
            specsListRef.current.querySelectorAll<HTMLElement>('[data-spec-text]')
          )
        : [];

    const performSplit = () => {
      splitResult = splitLines(headingEl);
      const reduced = getReducedMotion();
      if (isPanelActive || reduced) {
        gsap.set(splitResult.lineInners, { yPercent: 0 });
      } else {
        gsap.set(splitResult.lineInners, { yPercent: 100 });
      }
    };

    const ctx = gsap.context(() => {
      performSplit();

      const dividerEls = getDividerEls();
      const specTextEls = getSpecTextEls();
      const eyebrowEl = eyebrowRef.current;
      const copyEl = copyRef.current;
      const ctasEl = ctasRef.current;

      const setInitialHiddenState = () => {
        const reduced = getReducedMotion();
        const lineInners = splitResult?.lineInners ?? [];

        gsap.set(panelEl, {
          opacity: 0,
          y: 0,
          pointerEvents: 'none',
        });
        panelEl.setAttribute('data-panel-active', 'false');

        if (eyebrowEl) {
          gsap.set(eyebrowEl, { opacity: 0 });
        }
        if (lineInners.length > 0) {
          gsap.set(lineInners, { yPercent: reduced ? 0 : 100 });
        }
        if (copyEl) {
          gsap.set(copyEl, { opacity: 0, y: reduced ? 0 : 16 });
        }
        if (dividerEls.length > 0) {
          gsap.set(dividerEls, {
            scaleX: reduced ? 1 : 0,
            transformOrigin: 'left center',
          });
        }
        if (specTextEls.length > 0) {
          gsap.set(specTextEls, { opacity: 0, y: reduced ? 0 : 10 });
        }
        if (ctasEl) {
          gsap.set(ctasEl, { opacity: 0, y: reduced ? 0 : 14 });
        }
      };

      const playEnter = () => {
        isPanelActive = true;
        const reduced = getReducedMotion();
        const lineInners = splitResult?.lineInners ?? [];
        const currentDividers = getDividerEls();
        const currentSpecTexts = getSpecTextEls();

        panelEl.setAttribute('data-panel-active', 'true');
        gsap.killTweensOf([
          panelEl,
          eyebrowEl,
          copyEl,
          ctasEl,
          ...lineInners,
          ...currentDividers,
          ...currentSpecTexts,
        ]);

        gsap.set(panelEl, {
          opacity: 1,
          y: 0,
          pointerEvents: 'auto',
        });

        if (reduced) {
          gsap.set(lineInners, { yPercent: 0 });
          gsap.set(currentDividers, { scaleX: 1 });
          gsap.to(
            [eyebrowEl, copyEl, ctasEl, ...currentSpecTexts].filter(Boolean),
            {
              opacity: 1,
              y: 0,
              duration: 0.35,
              ease: 'power2.out',
              overwrite: true,
            }
          );
          return;
        }

        if (eyebrowEl) {
          gsap.fromTo(
            eyebrowEl,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.6,
              ease: 'power2.out',
              overwrite: true,
            }
          );
        }

        if (lineInners.length > 0) {
          gsap.fromTo(
            lineInners,
            { yPercent: 100 },
            {
              yPercent: 0,
              stagger: 0.08,
              duration: 1.0,
              ease: 'power4.out',
              overwrite: true,
            }
          );
        }

        if (copyEl) {
          gsap.fromTo(
            copyEl,
            { opacity: 0, y: 18 },
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              delay: 0.12,
              ease: 'power3.out',
              overwrite: true,
            }
          );
        }

        if (currentDividers.length > 0) {
          gsap.fromTo(
            currentDividers,
            { scaleX: 0, transformOrigin: 'left center' },
            {
              scaleX: 1,
              stagger: 0.08,
              duration: 0.7,
              delay: 0.18,
              ease: 'power3.out',
              overwrite: true,
            }
          );
        }

        if (currentSpecTexts.length > 0) {
          gsap.fromTo(
            currentSpecTexts,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.08,
              duration: 0.65,
              delay: 0.22,
              ease: 'power3.out',
              overwrite: true,
            }
          );
        }

        if (ctasEl) {
          gsap.fromTo(
            ctasEl,
            { opacity: 0, y: 14 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              delay: 0.24,
              ease: 'power3.out',
              overwrite: true,
            }
          );
        }
      };

      const playLeave = () => {
        isPanelActive = false;
        const reduced = getReducedMotion();
        const lineInners = splitResult?.lineInners ?? [];
        const currentDividers = getDividerEls();
        const currentSpecTexts = getSpecTextEls();

        panelEl.setAttribute('data-panel-active', 'false');
        gsap.killTweensOf([
          panelEl,
          eyebrowEl,
          copyEl,
          ctasEl,
          ...lineInners,
          ...currentDividers,
          ...currentSpecTexts,
        ]);

        gsap.set(panelEl, { pointerEvents: 'none' });

        if (reduced) {
          gsap.to(panelEl, {
            opacity: 0,
            y: 0,
            duration: 0.25,
            ease: 'power2.out',
            overwrite: true,
          });
          return;
        }

        gsap.to(panelEl, {
          opacity: 0,
          y: -24,
          duration: 0.42,
          ease: 'power2.out',
          overwrite: true,
        });
      };

      setInitialHiddenState();

      const st = ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top 45%',
        end: 'bottom 55%',
        onEnter: playEnter,
        onEnterBack: playEnter,
        onLeave: playLeave,
        onLeaveBack: playLeave,
      });

      if (st.isActive) {
        playEnter();
      }
    }, sectionEl);

    const handleResize = () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        performSplit();
      }, 160);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      splitResult?.revert();
      ctx.revert();
    };
  }, [panel]);

  if (!panel) {
    return <HeroChapterSection id={chapter.id} />;
  }

  const alignmentClasses =
    panel.side === 'left'
      ? 'justify-start'
      : panel.side === 'right'
        ? 'justify-end'
        : 'justify-center';

  const isComplete = panel.side === 'center';
  const isRightSide = panel.side === 'right';

  return (
    <section
      ref={sectionRef}
      id={chapter.id}
      data-testid={chapter.id}
      className="min-h-[100dvh] h-[100dvh] w-full flex items-center"
    >
      <Container
        className={`h-full flex ${
          isComplete ? 'items-start pt-[11dvh] md:pt-[12dvh]' : 'items-center'
        } ${alignmentClasses}`}
      >
        <div
          ref={panelRef}
          data-testid={`${chapter.id}-panel`}
          data-panel-side={panel.side}
          data-panel-active="false"
          className={`w-full ${
            isComplete
              ? 'max-w-[500px] text-center flex flex-col items-center'
              : isRightSide
                ? 'max-w-[400px] text-left lg:mr-20 xl:mr-20'
                : 'max-w-[420px] text-left'
          } bg-surface/95 backdrop-blur-md p-5 sm:p-6 rounded-xl border border-border-strong shadow-theme md:bg-transparent md:backdrop-blur-none md:border-none md:shadow-none md:p-0`}
        >
          {/* Eyebrow: chapter number like "01 / 06" + label */}
          {(panel.chapterNumber || panel.eyebrowLabel) && (
            <div
              ref={eyebrowRef}
              data-testid={`${chapter.id}-eyebrow`}
              className="type-eyebrow mb-3.5 flex items-center gap-2.5 text-muted tabular-nums"
            >
              {panel.chapterNumber && (
                <span className="text-accent font-bold">
                  {panel.chapterNumber}
                </span>
              )}
              {panel.chapterNumber && panel.eyebrowLabel && (
                <span aria-hidden="true" className="text-muted/50">
                  ·
                </span>
              )}
              {panel.eyebrowLabel && <span>{panel.eyebrowLabel}</span>}
            </div>
          )}

          {/* Heading (line-split via splitLines helper) */}
          <h2
            ref={headingRef}
            data-testid={`${chapter.id}-heading`}
            className="type-h2 font-heading text-text mb-4"
          >
            {panel.heading}
          </h2>

          {/* Informative UK English Copy / Subline */}
          <p
            ref={copyRef}
            data-testid={`${chapter.id}-copy`}
            className="type-body text-text/85 leading-relaxed"
          >
            {panel.copy}
          </p>

          {/* 2–3 Small Spec Bullet Points with Thin Divider Lines */}
          {panel.specs && panel.specs.length > 0 && (
            <ul
              ref={specsListRef}
              data-testid={`${chapter.id}-specs`}
              className="mt-6 w-full"
            >
              {panel.specs.map((spec, idx) => (
                <li key={idx} className="w-full">
                  <div
                    data-spec-divider="true"
                    className="h-px w-full bg-border-strong origin-left"
                  />
                  <div
                    data-spec-text="true"
                    className="py-3 flex items-baseline gap-3 type-small text-text/90"
                  >
                    <span
                      aria-hidden="true"
                      className="text-[0.6875rem] font-mono tabular-nums text-primary font-semibold shrink-0"
                    >
                      0{idx + 1}
                    </span>
                    <span>{spec}</span>
                  </div>
                  {idx === panel.specs!.length - 1 && (
                    <div
                      data-spec-divider="true"
                      className="h-px w-full bg-border-strong origin-left"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Complete Chapter CTA Buttons */}
          {panel.ctas && panel.ctas.length > 0 && (
            <div
              ref={ctasRef}
              data-testid={`${chapter.id}-ctas`}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              {panel.ctas.map((cta) => (
                <Button
                  key={cta.to}
                  to={cta.to}
                  variant={cta.variant === 'primary' ? 'orange' : 'outline'}
                >
                  {cta.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};
