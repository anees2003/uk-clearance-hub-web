import React, { useEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { EditorialPageHero } from '../components/ui/EditorialPageHero';

const DELIVERY_REGIONS = [
  {
    region: 'Mainland England, Wales & Lowland Scotland',
    timescale: '3 – 5 working days',
    postcodes: 'All standard mainland UK postcodes (excluding highland/offshore)',
    details:
      'Dispatched directly by verified UK supplier partners on dedicated two-person furniture and appliance fleets with selectable weekday and Saturday slots.',
  },
  {
    region: 'Scottish Highlands & Islands',
    timescale: '7 – 10 working days',
    postcodes: 'AB31–AB56, FK17–FK21, IV, KW, PA20–PA80, PH15–PH50, HS, ZE',
    details:
      'Weekly scheduled specialist trunking runs to Northern Scotland and ferry-served islands. Supplier couriers coordinate directly with you 72 hours prior.',
  },
  {
    region: 'Northern Ireland',
    timescale: '5 – 8 working days',
    postcodes: 'All BT postcodes (Belfast, Derry/Londonderry & all 6 counties)',
    details:
      'Twice-weekly Irish Sea crossings with two-person white-glove home delivery throughout Northern Ireland with no customs paperwork required.',
  },
];

const DELIVERY_OPTIONS = [
  {
    name: 'Standard Kerbside',
    price: '£29',
    subPrice: 'Free on qualifying supplier deals over £500',
    badge: 'Ground Floor / Threshold',
    features: [
      'Delivered to your front door or ground-floor building entrance',
      '3-hour SMS & email time window sent 48 hours before arrival',
      'Ideal for electronics, bedside tables, headboards, and easy ground-floor access',
      'Full transit insurance and photographic sign-off included',
    ],
  },
  {
    name: 'Room of Choice',
    price: '£49',
    subPrice: 'Most popular for beds, mattresses & appliances',
    badge: 'Two-Person Specialist Crew',
    features: [
      'Uniformed 2-person crew carries items up to 2 flights of stairs',
      'Placed carefully inside your chosen room with overshoes worn',
      '30-minute courtesy telephone call ahead on the morning of delivery',
      'Optional old mattress or appliance recycling collection available (+£35)',
    ],
  },
  {
    name: 'Assembly Service',
    price: '£89',
    subPrice: 'Complete white-glove installation',
    badge: 'Full Build + Packaging Removal',
    features: [
      'Includes everything in Two-Person Room of Choice delivery',
      'Full assembly of your bed frame, ottoman gas-lift base, or headboard',
      'Mattress positioned on the frame and inspected with you in the room',
      '100% of cardboard, timber crates, and polythene removed for recycling',
    ],
  },
];

const DELIVERY_DAY_STEPS = [
  {
    step: '01',
    time: '48 Hours Prior',
    title: 'Confirmed 3-Hour Delivery Window',
    description:
      'You receive an SMS and email from the fulfilling UK supplier confirming your exact 3-hour arrival window (for example, 09:30 – 12:30) along with the names of your two-person delivery crew.',
  },
  {
    step: '02',
    time: '07:30 on Delivery Morning',
    title: 'Live Van Tracking Link',
    description:
      'When your vehicle departs the dispatch bay, you receive a live GPS map link showing what stop number you are on the route.',
  },
  {
    step: '03',
    time: '30 Minutes Away',
    title: 'Personal Courtesy Call from the Crew',
    description:
      'Your lead driver phones you 30 minutes before arrival so you can clear hallways, secure pets, or meet the van at your property.',
  },
  {
    step: '04',
    time: 'On Arrival',
    title: 'Protective Footwear & Room Placement',
    description:
      'The crew puts on clean floor-protective overshoes, assesses your staircase turns, and carries your item into your room of choice.',
  },
  {
    step: '05',
    time: 'Before Departure',
    title: 'Joint Inspection & Packaging Removal',
    description:
      'If you selected an Assembly Service, the crew builds the frame, removes all transit wrapping, and invites you to inspect the piece before signing off.',
  },
];

const DAMAGED_ITEM_STEPS = [
  {
    step: 'Step 1 · Note on Delivery or Within 48 Hours',
    body: 'If you spot outer packaging tears or a mark when the crew unwraps your item, ask the driver to log it on their handheld terminal immediately—or email within 48 hours of delivery if discovered after unpacking.',
  },
  {
    step: 'Step 2 · Send 3 Clear Photographs',
    body: 'Email admin@ukclearancehub.co.uk or your supplier dispatch contact with your order reference and three quick smartphone photos: one of the overall piece, one close-up of the issue, and one of the batch label.',
  },
  {
    step: 'Step 3 · Prompt Supplier Resolution (Repair, Swap or Full Refund)',
    body: 'Our UK support team and verified suppliers respond promptly to arrange a specialist technician, a free like-for-like swap, or a free collection for a full refund in line with UK consumer law.',
  },
];

export const DeliveryReturnsPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const timelineLineRef = useRef<HTMLDivElement | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const pageEl = pageRef.current;
    if (!pageEl) return;

    const ctx = gsap.context(() => {
      const reduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const blocks = pageEl.querySelectorAll<HTMLElement>('[data-dr-reveal]');
      blocks.forEach((block) => {
        if (reduced) {
          gsap.set(block, { opacity: 1, y: 0 });
          return;
        }
        gsap.fromTo(
          block,
          { opacity: 0, y: 26 },
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

      // Numbered delivery-day GSAP timeline
      const timelineSteps = pageEl.querySelectorAll<HTMLElement>(
        '[data-dr-timeline-step]'
      );
      if (timelineLineRef.current && timelineContainerRef.current) {
        if (reduced) {
          gsap.set(timelineLineRef.current, { scaleY: 1 });
        } else {
          gsap.fromTo(
            timelineLineRef.current,
            { scaleY: 0, transformOrigin: 'top center' },
            {
              scaleY: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: timelineContainerRef.current,
                start: 'top 75%',
                end: 'bottom 65%',
                scrub: 0.6,
              },
            }
          );
        }
      }

      timelineSteps.forEach((stepEl) => {
        if (reduced) {
          gsap.set(stepEl, { opacity: 1, x: 0 });
          return;
        }
        gsap.fromTo(
          stepEl,
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.65,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: stepEl,
              start: 'top 85%',
              once: true,
            },
          }
        );
      });
    }, pageEl);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={pageRef}
      data-testid="delivery-returns-page"
      className="min-h-screen bg-bg text-text"
    >
      {/* 1. Editorial Hero */}
      <EditorialPageHero
        testId="delivery-returns-hero"
        documentTitle="Delivery & Returns"
        eyebrow="UK Supplier Dispatch & Consumer Care"
        heading="Delivery & returns, explained clearly"
        intro="All clearance deals featured on UK Clearance Hub are held physically in UK warehouses by our verified suppliers—meaning fast dispatch across Britain and straightforward, plain-English UK consumer rights."
      />

      {/* 2. Delivery Areas and Timescales */}
      <section
        data-dr-reveal
        data-testid="delivery-areas-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <SectionHeading
            eyebrow="UK-Wide Coverage"
            title="Delivery areas and timescales"
            subtitle="Our partner suppliers deliver across mainland Britain, the Scottish Highlands & Islands, and Northern Ireland."
            className="mb-12"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DELIVERY_REGIONS.map((item) => (
              <article
                key={item.region}
                className="border border-border bg-surface p-6 md:p-8 flex flex-col justify-between rounded-sm shadow-theme hover:-translate-y-1 hover:shadow-theme-hover transition-all duration-300"
              >
                <div>
                  <span className="inline-block bg-primary text-primary-contrast px-3 py-1 text-xs uppercase tracking-[0.16em] font-semibold tabular-nums mb-4 rounded-sm">
                    {item.timescale}
                  </span>
                  <h3 className="type-h3 font-heading text-text mb-3">
                    {item.region}
                  </h3>
                  <p className="type-small text-text/85 mb-4 max-w-[60ch]">
                    {item.details}
                  </p>
                </div>

                <div className="pt-4 border-t border-border text-xs text-muted">
                  <strong className="text-text font-semibold uppercase tracking-[0.12em] block mb-0.5">
                    Postcode Coverage
                  </strong>
                  {item.postcodes}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* 3. Delivery Options Cards with Prices */}
      <section
        data-dr-reveal
        data-testid="delivery-options-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <SectionHeading
            eyebrow="Transparent Service Tiers"
            title="Choose your level of delivery service"
            subtitle="Typical UK supplier delivery tiers including 20% VAT and full transit insurance from warehouse to home."
            className="mb-12"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {DELIVERY_OPTIONS.map((opt, idx) => {
              const isHighlighted = idx === 1;
              return (
                <article
                  key={opt.name}
                  data-testid={`delivery-option-card-${idx}`}
                  className={`border p-6 md:p-8 flex flex-col justify-between rounded-sm transition-all duration-300 hover:-translate-y-1 ${
                    isHighlighted
                      ? 'border-primary bg-surface-2 shadow-theme-hover'
                      : 'border-border bg-surface shadow-theme hover:shadow-theme-hover'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-xs uppercase tracking-[0.16em] text-primary font-semibold">
                        {opt.badge}
                      </span>
                      {isHighlighted && (
                        <span className="bg-accent text-white px-2.5 py-0.5 text-[0.625rem] uppercase tracking-[0.16em] font-bold rounded-sm">
                          Recommended
                        </span>
                      )}
                    </div>

                    <h3 className="type-h3 font-heading text-text mb-2">
                      {opt.name}
                    </h3>

                    <div className="flex items-baseline gap-2.5 mb-6 pb-5 border-b border-border">
                      <span className="font-heading font-bold text-4xl text-text tabular-nums">
                        {opt.price}
                      </span>
                      <span className="text-xs text-muted">
                        · {opt.subPrice}
                      </span>
                    </div>

                    <ul className="space-y-3 type-small text-text/85">
                      {opt.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-baseline gap-3">
                          <span className="text-xs font-mono text-primary font-semibold tabular-nums">
                            0{fIdx + 1}
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 4. "What happens on delivery day" Numbered GSAP Timeline */}
      <section
        data-dr-reveal
        data-testid="delivery-day-timeline-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <SectionHeading
            eyebrow="Step-by-Step Dispatch"
            title="What happens on delivery day"
            subtitle="No vague all-day waiting. Here is how supplier dispatch teams keep you informed from 48 hours out to final room placement."
            className="mb-14"
          />

          <div
            ref={timelineContainerRef}
            className="relative max-w-4xl pl-8 sm:pl-12"
          >
            {/* Background track line */}
            <div className="absolute left-3 sm:left-4 top-2 bottom-2 w-px bg-border-strong" />
            {/* Animated GSAP ScrollTrigger progress line */}
            <div
              ref={timelineLineRef}
              className="absolute left-3 sm:left-4 top-2 bottom-2 w-0.5 bg-accent origin-top"
            />

            <div className="space-y-10">
              {DELIVERY_DAY_STEPS.map((item) => (
                <div
                  key={item.step}
                  data-dr-timeline-step
                  className="relative border border-border bg-surface p-6 md:p-8 rounded-sm shadow-theme"
                >
                  {/* Numbered node badge on the timeline line */}
                  <span className="absolute -left-8 sm:-left-12 top-6 w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-contrast text-[0.6875rem] font-mono font-bold flex items-center justify-center tabular-nums rounded-xs">
                    {item.step}
                  </span>

                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-accent font-semibold">
                      {item.time}
                    </span>
                    <span className="text-xs font-mono text-muted">
                      STAGE {item.step} / 05
                    </span>
                  </div>

                  <h3 className="type-h3 font-heading text-text mb-2">
                    {item.title}
                  </h3>
                  <p className="type-small text-muted max-w-2xl">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Returns Policy for Clearance Items (Plain-English UK Consumer Rights) + Damaged Item Process */}
      <section
        data-dr-reveal
        data-testid="returns-policy-section"
        className="section-padding"
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-5">
              <Eyebrow tone="orange" className="mb-3">
                Honest, Plain-English Terms
              </Eyebrow>
              <h2 className="type-h2 font-heading text-text mb-4">
                Returns policy for clearance items &amp; your UK consumer rights
              </h2>
              <p className="type-body text-muted">
                Buying an ex-display, end-of-line, or overstock deal at genuine
                clearance prices never means giving up your legal protection.
                Here is how UK consumer law protects every order fulfilled by
                our suppliers.
              </p>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="border border-border bg-surface p-6 md:p-8 rounded-sm shadow-theme">
                <span className="text-xs uppercase tracking-[0.16em] text-primary font-semibold block mb-2">
                  1 · Change of Mind (14-Day Home Cancellation Window)
                </span>
                <h3 className="font-heading font-bold text-2xl text-text mb-3">
                  Consumer Contracts Regulations 2013
                </h3>
                <p className="type-small text-text/85 mb-3">
                  When you buy any clearance item online or by telephone for
                  home delivery from a UK supplier, you have a legal right to
                  cancel your order for any reason within{' '}
                  <strong className="font-semibold text-text">
                    14 calendar days
                  </strong>{' '}
                  starting the day after your goods are delivered.
                </p>
                <p className="type-small text-muted">
                  You may unbox and inspect your item at home just as you would
                  in a showroom. Provided the item has not been used or soiled,
                  simply notify the supplier within 14 days for collection
                  (standard collection fee up to{' '}
                  <strong className="text-text">£49</strong> for large
                  two-person furniture) and a full refund within 5 working days.
                </p>
              </div>

              <div className="border border-border bg-surface p-6 md:p-8 rounded-sm shadow-theme">
                <span className="text-xs uppercase tracking-[0.16em] text-accent font-semibold block mb-2">
                  2 · Faulty or Misdescribed Goods (30-Day Right to Reject + Supplier Warranty)
                </span>
                <h3 className="font-heading font-bold text-2xl text-text mb-3">
                  Consumer Rights Act 2015
                </h3>
                <p className="type-small text-text/85 mb-3">
                  Every item must be of satisfactory quality, fit for purpose,
                  and match its condition grading. For{' '}
                  <strong className="font-semibold text-text">
                    Ex-display
                  </strong>{' '}
                  pieces, any minor cosmetic showroom mark disclosed in the
                  product listing forms part of the description; however, if an
                  item arrives with an undisclosed fault or structural defect,
                  you have a statutory{' '}
                  <strong className="font-semibold text-text">
                    30-day short-term right to reject
                  </strong>{' '}
                  for a free collection and full refund (including delivery
                  charges).
                </p>
                <p className="type-small text-muted">
                  Beyond 30 days, you continue to be protected by your statutory
                  remedies under the Consumer Rights Act 2015 alongside any{' '}
                  <strong className="text-text">
                    applicable supplier warranty
                  </strong>{' '}
                  stated on the individual deal specification.
                </p>
              </div>
            </div>
          </div>

          {/* Damaged Item Process */}
          <div className="border-t border-border pt-16 mb-16">
            <SectionHeading
              eyebrow="48-Hour Priority Resolution"
              title="What to do if an item arrives damaged"
              subtitle="Although two-person crews blanket-wrap every load, if transit damage ever occurs it is resolved rapidly without quibble."
              className="mb-10"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DAMAGED_ITEM_STEPS.map((d) => (
                <div
                  key={d.step}
                  className="border border-border bg-surface p-6 rounded-sm shadow-theme hover:-translate-y-1 hover:shadow-theme-hover transition-all duration-300"
                >
                  <h3 className="font-heading font-bold text-xl text-text mb-2.5">
                    {d.step}
                  </h3>
                  <p className="type-small text-muted">{d.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact CTA */}
          <div className="border border-border-strong bg-bg-elevated bg-hero-glow text-text p-8 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8 rounded-sm shadow-theme">
            <div className="max-w-xl">
              <Eyebrow tone="amber" className="mb-3">
                Need Access Advice or Supplier Dispatch Support?
              </Eyebrow>
              <h2 className="type-h2 font-heading text-text mb-3">
                Speak directly with our UK support team
              </h2>
              <p className="type-small text-muted">
                Whether you have a question about supplier delivery timescales,
                staircase access, or need help with a deal enquiry—we are here
                Monday to Saturday via email or WhatsApp.
              </p>
            </div>

            <Button
              to="/contact"
              variant="cta"
              data-testid="delivery-contact-cta-btn"
              className="shrink-0"
            >
              Contact Support Team
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
};
