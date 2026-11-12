import React, { useEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { EditorialPageHero } from '../components/ui/EditorialPageHero';
import { AboutFullBedHeroView } from '../three/SharedViewCanvas';

const CLEARANCE_CATEGORIES = [
  {
    tag: '01 · Showroom Floor Models',
    title: 'Ex-display',
    saving: 'Inspected showroom display stock',
    body: 'Each season, flagship British showrooms and department stores refresh their floor displays. Rather than letting these pristine frames, mattresses, and home pieces sit in storage, our verified suppliers inspect, sanitise, and list them at genuine clearance prices.',
  },
  {
    tag: '02 · Discontinued Fabrics & Ranges',
    title: 'End-of-line',
    saving: 'Brand-new discontinued lines',
    body: 'When a brand retires a specific colourway, model generation, or solid oak finish to make way for next season’s catalogue, remaining brand-new units become "end-of-line". They are 100% unused and boxed, discounted purely because the line is no longer in continuous production.',
  },
  {
    tag: '03 · Cancelled Contract & Excess Runs',
    title: 'Overstock',
    saving: 'Factory-sealed surplus batches',
    body: 'Major UK retailers, hospitality suppliers, and distributors regularly over-order electronics, appliances, and bedroom furniture for scheduled projects. We connect you directly with these factory-sealed surplus batches from trusted UK warehouses.',
  },
];

const INSPECTION_STAGES = [
  {
    step: '01',
    stage: 'Collected',
    subtitle: 'Direct UK Supplier & Showroom Sourcing',
    description:
      'Stock is sourced directly from vetted British workshops, brand distributors, and partner showrooms across the UK—never unverified grey-market imports.',
  },
  {
    step: '02',
    stage: 'Inspected',
    subtitle: 'Structural & Functional Checks',
    description:
      'Every clearance batch undergoes structural, electrical, or joinery checks by the supplier to ensure full performance and safety compliance before listing.',
  },
  {
    step: '03',
    stage: 'Cleaned',
    subtitle: 'Professional Preparation & Sanitisation',
    description:
      'Unboxed showroom pieces undergo professional extraction, surface sanitisation, and protective repackaging prior to dispatch.',
  },
  {
    step: '04',
    stage: 'Graded',
    subtitle: 'Transparent Condition Certification',
    description:
      'Every deal is clearly labelled with its honest condition grade (New, Refurbished, Graded, or Ex-display) and verified reference price where applicable.',
  },
  {
    step: '05',
    stage: 'Delivered',
    subtitle: 'Direct Supplier Dispatch Across the UK',
    description:
      'Fulfilled directly from the UK supplier’s warehouse to your door with tracked delivery and full statutory UK consumer protection.',
  },
];

const ABOUT_STATS = [
  {
    value: '3 Core',
    label: 'Clearance Categories',
    detail: 'Electronics & Gadgets, Home Appliances & Home & Living',
  },
  {
    value: 'Verified',
    label: 'Reference Savings',
    detail: 'Saving percentages shown only when RRP is verified',
  },
  {
    value: '100% UK',
    label: 'Partner Suppliers',
    detail: 'Every deal fulfilled directly by vetted UK warehouse partners',
  },
  {
    value: 'Direct',
    label: 'WhatsApp & Email Desk',
    detail: 'Personal UK support with unique Lead ID enquiry tracking',
  },
];

export const AboutPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const pinSectionRef = useRef<HTMLDivElement | null>(null);
  const pinTrackRef = useRef<HTMLDivElement | null>(null);
  const pinProgressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const pageEl = pageRef.current;
    if (!pageEl) return;

    const ctx = gsap.context(() => {
      const reduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const blocks = pageEl.querySelectorAll<HTMLElement>('[data-about-reveal]');
      blocks.forEach((block) => {
        if (reduced) {
          gsap.set(block, { opacity: 1, y: 0 });
          return;
        }
        gsap.fromTo(
          block,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: block,
              start: 'top 86%',
              once: true,
            },
          }
        );
      });

      // Horizontal scroll-pinned inspection timeline on desktop (>= 1024px)
      if (!reduced) {
        const mm = gsap.matchMedia();
        mm.add('(min-width: 1024px)', () => {
          const pinSection = pinSectionRef.current;
          const pinTrack = pinTrackRef.current;
          if (!pinSection || !pinTrack) return;

          const getScrollDistance = () =>
            Math.max(0, pinTrack.scrollWidth - pinSection.clientWidth + 96);

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: pinSection,
              start: 'top top+=80',
              end: () => `+=${Math.max(600, getScrollDistance())}`,
              pin: true,
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          });

          tl.to(
            pinTrack,
            {
              x: () => -getScrollDistance(),
              ease: 'none',
            },
            0
          );

          if (pinProgressBarRef.current) {
            tl.fromTo(
              pinProgressBarRef.current,
              { scaleX: 0.2, transformOrigin: 'left center' },
              { scaleX: 1, ease: 'none' },
              0
            );
          }
        });
      }
    }, pageEl);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={pageRef}
      data-testid="about-page"
      className="min-h-screen bg-bg text-text"
    >
      {/* 1. Editorial Hero with Full 3D Bed Set on Right */}
      <EditorialPageHero
        testId="about-hero"
        documentTitle="About Us"
        eyebrow="Our Story & Referral Model"
        heading="Genuine clearance deals, verified UK suppliers"
        intro="UK Clearance Hub is a clearance discovery and referral platform. We partner with verified UK suppliers across Electronics & Gadgets, Home Appliances, and Home & Living to bring you genuine overstock, end-of-line, graded, and ex-display deals."
        rightSlot={<AboutFullBedHeroView />}
      />

      {/* 2. Our Story (Two-Column Editorial with Large Pull Quote) */}
      <section
        data-about-reveal
        data-testid="about-story-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            <div className="lg:col-span-6 space-y-5 max-w-2xl">
              <Eyebrow className="mb-2">Transparent Referral Discovery</Eyebrow>
              <h2 className="type-h2 font-heading text-text">
                Direct from Yorkshire, Lancashire &amp; Midlands warehouses
              </h2>
              <p className="type-body text-text/85 max-w-2xl">
                Traditional high-street retailers build hefty showroom rent and
                long supply-chain mark-ups into every price tag. Meanwhile,
                trusted British manufacturers, distributors, and showrooms hold
                immaculate overstock, end-of-line, and ex-display items ready
                for immediate dispatch.
              </p>
              <p className="type-body text-muted max-w-2xl">
                UK Clearance Hub curates those verified clearance deals in one
                place. We don&apos;t hold stock or add middleman warehouse
                mark-ups: when you find a deal you love, you click straight
                through to our verified UK supplier—or message our team on
                WhatsApp—and your order is fulfilled and delivered directly by
                the supplier.
              </p>
            </div>

            <div className="lg:col-span-6 border-l-4 border-accent pl-6 sm:pl-10 py-2 bg-surface p-6 rounded-r-sm shadow-theme">
              <blockquote
                data-testid="about-pull-quote"
                className="font-heading font-bold text-xl sm:text-2xl md:text-3xl leading-snug text-text mb-6 max-w-xl"
              >
                &ldquo;A hand-tufted 2,000 pocket-sprung mattress or boxed
                appliance does not lose an ounce of its quality simply because
                last season&apos;s catalogue was updated.&rdquo;
              </blockquote>
              <p className="text-xs uppercase tracking-[0.18em] text-muted font-semibold">
                — The UK Clearance Hub Curatorial Team
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. How Clearance Works (Ex-display / End-of-line / Overstock as 3 Cards) */}
      <section
        data-about-reveal
        data-testid="about-how-clearance-works"
        className="section-padding border-b border-border"
      >
        <Container>
          <SectionHeading
            eyebrow="Three Transparent Origins"
            title="How clearance sourcing works"
            subtitle="Every deal featured on UK Clearance Hub is clearly labelled with its exact provenance before you view the deal or enquire."
            className="mb-12"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CLEARANCE_CATEGORIES.map((card) => (
              <article
                key={card.title}
                data-testid={`clearance-origin-card-${card.title}`}
                className="border border-border bg-surface p-6 md:p-8 flex flex-col justify-between rounded-sm shadow-theme hover:-translate-y-1 hover:shadow-theme-hover transition-all duration-300"
              >
                <div>
                  <span className="block text-xs uppercase tracking-[0.16em] text-muted mb-3 font-semibold">
                    {card.tag}
                  </span>
                  <h3 className="type-h2 font-heading text-text mb-2">
                    {card.title}
                  </h3>
                  <p className="inline-block bg-accent text-white px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.15em] font-bold mb-5 rounded-sm">
                    {card.saving}
                  </p>
                  <p className="type-small text-text/85 max-w-[60ch]">{card.body}</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Our Inspection Process (Horizontal Scroll-Pinned Timeline on Desktop) */}
      <section
        ref={pinSectionRef}
        data-testid="about-inspection-timeline"
        className="section-padding border-b border-border overflow-hidden bg-bg"
      >
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeading
              eyebrow="Five-Stage Quality Protocol"
              title="Our supplier verification & grading process"
              subtitle="Every featured clearance product follows a strict five-stage quality and grading protocol."
            />
            <div className="w-full md:w-56">
              <div className="flex justify-between text-[0.6875rem] uppercase tracking-[0.16em] text-muted mb-2 font-semibold">
                <span>Collected</span>
                <span>Delivered</span>
              </div>
              <div className="h-1.5 w-full bg-surface-2 overflow-hidden rounded-full">
                <div
                  ref={pinProgressBarRef}
                  className="h-full w-full bg-accent origin-left"
                />
              </div>
            </div>
          </div>

          <div
            ref={pinTrackRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-nowrap gap-6"
          >
            {INSPECTION_STAGES.map((stage, idx) => (
              <div
                key={stage.step}
                data-testid={`inspection-stage-${stage.stage.toLowerCase()}`}
                className="lg:w-[360px] lg:shrink-0 border border-border bg-surface p-6 md:p-8 flex flex-col justify-between rounded-sm shadow-theme"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-border">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-accent font-bold">
                      STAGE {stage.step} / 05
                    </span>
                    {idx < INSPECTION_STAGES.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="text-xs font-mono text-primary"
                      >
                        →
                      </span>
                    )}
                  </div>

                  <h3 className="type-h2 font-heading text-text mb-1.5">
                    {stage.stage}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.15em] text-primary font-semibold mb-4">
                    {stage.subtitle}
                  </p>
                  <p className="type-small text-text/85 max-w-[60ch]">
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 5. Sustainability Section (Keeping Good Furniture Out of Landfill) */}
      <section
        data-about-reveal
        data-testid="about-sustainability-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-4 max-w-2xl">
              <Eyebrow tone="orange">Circular UK Retail</Eyebrow>
              <h2 className="type-h2 font-heading text-text">
                Keeping quality furniture, appliances &amp; tech out of UK landfill
              </h2>
              <p className="type-body text-text/85 max-w-2xl">
                Across the United Kingdom, millions of mattresses, timber bed
                frames, and boxed home goods are written off each year—including
                brand-new showroom display stock and end-of-season surplus that
                was never used.
              </p>
              <p className="type-small text-muted max-w-2xl">
                Every clearance bed frame, mattress, appliance, or tech item
                rehomed through UK Clearance Hub helps extend the lifecycle of
                existing manufacturing and prevents quality stock from going to
                waste.
              </p>
            </div>

            <div className="lg:col-span-5 border border-border bg-surface p-6 md:p-8 space-y-5 rounded-sm shadow-theme">
              <div>
                <span className="font-heading font-bold text-3xl text-text block">
                  Second-Life Stock
                </span>
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Showroom ex-display &amp; surplus lines rehomed across Britain
                </span>
              </div>
              <div className="pt-4 border-t border-border">
                <span className="font-heading font-bold text-3xl text-primary block">
                  Direct Dispatch
                </span>
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Shipped straight from UK supplier warehouses without double handling
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Stats Band + Closing CTA */}
      <section
        data-about-reveal
        data-testid="about-stats-band"
        className="section-padding bg-bg-elevated bg-hero-glow text-text border-t border-border"
      >
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-16 border-b border-border">
            {ABOUT_STATS.map((stat) => (
              <div key={stat.label} className="space-y-2">
                <span className="block font-heading font-extrabold text-4xl md:text-5xl text-text tabular-nums">
                  {stat.value}
                </span>
                <span className="block text-xs uppercase tracking-[0.18em] text-amber font-semibold">
                  {stat.label}
                </span>
                <p className="text-xs text-muted">{stat.detail}</p>
              </div>
            ))}
          </div>

          <div className="pt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="type-h3 font-heading text-text">
                Explore this week&apos;s verified UK clearance deals
              </h2>
              <p className="type-small text-muted mt-1">
                Live clearance savings across beds, mattresses, headboards, and
                home essentials ready for UK dispatch.
              </p>
            </div>
            <Button
              to="/deals"
              variant="cta"
              className="shrink-0"
            >
              Browse Clearance Deals
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
};
