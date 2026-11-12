import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from '../../animations/gsap';
import { splitLines, SplitLinesResult } from '../../animations/splitLines';
import {
  buildBreadcrumbJsonLd,
  ROUTE_SEO_DEFAULTS,
  useSeo,
} from '../../utils/seo';
import { Container } from './Container';
import { Eyebrow, EyebrowProps } from './Eyebrow';

export interface EditorialPageHeroProps {
  /** Page title prefix, sets document.title to `${documentTitle} | UK Clearance Hub` */
  documentTitle: string;
  /** Eyebrow label text */
  eyebrow: string;
  /** Eyebrow tone */
  eyebrowTone?: EyebrowProps['tone'];
  /** Main h1 heading (revealed line-by-line) */
  heading: string;
  /** Short intro paragraph below the heading */
  intro: string;
  /** Optional interactive control below the intro (e.g. FAQ search input) */
  children?: React.ReactNode;
  /** Optional 3D View or visual element on the right column */
  rightSlot?: React.ReactNode;
  /** Optional data-testid for the hero section */
  testId?: string;
}

export const EditorialPageHero: React.FC<EditorialPageHeroProps> = ({
  documentTitle,
  eyebrow,
  eyebrowTone = 'orange',
  heading,
  intro,
  children,
  rightSlot,
  testId = 'editorial-page-hero',
}) => {
  const location = useLocation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const introRef = useRef<HTMLParagraphElement | null>(null);
  const extraRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const dividerRef = useRef<HTMLDivElement | null>(null);

  const routeMeta = ROUTE_SEO_DEFAULTS[location.pathname];
  useSeo({
    title: routeMeta?.title ?? `${documentTitle} | UK Clearance Hub`,
    description: routeMeta?.description ?? intro,
    canonicalPath: location.pathname,
    robots: routeMeta?.robots ?? 'index,follow',
    jsonLd: buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: documentTitle, path: location.pathname },
    ]),
  });

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const headingEl = headingRef.current;
    if (!sectionEl || !headingEl) return;

    let split: SplitLinesResult | null = null;

    const ctx = gsap.context(() => {
      split = splitLines(headingEl);

      const reduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduced) {
        gsap.set(split.lineInners, { yPercent: 0 });
        if (dividerRef.current) {
          gsap.set(dividerRef.current, { scaleX: 1 });
        }
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        split.lineInners,
        { yPercent: 108 },
        {
          yPercent: 0,
          duration: 1.0,
          stagger: 0.1,
          ease: 'power4.out',
        },
        0
      );

      if (introRef.current) {
        tl.fromTo(
          introRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.75 },
          0.16
        );
      }

      if (extraRef.current) {
        tl.fromTo(
          extraRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.65 },
          0.26
        );
      }

      if (rightRef.current) {
        tl.fromTo(
          rightRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.85 },
          0.12
        );
      }

      if (dividerRef.current) {
        tl.fromTo(
          dividerRef.current,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 1.1, ease: 'expo.out' },
          0.1
        );
      }
    }, sectionEl);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, [heading]);

  return (
    <section
      ref={sectionRef}
      data-testid={testId}
      className="pt-12 pb-10 md:pt-16 md:pb-14 relative bg-hero-glow"
    >
      <Container>
        <div
          className={
            rightSlot
              ? 'grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center pb-10 md:pb-14'
              : 'max-w-3xl pb-10 md:pb-14'
          }
        >
          <div className={rightSlot ? 'lg:col-span-7' : ''}>
            <Eyebrow tone={eyebrowTone} className="mb-3.5">
              {eyebrow}
            </Eyebrow>

            <h1
              ref={headingRef}
              data-testid="page-hero-heading"
              className="type-h1 font-heading text-text mb-5"
            >
              {heading}
            </h1>

            <p
              ref={introRef}
              data-testid="page-hero-intro"
              className="type-body text-muted max-w-2xl"
            >
              {intro}
            </p>

            {children && (
              <div ref={extraRef} className="mt-7">
                {children}
              </div>
            )}
          </div>

          {rightSlot && (
            <div ref={rightRef} className="lg:col-span-5">
              {rightSlot}
            </div>
          )}
        </div>

        {/* Thin divider with signature brand gradient accent */}
        <div
          ref={dividerRef}
          data-testid="page-hero-divider"
          className="h-[2px] w-full bg-border origin-left relative overflow-hidden"
        >
          <span
            aria-hidden="true"
            className="block h-full w-32 bg-hero-gradient"
          />
        </div>
      </Container>
    </section>
  );
};
