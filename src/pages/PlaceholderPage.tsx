import React from 'react';
import { Container, SectionHeading, Button, Eyebrow } from '../components/ui';
import { PAGE_METADATA } from '../data/navigation';

export interface PlaceholderPageProps {
  routeKey: string;
  customTitle?: string;
  customEyebrow?: string;
  customSubtitle?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  routeKey,
  customTitle,
  customEyebrow,
  customSubtitle,
}) => {
  const meta = PAGE_METADATA[routeKey] ?? PAGE_METADATA['/'];
  const title = customTitle ?? meta.title;
  const eyebrow = customEyebrow ?? meta.eyebrow;
  const subtitle = customSubtitle ?? meta.subtitle;

  return (
    <section className="section-padding min-h-[115vh] flex flex-col justify-between border-b border-[rgba(28,28,30,0.12)]">
      <Container grid className="items-start">
        <div className="col-span-12 lg:col-span-9">
          <SectionHeading
            eyebrow={eyebrow}
            eyebrowTone="red"
            title={title}
            subtitle={subtitle}
            size={routeKey === '/' ? 'display' : 'h1'}
            as="h1"
          />

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button variant="primary" to="/clearance-deals">
              Explore Clearance Deals
            </Button>
            <Button variant="outline" to="/beds/savoy-ottoman-bed">
              View Bed Specification
            </Button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 mt-12 lg:mt-2 pt-6 border-t border-[rgba(28,28,30,0.12)] flex flex-col gap-2">
          <Eyebrow tone="muted">Foundation Step 01</Eyebrow>
          <p className="type-small text-[#8A8580]">
             Editorial typography, 12-column architectural grid, and Lenis + GSAP ScrollTrigger foundation active.
          </p>
        </div>
      </Container>

      <Container grid className="mt-24 pt-8 border-t border-[rgba(28,28,30,0.12)]">
        <div className="col-span-12 sm:col-span-4">
          <Eyebrow tone="oak">Palette</Eyebrow>
          <p className="type-small text-[#1C1C1E] mt-1">
            Ivory #F3EFE9 · Charcoal #1C1C1E · Clearance Red #C8102E · Soft Oak #B89B72
          </p>
        </div>
        <div className="col-span-12 sm:col-span-4">
          <Eyebrow tone="oak">Typography</Eyebrow>
          <p className="type-small text-[#1C1C1E] mt-1">
            Cormorant Garamond Display &amp; Inter Body Prose
          </p>
        </div>
        <div className="col-span-12 sm:col-span-4">
          <Eyebrow tone="oak">Grid Architecture</Eyebrow>
          <p className="type-small text-[#1C1C1E] mt-1">
            1440px Max Width · 12 Columns · 24px Gutters
          </p>
        </div>
      </Container>
    </section>
  );
};
