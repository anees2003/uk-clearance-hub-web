import React, { useEffect, useRef, useState } from 'react';
import { gsap } from '../animations/gsap';
import {
  FIRMNESS_SCALE_LEVELS,
  SLEEP_POSITIONS_GUIDE,
  MATTRESS_TYPES_COMPARISON,
  getFirmnessLevelInfo,
  computeMattressSquashScaleY,
} from '../data/informativePages';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { EditorialPageHero } from '../components/ui/EditorialPageHero';
import { MattressHeroView } from '../three/SharedViewCanvas';

const SleepPositionSvg: React.FC<{ positionId: 'side' | 'back' | 'front' }> = ({
  positionId,
}) => {
  return (
    <svg
      viewBox="0 0 280 120"
      className="w-full h-28 mb-5 border border-border bg-surface-2 p-3 rounded-sm"
      aria-hidden="true"
    >
      {/* Mattress baseline */}
      <line
        x1="16"
        y1="92"
        x2="264"
        y2="92"
        stroke="var(--text)"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      {/* Spinal alignment reference dashed line */}
      <line
        x1="36"
        y1="56"
        x2="244"
        y2="56"
        stroke="var(--primary)"
        strokeDasharray="4 4"
        strokeWidth="1.2"
      />

      {positionId === 'side' && (
        <g>
          {/* Pillow */}
          <rect
            data-draw-stroke
            x="34"
            y="60"
            width="38"
            height="16"
            rx="6"
            fill="none"
            stroke="var(--text)"
            strokeWidth="1.6"
          />
          {/* Head, shoulder, waist, hip, knees contour */}
          <path
            data-draw-stroke
            d="M 52 46 C 62 46, 66 56, 54 58 M 72 56 C 88 42, 108 64, 128 58 C 148 52, 166 42, 192 58 L 236 66"
            fill="none"
            stroke="var(--text)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Mattress compression curve under shoulder & hip */}
          <path
            data-draw-stroke
            d="M 24 76 L 74 76 Q 92 90 112 78 Q 130 72 150 78 Q 172 90 194 76 L 256 76"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.6"
          />
        </g>
      )}

      {positionId === 'back' && (
        <g>
          {/* Pillow */}
          <rect
            data-draw-stroke
            x="34"
            y="64"
            width="42"
            height="12"
            rx="5"
            fill="none"
            stroke="var(--text)"
            strokeWidth="1.6"
          />
          {/* Supine profile with natural lumbar curve */}
          <path
            data-draw-stroke
            d="M 54 48 C 66 48, 70 58, 84 58 C 106 54, 128 62, 148 56 C 170 50, 194 60, 240 58"
            fill="none"
            stroke="var(--text)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Taut medium-firm surface */}
          <path
            data-draw-stroke
            d="M 24 76 L 86 76 Q 112 83 136 77 Q 166 84 196 76 L 256 76"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.6"
          />
        </g>
      )}

      {positionId === 'front' && (
        <g>
          {/* Slim pillow */}
          <rect
            data-draw-stroke
            x="36"
            y="68"
            width="36"
            height="7"
            rx="3.5"
            fill="none"
            stroke="var(--text)"
            strokeWidth="1.5"
          />
          {/* Prone profile kept flat across pelvis */}
          <path
            data-draw-stroke
            d="M 52 54 C 66 54, 82 56, 118 56 C 154 56, 192 56, 240 58"
            fill="none"
            stroke="var(--text)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Firm surface with minimal sinkage */}
          <path
            data-draw-stroke
            d="M 24 76 L 106 76 Q 148 80 190 76 L 256 76"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.6"
          />
        </g>
      )}
    </svg>
  );
};

