import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'orange' | 'cta' | 'outline' | 'ghost';
  to?: string;
  showArrow?: boolean;
  size?: 'md' | 'lg';
  'data-testid'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  to,
  showArrow = true,
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) => {
  const baseClasses =
    'group inline-flex items-center justify-center gap-3 font-heading font-bold whitespace-nowrap shrink-0 rounded-lg hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus cursor-pointer shadow-theme-hover';

  const sizeClasses =
    size === 'lg'
      ? 'px-8 py-4 text-sm tracking-normal min-h-[52px]'
      : 'px-6 py-3 text-xs uppercase tracking-[0.08em] min-h-[44px]';

  const variantClasses =
    variant === 'orange' || variant === 'cta'
      ? 'bg-accent text-white border border-accent hover:bg-accent-hover hover:border-accent-hover'
      : variant === 'primary'
        ? 'bg-primary text-[var(--primary-contrast)] border border-primary hover:bg-primary-hover hover:border-primary-hover'
        : variant === 'ghost'
          ? 'bg-surface-2 text-text border border-border hover:border-primary hover:text-primary'
          : 'bg-transparent text-text border border-border-strong hover:border-primary hover:text-primary hover:bg-surface-2';

  const combinedClasses = `${baseClasses} ${sizeClasses} ${variantClasses} ${className}`.trim();

  const content = (
    <>
      <span>{children}</span>
      {showArrow && (
        <ArrowRight
          aria-hidden="true"
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5"
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={combinedClasses}
        data-testid={props['data-testid']}
        aria-label={props['aria-label']}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={combinedClasses} {...props}>
      {content}
    </button>
  );
};
