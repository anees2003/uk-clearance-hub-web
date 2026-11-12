import React from 'react';

export interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {
  tone?: 'muted' | 'charcoal' | 'red' | 'oak' | 'navy' | 'orange' | 'blue' | 'amber';
  as?: 'p' | 'span' | 'div';
}

export const Eyebrow: React.FC<EyebrowProps> = ({
  children,
  tone = 'muted',
  as: Component = 'p',
  className = '',
  ...props
}) => {
  const toneClasses: Record<NonNullable<EyebrowProps['tone']>, string> = {
    muted: 'text-muted',
    charcoal: 'text-text',
    navy: 'text-text',
    red: 'text-accent',
    orange: 'text-accent',
    oak: 'text-primary',
    blue: 'text-primary',
    amber: 'text-amber',
  };

  return (
    <Component
      className={`type-eyebrow ${toneClasses[tone]} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
};