const CARE_TIPS = [
  {
    number: '01',
    title: 'Rotate 180° Every Month for the First Season',
    body: 'Natural British wool, cotton, and cashmere fillings settle during the first 12 weeks of use. Rotate single-sided mattresses head-to-toe every 4 weeks initially (and every 3 months thereafter) so fillings bed in evenly across both sleeping zones.',
  },
  {
    number: '02',
    title: 'Use a Breathable Quilted Cotton Protector',
    body: 'Always fit a washable, breathable cotton mattress protector from day one. Avoid non-breathable plastic covers which trap humidity against natural damask ticking, and note that unsoiled condition is required to maintain any applicable supplier warranty.',
  },
  {
    number: '03',
    title: 'Check Slatted Base Spacing (< 7.5 cm)',
    body: 'If placing a pocket-sprung mattress onto a slatted bedstead rather than a solid divan platform, ensure the gaps between wooden slats are no wider than 7.5 cm (3 inches). Wider gaps can allow individual pocket springs to dip between slats.',
  },
  {
    number: '04',
    title: 'Air Regularly & Never Vacuum Tufting Pom-Poms',
    body: 'Strip back your duvet for 20 minutes each morning to let overnight moisture evaporate. Clean only with a soft upholstery brush—never use a high-suction vacuum nozzle, which can displace natural wool layers beneath the hand-tufts.',
  },
];

