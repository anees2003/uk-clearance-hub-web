import React from 'react';
import { useParams } from 'react-router-dom';
import { formatBedSlugTitle } from '../data/navigation';
import { PlaceholderPage } from './PlaceholderPage';

export const BedDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const bedTitle = formatBedSlugTitle(slug);

  return (
    <PlaceholderPage
      routeKey="/beds/:slug"
      customEyebrow="Handcrafted British Bed Frame · Clearance Specification"
      customTitle={bedTitle}
      customSubtitle="Bespoke upholstered and solid timber bed frames prepared for immediate UK mainland dispatch."
    />
  );
};
