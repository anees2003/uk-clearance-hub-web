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
    <section className="section-padding min-h-[115vh] flex flex-col justify-between border-b border-border bg-bg text-text">
      <Container grid className="items-start">
        <div className="col-span-12 lg:col-span-9">
          <SectionHeading
            eyebrow={eyebrow}
            eyebrowTone="orange"
            title={title}
            subtitle={subtitle}
            size={routeKey === '/' ? 'display' : 'h1'}
            as="h1"
          />

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button variant="cta" to="/deals">
              Shop Clearance Deals
            </Button>
            <Button variant="outline" to="/beds/savoy-ottoman-bed">
              View Bed Specification
            </Button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 mt-12 lg:mt-2 pt-6 border-t border-border flex flex-col gap-2">
          <Eyebrow tone="muted">UK Clearance Hub</Eyebrow>
          <p className="type-small text-muted">
            Plus Jakarta Sans &amp; Inter typography, 12-column grid, and Lenis + GSAP ScrollTrigger active.
          </p>
        </div>
      </Container>

      <Container grid className="mt-24 pt-8 border-t border-border">
        <div className="col-span-12 sm:col-span-4">
          <Eyebrow tone="blue">Brand Palette</Eyebrow>
          <p className="type-small text-text mt-1">
            Semantic Dark &amp; Light Theme Tokens Active
          </p>
        </div>
        <div className="col-span-12 sm:col-span-4">
          <Eyebrow tone="blue">Typography</Eyebrow>
          <p className="type-small text-text mt-1">
            Plus Jakarta Sans Headings &amp; Inter Body Prose
          </p>
        </div>
        <div className="col-span-12 sm:col-span-4">
          <Eyebrow tone="blue">Grid Architecture</Eyebrow>
          <p className="type-small text-text mt-1">
            1440px Max Width · 12 Columns · 24px Gutters
          </p>
        </div>
      </Container>
    </section>
  );
};