export const MattressGuidePage: React.FC = () => {
  const [firmness, setFirmness] = useState<number>(6);
  const pageRef = useRef<HTMLDivElement | null>(null);

  const activeInfo = getFirmnessLevelInfo(firmness);
  const currentScaleY = computeMattressSquashScaleY(firmness);

  useEffect(() => {
    const pageEl = pageRef.current;
    if (!pageEl) return;

    const ctx = gsap.context(() => {
      const reduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Reveal sections
      const revealBlocks = pageEl.querySelectorAll<HTMLElement>('[data-mg-reveal]');
      revealBlocks.forEach((block) => {
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

      // SVG stroke-dashoffset draw animation on sleep position cards
      const strokes = pageEl.querySelectorAll<SVGGeometryElement>('[data-draw-stroke]');
      strokes.forEach((el) => {
        const length = typeof el.getTotalLength === 'function' ? el.getTotalLength() : 260;
        gsap.set(el, {
          strokeDasharray: length,
          strokeDashoffset: reduced ? 0 : length,
        });
        if (!reduced) {
          gsap.to(el, {
            strokeDashoffset: 0,
            duration: 1.25,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            },
          });
        }
      });

      // Stagger comparison table rows
      const tableRows = pageEl.querySelectorAll<HTMLElement>('[data-mg-table-row]');
      if (tableRows.length > 0 && !reduced) {
        gsap.fromTo(
          tableRows,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: tableRows[0],
              start: 'top 88%',
              once: true,
            },
          }
        );
      }
    }, pageEl);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={pageRef}
      data-testid="mattress-guide-page"
      className="min-h-screen bg-bg text-text"
    >
      {/* 1. Editorial Hero with 3D Mattress Node on the right */}
      <EditorialPageHero
        testId="mattress-guide-hero"
        documentTitle="Mattress Guide"
        eyebrow="Sleep Engineering & Tension Guide"
        heading="Find your perfect mattress"
        intro="Choosing the right mattress tension is not about personal preference alone—it is a mechanical pairing of your primary sleep posture and body weight so your spine rests in neutral alignment all night."
        rightSlot={<MattressHeroView firmness={firmness} />}
      />

      {/* 2. Interactive Firmness Scale (1 Soft to 10 Extra Firm) */}
      <section
        data-mg-reveal
        data-testid="firmness-scale-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <SectionHeading
              eyebrow="Interactive Tension Calibrator"
              title="Firmness scale: 1 (Soft) to 10 (Extra firm)"
              subtitle="Click any tension rating or drag the calibrator below. Watch how the 3D showroom mattress above compresses at softer tensions and stays lofted at orthopaedic ratings."
            />
            <div className="text-xs uppercase tracking-[0.18em] text-muted tabular-nums">
              3D Mattress Squash Ratio:{' '}
              <strong
                data-testid="firmness-scale-y-readout"
                className="text-text font-semibold"
              >
                {currentScaleY.toFixed(2)}x
              </strong>
            </div>
          </div>

          {/* Interactive Scale Controls */}
          <div className="border border-border bg-surface p-6 md:p-10 rounded-sm shadow-theme">
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted mb-3">
                <span>1 · Extra Soft (Plush)</span>
                <span className="hidden sm:inline">5–6 · Balanced Medium</span>
                <span>10 · Extra Firm (Orthopaedic)</span>
              </div>

              {/* Accessible Range Scrubber */}
              <label htmlFor="firmness-range-slider" className="sr-only">
                Select mattress firmness from 1 (Soft) to 10 (Extra firm)
              </label>
              <input
                id="firmness-range-slider"
                data-testid="firmness-range-slider"
                type="range"
                min={1}
                max={10}
                step={1}
                value={firmness}
                onChange={(e) => setFirmness(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer h-2 bg-surface-2 mb-4"
              />

              {/* 10 Discrete Step Buttons */}
              <div
                role="radiogroup"
                aria-label="Mattress firmness scale 1 to 10"
                className="grid grid-cols-5 sm:grid-cols-10 gap-2"
              >
                {FIRMNESS_SCALE_LEVELS.map((lvl) => {
                  const active = lvl.rating === firmness;
                  return (
                    <button
                      key={lvl.rating}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={`Firmness ${lvl.rating} - ${lvl.shortLabel}`}
                      data-testid={`firmness-btn-${lvl.rating}`}
                      onClick={() => setFirmness(lvl.rating)}
                      className={`py-3 px-2 text-center border transition-all cursor-pointer rounded-sm active:scale-[0.98] ${
                        active
                          ? 'bg-primary text-primary-contrast border-primary font-semibold'
                          : 'bg-surface-2 text-text border-border-strong hover:border-primary'
                      }`}
                    >
                      <span className="block text-base font-heading font-bold tabular-nums">
                        {lvl.rating}
                      </span>
                      <span
                        className={`block text-[0.625rem] uppercase tracking-[0.12em] truncate mt-0.5 ${
                          active ? 'opacity-85' : 'text-muted'
                        }`}
                      >
                        {lvl.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Firmness Description Card */}
            <div
              data-testid="firmness-detail-card"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-8 border-t border-border items-center"
            >
              <div className="lg:col-span-7 space-y-4 max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    data-testid="firmness-active-heading"
                    className="type-h3 font-heading text-text"
                  >
                    {activeInfo.categoryName}
                  </span>
                  <span className="bg-accent text-white px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.16em] font-semibold rounded-sm">
                    {activeInfo.sleepPosition}
                  </span>
                </div>

                <p
                  data-testid="firmness-active-description"
                  className="type-body text-text/85 max-w-2xl"
                >
                  {activeInfo.description}
                </p>

                <p className="type-small text-muted max-w-2xl">
                  <strong className="text-text font-semibold">
                    Who it suits best:
                  </strong>{' '}
                  <span data-testid="firmness-who-it-suits">
                    {activeInfo.whoItSuits}
                  </span>
                </p>
              </div>

              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-2 p-5 border border-border rounded-sm">
                <div>
                  <span className="block text-[0.6875rem] uppercase tracking-[0.16em] text-muted mb-1">
                    Ideal Body Weight
                  </span>
                  <strong
                    data-testid="firmness-weight-guidance"
                    className="text-sm font-semibold text-text"
                  >
                    {activeInfo.bodyWeightGuidance}
                  </strong>
                </div>

                <div>
                  <span className="block text-[0.6875rem] uppercase tracking-[0.16em] text-muted mb-1">
                    Recommended Posture
                  </span>
                  <strong
                    data-testid="firmness-sleep-position"
                    className="text-sm font-semibold text-text"
                  >
                    {activeInfo.sleepPosition}
                  </strong>
                </div>

                {/* Live Visual Compression Profile */}
                <div className="sm:col-span-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-[0.6875rem] uppercase tracking-[0.14em] text-muted mb-2">
                    <span>Surface Compression Visualiser</span>
                    <span className="tabular-nums text-text font-semibold">
                      scaleY: {currentScaleY.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-10 w-full bg-bg border border-border flex items-end justify-center p-1.5 rounded-sm">
                    <div
                      className="w-full bg-primary transition-transform duration-300 origin-bottom rounded-xs"
                      style={{
                        height: '100%',
                        transform: `scaleY(${currentScaleY})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Sleep Positions (3 cards with SVG line illustrations) */}
      <section
        data-mg-reveal
        data-testid="sleep-positions-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <SectionHeading
            eyebrow="Posture & Spinal Alignment"
            title="Match your mattress to how you sleep"
            subtitle="Your dominant sleeping position determines which parts of your body press deepest into the comfort layers."
            className="mb-12"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SLEEP_POSITIONS_GUIDE.map((pos) => (
              <article
                key={pos.id}
                data-testid={`sleep-position-card-${pos.id}`}
                className="border border-border bg-surface p-6 md:p-8 flex flex-col justify-between rounded-sm shadow-theme hover:-translate-y-1 hover:shadow-theme-hover transition-all duration-300"
              >
                <div>
                  <SleepPositionSvg positionId={pos.id} />

                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="type-h3 font-heading text-text">
                      {pos.title}
                    </h3>
                  </div>

                  <p className="inline-block bg-surface-2 border border-border px-3 py-1 text-xs uppercase tracking-[0.14em] text-text font-semibold mb-4 rounded-sm">
                    Recommended: {pos.recommendedFirmness}
                  </p>

                  <p className="type-small text-text/85 mb-3">
                    {pos.summary}
                  </p>

                  <p className="type-small text-muted mb-4">
                    <strong className="text-text font-semibold">
                      Why it works:
                    </strong>{' '}
                    {pos.whyItWorks}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">{pos.keyTip}</span>
                  <button
                    type="button"
                    onClick={() => setFirmness(pos.recommendedRange[0] + 1)}
                    className="shrink-0 text-xs uppercase tracking-[0.15em] text-accent hover:text-text font-semibold underline underline-offset-4 cursor-pointer transition-colors"
                  >
                    Set {pos.recommendedRange[0] + 1}/10
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Mattress Types Compared (Desktop Table + Mobile Swipeable Cards) */}
      <section
        data-mg-reveal
        data-testid="mattress-comparison-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <SectionHeading
            eyebrow="Construction Comparison"
            title="Mattress types, compared side by side"
            subtitle="From hand-tufted Yorkshire pocket springs to breathable natural Talalay latex—compare how each construction performs and what you can expect to pay in our weekly clearance."
            className="mb-12"
          />

          {/* Desktop Comparison Table */}
          <div className="hidden md:block overflow-x-auto border border-border-strong rounded-sm shadow-theme">
            <table
              data-testid="mattress-comparison-table"
              className="w-full text-left border-collapse"
            >
              <thead>
                <tr className="bg-surface-2 text-text border-b border-border-strong text-xs uppercase tracking-[0.16em]">
                  <th className="py-4 px-5 font-semibold">Mattress Type</th>
                  <th className="py-4 px-5 font-semibold">Surface Feel</th>
                  <th className="py-4 px-5 font-semibold">Core Support</th>
                  <th className="py-4 px-5 font-semibold">Temperature</th>
                  <th className="py-4 px-5 font-semibold">Motion Isolation</th>
                  <th className="py-4 px-5 font-semibold">Lifespan</th>
                  <th className="py-4 px-5 font-semibold">Clearance Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border type-small">
                {MATTRESS_TYPES_COMPARISON.map((row) => (
                  <tr
                    key={row.type}
                    data-mg-table-row
                    className="bg-surface hover:bg-surface-2 transition-colors"
                  >
                    <td className="py-5 px-5 align-top">
                      <strong className="block font-heading text-lg text-text font-bold">
                        {row.type}
                      </strong>
                      <span className="inline-block mt-1 text-[0.6875rem] uppercase tracking-[0.14em] text-primary font-semibold">
                        {row.badge}
                      </span>
                    </td>
                    <td className="py-5 px-5 align-top text-text/85">
                      {row.feel}
                    </td>
                    <td className="py-5 px-5 align-top text-text/85">
                      {row.support}
                    </td>
                    <td className="py-5 px-5 align-top text-muted">
                      {row.temperature}
                    </td>
                    <td className="py-5 px-5 align-top text-muted">
                      {row.motionIsolation}
                    </td>
                    <td className="py-5 px-5 align-top text-text tabular-nums whitespace-nowrap">
                      {row.lifespan}
                    </td>
                    <td className="py-5 px-5 align-top font-bold text-accent tabular-nums whitespace-nowrap">
                      {row.clearancePriceRange}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Swipeable Cards */}
          <div
            data-testid="mattress-comparison-mobile-cards"
            className="md:hidden flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4"
          >
            {MATTRESS_TYPES_COMPARISON.map((row) => (
              <div
                key={row.type}
                className="snap-start shrink-0 w-[82vw] max-w-[320px] border border-border-strong bg-surface p-5 space-y-3 rounded-sm shadow-theme"
              >
                <div className="flex items-baseline justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-xl text-text">
                      {row.type}
                    </h3>
                    <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-primary font-semibold">
                      {row.badge}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-accent tabular-nums">
                    {row.clearancePriceRange}
                  </span>
                </div>

                <dl className="space-y-2 text-xs">
                  <div>
                    <dt className="uppercase tracking-[0.14em] text-muted">
                      Feel
                    </dt>
                    <dd className="text-text mt-0.5">{row.feel}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-[0.14em] text-muted">
                      Support
                    </dt>
                    <dd className="text-text mt-0.5">{row.support}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-[0.14em] text-muted">
                      Temperature
                    </dt>
                    <dd className="text-text mt-0.5">{row.temperature}</dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted">
                      Lifespan:{' '}
                      <strong className="text-text">{row.lifespan}</strong>
                    </span>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 5. Mattress Care Tips + CTA to /clearance-deals?category=Mattresses */}
      <section data-mg-reveal className="section-padding">
        <Container>
          <SectionHeading
            eyebrow="Longevity & Aftercare"
            title="Four rules for a decade of restorative sleep"
            subtitle="Simple seasonal care preserves the loft of natural British fillings and helps protect any applicable supplier warranty."
            className="mb-12"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {CARE_TIPS.map((tip) => (
              <div
                key={tip.number}
                className="border border-border bg-surface p-6 flex flex-col justify-between rounded-sm shadow-theme hover:-translate-y-1 hover:shadow-theme-hover transition-all duration-300"
              >
                <div>
                  <span className="block font-mono text-xs text-primary font-semibold mb-3">
                    {tip.number}
                  </span>
                  <h3 className="font-heading font-bold text-xl text-text mb-2.5">
                    {tip.title}
                  </h3>
                  <p className="type-small text-muted">{tip.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Closing CTA Banner */}
          <div className="border border-border-strong bg-bg-elevated bg-hero-glow text-text p-8 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8 rounded-sm shadow-theme">
            <div className="max-w-xl">
              <Eyebrow tone="amber" className="mb-3">
                Genuine Clearance Deals · Ready for UK Dispatch
              </Eyebrow>
              <h2 className="type-h2 font-heading text-text mb-3">
                Explore this week&apos;s clearance mattresses
              </h2>
              <p className="type-small text-muted">
                Hand-tufted Yorkshire pocket-sprung, pillow-top cashmere, and
                breathable Talalay hybrid mattresses in Single to Super King.
              </p>
            </div>

            <Button
              to="/deals?category=Home+%26+Living&subcategory=Mattresses"
              variant="cta"
              data-testid="mattress-guide-cta-btn"
              className="shrink-0"
            >
              Shop Clearance Mattresses
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
};
