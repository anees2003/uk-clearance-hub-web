import React from 'react';
import { Eyebrow, EyebrowProps } from './Eyebrow';

export interface SectionHeadingProps {
  eyebrow?: string;
  eyebrowTone?: EyebrowProps['tone'];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: 'display' | 'h1' | 'h2' | 'h3';
  as?: 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  eyebrowTone = 'muted',
  title,
  subtitle,
  size = 'h2',
  as,
  align = 'left',
  className = '',
}) => {
  const HeadingTag = as ?? (size === 'display' ? 'h1' : size);
  const sizeClassMap: Record<NonNullable<SectionHeadingProps['size']>, string> = {
    display: 'type-display',
    h1: 'type-h1',
    h2: 'type-h2',
    h3: 'type-h3',
  };

  const alignClasses =
    align === 'center' ? 'text-center items-center mx-auto' : 'text-left items-start';

  return (
    <div className={`flex flex-col gap-3.5 max-w-4xl ${alignClasses} ${className}`.trim()}>
      {eyebrow && <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>}
      <HeadingTag className={`${sizeClassMap[size]} text-text`}>
        {title}
      </HeadingTag>
      {subtitle && (
        <p className="type-body text-muted max-w-2xl mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
