import React from 'react';

export interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {
  tone?: 'muted' | 'charcoal' | 'red' | 'oak';
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
    muted: 'text-[#8A8580]',
    charcoal: 'text-[#1C1C1E]',
    red: 'text-[#C8102E]',
    oak: 'text-[#B89B72]',
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
