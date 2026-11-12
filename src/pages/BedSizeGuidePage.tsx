import React, { useEffect, useRef, useState } from 'react';
import { gsap } from '../animations/gsap';
import {
  UK_BED_SIZE_DETAILS,
  UkBedSizeDetail,
  recommendBedSizeForRoom,
} from '../data/informativePages';
import { Container } from '../components/ui/Container';
import { Eyebrow } from '../components/ui/Eyebrow';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { EditorialPageHero } from '../components/ui/EditorialPageHero';

export const BedSizeGuidePage: React.FC = () => {
  const [selectedSizeId, setSelectedSizeId] =
    useState<UkBedSizeDetail['id']>('king');
  const [roomWidthInput, setRoomWidthInput] = useState<string>('3.0');
  const [roomLengthInput, setRoomLengthInput] = useState<string>('3.2');

  const pageRef = useRef<HTMLDivElement | null>(null);
  const dimLinesRef = useRef<SVGGElement | null>(null);

  const selectedSize =
    UK_BED_SIZE_DETAILS.find((s) => s.id === selectedSizeId) ??
    UK_BED_SIZE_DETAILS[3];

  const parsedWidth = parseFloat(roomWidthInput);
  const parsedLength = parseFloat(roomLengthInput);
  const roomRecommendation = recommendBedSizeForRoom(
    Number.isFinite(parsedWidth) ? parsedWidth : 3.0,
    Number.isFinite(parsedLength) ? parsedLength : 3.2
  );

  // Animate dimension lines when selectedSizeId changes
  useEffect(() => {
    const dimGroup = dimLinesRef.current;
    if (!dimGroup) return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    gsap.fromTo(
      dimGroup,
      { opacity: 0.25, scale: 0.985, transformOrigin: 'center center' },
      { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
    );
  }, [selectedSizeId]);

  useEffect(() => {
    const pageEl = pageRef.current;
    if (!pageEl) return;

    const ctx = gsap.context(() => {
      const reduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const blocks = pageEl.querySelectorAll<HTMLElement>('[data-bsg-reveal]');
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
    }, pageEl);

    return () => {
      ctx.revert();
    };
  }, []);

  // Scale factors for Top-Down SVG Visualiser (1 cm = 1.65 svg units, top-aligned at head end)
  const SVG_SCALE = 1.65;
  const HEAD_TOP_Y = 48;
  const ORIGIN_LEFT_X = 64;

  // Floor Plan SVG calculations for Room-Size Helper
  const roomW = roomRecommendation.roomWidthM;
  const roomL = roomRecommendation.roomLengthM;
  const recBed = roomRecommendation.recommendedSize;
  const planScale = Math.min(260 / (roomW * 100), 230 / (roomL * 100));
  const svgRoomW = roomW * 100 * planScale;
  const svgRoomL = roomL * 100 * planScale;
  const svgRoomX = (360 - svgRoomW) / 2;
  const svgRoomY = (300 - svgRoomL) / 2;
  const svgBedW = recBed.widthCm * planScale;
  const svgBedL = recBed.lengthCm * planScale;
  const svgBedX = roomRecommendation.fitsWithFullClearance
    ? svgRoomX + (svgRoomW - svgBedW) / 2
    : svgRoomX + 8;
  const svgBedY = svgRoomY;

  return (
    <div
      ref={pageRef}
      data-testid="bed-size-guide-page"
      className="min-h-screen bg-bg text-text"
    >
      {/* 1. Editorial Hero */}
      <EditorialPageHero
        testId="bed-size-guide-hero"
        documentTitle="Bed Size Guide"
        eyebrow="National Bed Federation Standards"
        heading="UK bed sizes, explained"
        intro="From a compact 3'0&quot; Single for a Victorian box room to an expansive 6'0&quot; Super King for a master suite—compare every standard British bed footprint to scale and test how each size fits your bedroom floor plan."
      />

      {/* 2. Interactive Top-Down Size Visualiser */}
      <section
        data-bsg-reveal
        data-testid="size-visualiser-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <SectionHeading
            eyebrow="Proportional Footprint Diagram"
            title="Interactive UK bed size visualiser"
            subtitle="Select a standard UK size below to compare its exact width and length against all five British bed footprints."
            className="mb-10"
          />

          {/* Size Selector Buttons */}
          <div
            role="radiogroup"
            aria-label="Select UK bed size to visualise"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-10"
          >
            {UK_BED_SIZE_DETAILS.map((spec) => {
              const active = spec.id === selectedSize.id;
              return (
                <button
                  key={spec.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  data-testid={`visualiser-size-btn-${spec.id}`}
                  onClick={() => setSelectedSizeId(spec.id)}
                  className={`p-4 text-left border transition-all cursor-pointer rounded-sm active:scale-[0.98] ${
                    active
                      ? 'bg-primary text-primary-contrast border-primary'
                      : 'bg-surface text-text border-border-strong hover:border-primary'
                  }`}
                >
                  <span className="block font-heading font-bold text-xl">
                    {spec.name}
                  </span>
                  <span
                    className={`block text-xs tabular-nums mt-1 ${
                      active ? 'opacity-85' : 'text-muted'
                    }`}
                  >
                    {spec.dimensionsCm}
                  </span>
                  <span
                    className={`block text-[0.6875rem] uppercase tracking-[0.14em] mt-0.5 ${
                      active ? 'font-bold opacity-95' : 'text-muted/80'
                    }`}
                  >
                    {spec.feetInches}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Diagram + Detail Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Top-Down SVG Scale Diagram */}
            <div className="lg:col-span-7 border border-border bg-surface p-6 md:p-8 rounded-sm shadow-theme">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted mb-4">
                <span>Top-Down Scale Comparison (1:1 Ratio)</span>
                <span className="text-text font-semibold">
                  Active: {selectedSize.name} ({selectedSize.dimensionsCm})
                </span>
              </div>

              <svg
                data-testid="size-visualiser-svg"
                viewBox="0 0 440 430"
                className="w-full h-auto max-h-[440px]"
                role="img"
                aria-label={`Top-down scale diagram highlighting ${selectedSize.name} (${selectedSize.dimensionsCm}, ${selectedSize.feetInches})`}
              >
                {/* Headboard Wall Reference Line */}
                <line
                  x1={ORIGIN_LEFT_X - 16}
                  y1={HEAD_TOP_Y}
                  x2={ORIGIN_LEFT_X + 180 * SVG_SCALE + 24}
                  y2={HEAD_TOP_Y}
                  stroke="var(--text)"
                  strokeWidth="2.5"
                />
                <text
                  x={ORIGIN_LEFT_X}
                  y={HEAD_TOP_Y - 12}
                  fontSize="10"
                  letterSpacing="2"
                  fill="var(--text-muted)"
                >
                  HEADBOARD WALL
                </text>

                {/* Render all 5 UK footprints largest-to-smallest so smaller outlines remain clickable */}
                {[...UK_BED_SIZE_DETAILS].reverse().map((spec) => {
                  const w = spec.widthCm * SVG_SCALE;
                  const h = spec.lengthCm * SVG_SCALE;
                  const isSelected = spec.id === selectedSize.id;

                  return (
                    <g
                      key={spec.id}
                      onClick={() => setSelectedSizeId(spec.id)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={ORIGIN_LEFT_X}
                        y={HEAD_TOP_Y}
                        width={w}
                        height={h}
                        fill={isSelected ? 'var(--primary)' : 'var(--surface-2)'}
                        fillOpacity={isSelected ? 0.14 : 0.6}
                        stroke={isSelected ? 'var(--accent)' : 'var(--text)'}
                        strokeOpacity={isSelected ? 1 : 0.25}
                        strokeWidth={isSelected ? 2.2 : 1}
                        strokeDasharray={isSelected ? undefined : '4 3'}
                      />
                    </g>
                  );
                })}

                {/* Active Size Pillows & Architectural Dimension Lines */}
                <g ref={dimLinesRef}>
                  {(() => {
                    const activeW = selectedSize.widthCm * SVG_SCALE;
                    const activeH = selectedSize.lengthCm * SVG_SCALE;
                    const isSingle = selectedSize.id === 'single';
                    const pillowW = isSingle
                      ? activeW * 0.68
                      : (activeW - 26) / 2;

                    return (
                      <>
                        {/* Active Highlight Border */}
                        <rect
                          x={ORIGIN_LEFT_X}
                          y={HEAD_TOP_Y}
                          width={activeW}
                          height={activeH}
                          fill="var(--primary)"
                          fillOpacity="0.16"
                          stroke="var(--text)"
                          strokeWidth="2.2"
                        />

                        {/* Pillows */}
                        {isSingle ? (
                          <rect
                            x={ORIGIN_LEFT_X + (activeW - pillowW) / 2}
                            y={HEAD_TOP_Y + 10}
                            width={pillowW}
                            height={30}
                            rx="5"
                            fill="var(--surface)"
                            stroke="var(--text)"
                            strokeWidth="1.2"
                          />
                        ) : (
                          <>
                            <rect
                              x={ORIGIN_LEFT_X + 10}
                              y={HEAD_TOP_Y + 10}
                              width={pillowW}
                              height={30}
                              rx="5"
                              fill="var(--surface)"
                              stroke="var(--text)"
                              strokeWidth="1.2"
                            />
                            <rect
                              x={ORIGIN_LEFT_X + 16 + pillowW}
                              y={HEAD_TOP_Y + 10}
                              width={pillowW}
                              height={30}
                              rx="5"
                              fill="var(--surface)"
                              stroke="var(--text)"
                              strokeWidth="1.2"
                            />
                          </>
                        )}

                        {/* Width Dimension Line at Bottom */}
                        <line
                          x1={ORIGIN_LEFT_X}
                          y1={HEAD_TOP_Y + activeH + 22}
                          x2={ORIGIN_LEFT_X + activeW}
                          y2={HEAD_TOP_Y + activeH + 22}
                          stroke="var(--accent)"
                          strokeWidth="1.6"
                        />
                        <line
                          x1={ORIGIN_LEFT_X}
                          y1={HEAD_TOP_Y + activeH + 16}
                          x2={ORIGIN_LEFT_X}
                          y2={HEAD_TOP_Y + activeH + 28}
                          stroke="var(--accent)"
                          strokeWidth="1.6"
                        />
                        <line
                          x1={ORIGIN_LEFT_X + activeW}
                          y1={HEAD_TOP_Y + activeH + 16}
                          x2={ORIGIN_LEFT_X + activeW}
                          y2={HEAD_TOP_Y + activeH + 28}
                          stroke="var(--accent)"
                          strokeWidth="1.6"
                        />
                        <text
                          x={ORIGIN_LEFT_X + activeW / 2}
                          y={HEAD_TOP_Y + activeH + 40}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill="var(--text)"
                        >
                          WIDTH: {selectedSize.widthCm} cm (
                          {selectedSize.feetInches.split('×')[0].trim()})
                        </text>

                        {/* Length Dimension Line on Left */}
                        <line
                          x1={ORIGIN_LEFT_X - 22}
                          y1={HEAD_TOP_Y}
                          x2={ORIGIN_LEFT_X - 22}
                          y2={HEAD_TOP_Y + activeH}
                          stroke="var(--accent)"
                          strokeWidth="1.6"
                        />
                        <line
                          x1={ORIGIN_LEFT_X - 28}
                          y1={HEAD_TOP_Y}
                          x2={ORIGIN_LEFT_X - 16}
                          y2={HEAD_TOP_Y}
                          stroke="var(--accent)"
                          strokeWidth="1.6"
                        />
                        <line
                          x1={ORIGIN_LEFT_X - 28}
                          y1={HEAD_TOP_Y + activeH}
                          x2={ORIGIN_LEFT_X - 16}
                          y2={HEAD_TOP_Y + activeH}
                          stroke="var(--accent)"
                          strokeWidth="1.6"
                        />
                        <text
                          x={ORIGIN_LEFT_X - 34}
                          y={HEAD_TOP_Y + activeH / 2}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill="var(--text)"
                          transform={`rotate(-90, ${ORIGIN_LEFT_X - 34}, ${
                            HEAD_TOP_Y + activeH / 2
                          })`}
                        >
                          LENGTH: {selectedSize.lengthCm} cm (
                          {selectedSize.feetInches.split('×')[1].trim()})
                        </text>
                      </>
                    );
                  })()}
                </g>
              </svg>
            </div>

            {/* Active Size Details Card */}
            <div
              data-testid="visualiser-detail-card"
              className="lg:col-span-5 border border-border bg-surface p-6 md:p-8 space-y-6 rounded-sm shadow-theme"
            >
              <div className="border-b border-border pb-5">
                <Eyebrow tone="orange" className="mb-2">
                  Selected UK Standard Size
                </Eyebrow>
                <h3
                  data-testid="visualiser-selected-title"
                  className="type-h2 font-heading text-text"
                >
                  {selectedSize.name}
                </h3>
                <p
                  data-testid="visualiser-selected-dims"
                  className="text-sm font-semibold text-muted tabular-nums mt-1"
                >
                  {selectedSize.dimensionsCm} · Imperial {selectedSize.feetInches}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="block text-xs uppercase tracking-[0.16em] text-muted mb-1">
                    Who it suits
                  </span>
                  <p
                    data-testid="visualiser-who-it-suits"
                    className="type-body text-text"
                  >
                    {selectedSize.whoItSuits}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-surface-2 p-4 border border-border rounded-sm">
                  <div>
                    <span className="block text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
                      Width per Sleeper
                    </span>
                    <strong className="text-base font-bold text-text tabular-nums">
                      {selectedSize.perPersonWidthCm} cm
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
                      Min Comfortable Room
                    </span>
                    <strong className="text-base font-bold text-text tabular-nums">
                      {selectedSize.idealRoomMinimum}
                    </strong>
                  </div>
                </div>

                <p className="type-small text-muted">{selectedSize.notes}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Room-Size Helper (Metres Inputs + 60 cm Clearance Calculation + Live SVG Floor Plan) */}
      <section
        data-bsg-reveal
        data-testid="room-size-helper-section"
        className="section-padding border-b border-border"
      >
        <Container>
          <SectionHeading
            eyebrow="60 cm Circulation Rule"
            title="Room-size calculator & floor planner"
            subtitle="Enter your bedroom width and length in metres. British interior design standards recommend keeping at least 60 cm of clear walkway on each side of the bed and at the foot end so drawers and wardrobes open effortlessly."
            className="mb-12"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center border border-border bg-surface p-6 md:p-10 rounded-sm shadow-theme">
            {/* Left: Inputs & Recommendation */}
            <div className="lg:col-span-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="room-width-input"
                    className="block text-xs uppercase tracking-[0.16em] text-text font-semibold mb-2"
                  >
                    Room Width (metres)
                  </label>
                  <input
                    id="room-width-input"
                    data-testid="room-width-input"
                    type="number"
                    min={1.5}
                    max={8.0}
                    step={0.1}
                    value={roomWidthInput}
                    onChange={(e) => setRoomWidthInput(e.target.value)}
                    className="w-full bg-surface-2 border border-border-strong px-4 py-3 text-base text-text tabular-nums focus:border-primary focus:outline-none rounded-sm transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="room-length-input"
                    className="block text-xs uppercase tracking-[0.16em] text-text font-semibold mb-2"
                  >
                    Room Length (metres)
                  </label>
                  <input
                    id="room-length-input"
                    data-testid="room-length-input"
                    type="number"
                    min={1.8}
                    max={8.0}
                    step={0.1}
                    value={roomLengthInput}
                    onChange={(e) => setRoomLengthInput(e.target.value)}
                    className="w-full bg-surface-2 border border-border-strong px-4 py-3 text-base text-text tabular-nums focus:border-primary focus:outline-none rounded-sm transition-colors"
                  />
                </div>
              </div>

              {/* Recommendation Output Card */}
              <div
                data-testid="room-helper-result"
                className="bg-surface-2 border border-border-strong p-6 space-y-4 rounded-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-accent font-semibold">
                    Largest Comfortable Fit
                  </span>
                  <span className="text-xs text-muted tabular-nums">
                    Min 60 cm walkway rule
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <h3
                    data-testid="room-recommended-bed-name"
                    className="type-h2 font-heading text-text"
                  >
                    {roomRecommendation.recommendedSize.name}
                  </h3>
                  <span className="text-sm text-muted tabular-nums">
                    ({roomRecommendation.recommendedSize.dimensionsCm} ·{' '}
                    {roomRecommendation.recommendedSize.feetInches})
                  </span>
                </div>

                <p
                  data-testid="room-recommended-summary"
                  className="type-small text-text/85 max-w-2xl"
                >
                  {roomRecommendation.summaryText}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border text-xs tabular-nums">
                  <div>
                    <span className="block uppercase tracking-[0.14em] text-muted">
                      Walkway Each Side
                    </span>
                    <strong
                      data-testid="room-side-clearance-cm"
                      className="text-sm text-text font-bold"
                    >
                      {roomRecommendation.sideClearanceCmEach} cm
                    </strong>
                  </div>
                  <div>
                    <span className="block uppercase tracking-[0.14em] text-muted">
                      Foot-End Clearance
                    </span>
                    <strong
                      data-testid="room-foot-clearance-cm"
                      className="text-sm text-text font-bold"
                    >
                      {roomRecommendation.footClearanceCm} cm
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Proportional SVG Room Floor Plan */}
            <div className="lg:col-span-6 bg-surface-2 border border-border-strong p-6 flex flex-col items-center rounded-sm">
              <div className="w-full flex items-center justify-between text-xs uppercase tracking-[0.15em] text-muted mb-3">
                <span>Live Room Floor Plan</span>
                <span className="tabular-nums text-text font-semibold">
                  {roomW.toFixed(1)}m × {roomL.toFixed(1)}m
                </span>
              </div>

              <svg
                data-testid="room-floorplan-svg"
                viewBox="0 0 360 300"
                className="w-full max-w-[380px] h-auto"
                role="img"
                aria-label={`Floor plan showing a ${recBed.name} bed inside a ${roomW.toFixed(1)}m by ${roomL.toFixed(1)}m room`}
              >
                {/* Room Perimeter Walls */}
                <rect
                  x={svgRoomX}
                  y={svgRoomY}
                  width={svgRoomW}
                  height={svgRoomL}
                  fill="var(--bg)"
                  stroke="var(--text)"
                  strokeWidth="3"
                />

                {/* 60cm Walkway Guides */}
                {roomRecommendation.fitsWithFullClearance && (
                  <>
                    {/* Left walkway dashed zone */}
                    <line
                      x1={svgRoomX}
                      y1={svgBedY + svgBedL / 2}
                      x2={svgBedX}
                      y2={svgBedY + svgBedL / 2}
                      stroke="var(--primary)"
                      strokeDasharray="3 3"
                      strokeWidth="1.4"
                    />
                    <text
                      x={svgRoomX + (svgBedX - svgRoomX) / 2}
                      y={svgBedY + svgBedL / 2 - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--primary)"
                      fontWeight="600"
                    >
                      {roomRecommendation.sideClearanceCmEach}cm
                    </text>

                    {/* Right walkway dashed zone */}
                    <line
                      x1={svgBedX + svgBedW}
                      y1={svgBedY + svgBedL / 2}
                      x2={svgRoomX + svgRoomW}
                      y2={svgBedY + svgBedL / 2}
                      stroke="var(--primary)"
                      strokeDasharray="3 3"
                      strokeWidth="1.4"
                    />
                    <text
                      x={
                        svgBedX +
                        svgBedW +
                        (svgRoomX + svgRoomW - (svgBedX + svgBedW)) / 2
                      }
                      y={svgBedY + svgBedL / 2 - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--primary)"
                      fontWeight="600"
                    >
                      {roomRecommendation.sideClearanceCmEach}cm
                    </text>

                    {/* Foot-end clearance dashed line */}
                    <line
                      x1={svgBedX + svgBedW / 2}
                      y1={svgBedY + svgBedL}
                      x2={svgBedX + svgBedW / 2}
                      y2={svgRoomY + svgRoomL}
                      stroke="var(--primary)"
                      strokeDasharray="3 3"
                      strokeWidth="1.4"
                    />
                    <text
                      x={svgBedX + svgBedW / 2 + 24}
                      y={
                        svgBedY +
                        svgBedL +
                        (svgRoomY + svgRoomL - (svgBedY + svgBedL)) / 2
                      }
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--primary)"
                      fontWeight="600"
                    >
                      {roomRecommendation.footClearanceCm}cm
                    </text>
                  </>
                )}

                {/* Recommended Bed Footprint */}
                <rect
                  x={svgBedX}
                  y={svgBedY}
                  width={svgBedW}
                  height={svgBedL}
                  fill="var(--navy-deep)"
                  fillOpacity="0.95"
                  stroke="var(--primary)"
                  strokeWidth="1.5"
                />
                <text
                  x={svgBedX + svgBedW / 2}
                  y={svgBedY + svgBedL / 2}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  fontWeight="600"
                >
                  {recBed.name.toUpperCase()}
                </text>
                <text
                  x={svgBedX + svgBedW / 2}
                  y={svgBedY + svgBedL / 2 + 13}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="var(--amber)"
                >
                  {recBed.dimensionsCm}
                </text>
              </svg>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Note about EU vs UK sizes + CTA to /clearance-deals?category=Beds */}
      <section data-bsg-reveal className="section-padding">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16 items-start">
            <div className="lg:col-span-5">
              <Eyebrow tone="orange" className="mb-3">
                Important Compatibility Note
              </Eyebrow>
              <h2 className="type-h2 font-heading text-text mb-4">
                Continental (EU / IKEA) vs British bed sizes
              </h2>
              <p className="type-body text-muted">
                One of the most frequent mistakes when buying a replacement
                mattress or bed frame in the UK is mixing Continental European
                sizes (sold by IKEA and imported European brands) with standard
                British National Bed Federation sizes.
              </p>
            </div>

            <div className="lg:col-span-7 border border-border bg-surface p-6 md:p-8 space-y-4 rounded-sm shadow-theme">
              <div className="grid grid-cols-3 text-xs uppercase tracking-[0.16em] text-muted pb-3 border-b border-border font-semibold">
                <span>Size Tier</span>
                <span>Standard UK Size</span>
                <span>Continental / EU Size</span>
              </div>

              {[
                ['Single', '90 × 190 cm (3\'0" × 6\'3")', '90 × 200 cm (10 cm longer)'],
                ['Double', '135 × 190 cm (4\'6" × 6\'3")', '140 × 200 cm (5 cm wider, 10 cm longer)'],
                ['King', '150 × 200 cm (5\'0" × 6\'6")', '160 × 200 cm (10 cm wider)'],
                ['Super King', '180 × 200 cm (6\'0" × 6\'6")', '180 × 200 cm (Identical footprint)'],
              ].map(([tier, uk, eu]) => (
                <div
                  key={tier}
                  className="grid grid-cols-3 gap-2 py-2.5 border-b border-border type-small"
                >
                  <strong className="font-heading font-bold text-lg text-text">
                    {tier}
                  </strong>
                  <span className="text-text font-semibold tabular-nums">
                    {uk}
                  </span>
                  <span className="text-muted tabular-nums">{eu}</span>
                </div>
              ))}

              <p className="text-xs text-muted pt-2">
                All beds, mattresses, and headboards featured on{' '}
                <strong className="text-text font-semibold">
                  UK Clearance Hub
                </strong>{' '}
                are built strictly to standard British dimensions so your UK
                fitted sheets, divans, and mattresses always fit flush.
              </p>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="border border-border-strong bg-bg-elevated bg-hero-glow text-text p-8 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8 rounded-sm shadow-theme">
            <div className="max-w-xl">
              <Eyebrow tone="amber" className="mb-3">
                Single to Super King · Genuine Clearance Deals
              </Eyebrow>
              <h2 className="type-h2 font-heading text-text mb-3">
                Ready to choose your clearance bed frame?
              </h2>
              <p className="type-small text-muted">
                Browse our live clearance range of upholstered ottoman beds,
                winged bedsteads, and solid European oak frames in standard UK
                sizes.
              </p>
            </div>

            <Button
              to="/deals?category=Home+%26+Living&subcategory=Beds"
              variant="cta"
              data-testid="bed-size-guide-cta-btn"
              className="shrink-0"
            >
              Browse Clearance Beds
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
};
