import React, { useEffect, useRef } from 'react';
import { gsap } from '../../animations/gsap';
import { APP_READY_EVENT, isAppReady } from '../layout/Preloader';
import { Container } from '../ui/Container';

export interface HeroChapterSectionProps {
  id: string;
}

export const HeroChapterSection: React.FC<HeroChapterSectionProps> = ({ id }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentScrollWrapperRef = useRef<HTMLDivElement | null>(null);
  const indicatorScrollWrapperRef = useRef<HTMLDivElement | null>(null);

  const line1InnerRef = useRef<HTMLSpanElement | null>(null);
  const line2InnerRef = useRef<HTMLSpanElement | null>(null);
  const subTextRef = useRef<HTMLParagraphElement | null>(null);
  const infoBlockRef = useRef<HTMLDivElement | null>(null);
  const indicatorInnerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const getReducedMotion = () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let introTl: gsap.core.Timeline | null = null;
    let hasPlayedIntro = false;

    const ctx = gsap.context(() => {
      const reduced = getReducedMotion();
      const lineEls = [line1InnerRef.current, line2InnerRef.current].filter(
        Boolean
      ) as HTMLElement[];

      // Set initial pre-intro state
      if (reduced) {
        gsap.set(lineEls, { yPercent: 0, opacity: 0 });
        gsap.set(
          [subTextRef.current, infoBlockRef.current, indicatorInnerRef.current].filter(
            Boolean
          ),
          { opacity: 0, y: 0 }
        );
      } else {
        gsap.set(lineEls, { yPercent: 110 });
        gsap.set([subTextRef.current, infoBlockRef.current].filter(Boolean), {
          opacity: 0,
          y: 18,
        });
        if (indicatorInnerRef.current) {
          gsap.set(indicatorInnerRef.current, { opacity: 0, y: 12 });
        }
      }

      const playHeroIntro = () => {
        if (hasPlayedIntro) return;
        hasPlayedIntro = true;
        sectionEl.setAttribute('data-hero-intro', 'played');

        introTl = gsap.timeline();

        if (reduced) {
          introTl.to(
            [
              ...lineEls,
              subTextRef.current,
              infoBlockRef.current,
              indicatorInnerRef.current,
            ].filter(Boolean),
            {
              opacity: 1,
              duration: 0.45,
              stagger: 0.08,
              ease: 'power2.out',
            }
          );
          return;
        }

        // 1. Headline lines rise from masks (stagger 0.12, ease "power4.out")
        introTl.to(
          lineEls,
          {
            yPercent: 0,
            duration: 1.15,
            stagger: 0.12,
            ease: 'power4.out',
          },
          0
        );

        // 2. Sub text and top-right info block fade up
        if (subTextRef.current) {
          introTl.to(
            subTextRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: 'power3.out',
            },
            0.26
          );
        }

        if (infoBlockRef.current) {
          introTl.to(
            infoBlockRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: 'power3.out',
            },
            0.32
          );
        }

        // 3. Scroll indicator fades in last
        if (indicatorInnerRef.current) {
          introTl.to(
            indicatorInnerRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
            },
            0.52
          );
        }
      };

      if (isAppReady()) {
        playHeroIntro();
      } else {
        window.addEventListener(APP_READY_EVENT, playHeroIntro, { once: true });
      }

      // Scrubbed scroll-out animation as user scrolls out of the hero
      if (contentScrollWrapperRef.current) {
        gsap.fromTo(
          contentScrollWrapperRef.current,
          { opacity: 1, y: 0 },
          {
            opacity: 0,
            y: reduced ? 0 : -64,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
              trigger: sectionEl,
              start: 'top top',
              end: 'bottom 35%',
              scrub: true,
            },
          }
        );
      }

      if (indicatorScrollWrapperRef.current) {
        gsap.fromTo(
          indicatorScrollWrapperRef.current,
          { opacity: 1, y: 0 },
          {
            opacity: 0,
            y: reduced ? 0 : -20,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
              trigger: sectionEl,
              start: 'top top',
              end: 'top+=35% top',
              scrub: true,
            },
          }
        );
      }

      return () => {
        window.removeEventListener(APP_READY_EVENT, playHeroIntro);
        introTl?.kill();
      };
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={id}
      data-testid={id}
      data-hero-intro="waiting"
      className="relative h-[calc(100dvh-92px)] md:h-[calc(100dvh-138px)] min-h-[560px] w-full overflow-hidden bg-hero-glow"
    >
      {/* Main Hero Content Wrapper (fades and moves up on scroll out) */}
      <div
        ref={contentScrollWrapperRef}
        data-testid="hero-content-scroll-wrapper"
        className="w-full h-full will-change-transform"
      >
        <Container className="relative h-full flex flex-col justify-between pt-5 pb-24 sm:pb-24 md:pt-8 md:pb-20">
          {/* Top Row: Top-right small info block */}
          <div className="w-full flex justify-end">
            <div
              ref={infoBlockRef}
              data-testid="hero-info-block"
              className="inline-flex items-center gap-2 text-xs font-sans font-medium text-text tracking-wide will-change-transform"
            >
              <span className="text-accent font-bold">●</span>
              <span>Clearance stock updated weekly</span>
            </div>
          </div>

          {/* Lower-Left Area: Eyebrow + Display Headline + Sub text (leaves centre studio floor open) */}
          <div className="w-full max-w-4xl text-left mb-6 sm:mb-8">
            <p
              data-testid="hero-eyebrow"
              className="type-eyebrow text-accent font-semibold mb-3"
            >
              Home &amp; Living
            </p>
            <h1
              data-testid="hero-headline"
              className="font-heading text-[clamp(2.35rem,5.8vw,5.75rem)] leading-[0.98] tracking-[-0.025em] font-extrabold text-text"
            >
              <span className="block overflow-hidden pb-[0.09em] -mb-[0.09em]">
                <span
                  ref={line1InnerRef}
                  data-testid="hero-headline-line-1"
                  className="block will-change-transform"
                >
                  Build your bedroom.
                </span>
              </span>
              <span className="block overflow-hidden pb-[0.11em] -mb-[0.11em]">
                <span
                  ref={line2InnerRef}
                  data-testid="hero-headline-line-2"
                  className="block text-accent font-extrabold will-change-transform"
                >
                  For less.
                </span>
              </span>
            </h1>

            <p
              ref={subTextRef}
              data-testid="hero-subtext"
              className="mt-3 sm:mt-4 font-sans text-muted type-body max-w-[340px] sm:max-w-[440px] leading-relaxed will-change-transform"
            >
              Beds, mattresses and bedroom furniture from trusted UK suppliers,
              at genuine clearance prices.
            </p>
          </div>
        </Container>
      </div>

      {/* Bottom Centre: Scroll Indicator */}
      <div
        ref={indicatorScrollWrapperRef}
        data-testid="hero-scroll-indicator"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none will-change-transform"
      >
        <div
          ref={indicatorInnerRef}
          className="flex flex-col items-center gap-3 will-change-transform"
        >
          <span className="type-eyebrow text-text/80 whitespace-nowrap">
            Scroll to build your bed
          </span>
          <div
            aria-hidden="true"
            className="h-10 w-px bg-border-strong overflow-hidden relative"
          >
            <span className="block w-full h-4 bg-accent hero-scroll-line-segment" />
          </div>
        </div>
      </div>
    </section>
  );
};
