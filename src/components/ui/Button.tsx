import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  to?: string;
  showArrow?: boolean;
  size?: 'md' | 'lg';
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
    'group inline-flex items-center justify-center gap-3 font-sans font-medium tracking-wide whitespace-nowrap shrink-0 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C1C1E] cursor-pointer';

  const sizeClasses =
    size === 'lg'
      ? 'px-8 py-4 text-sm min-h-[52px]'
      : 'px-6 py-3.5 text-xs uppercase tracking-[0.14em] min-h-[44px]';

  const variantClasses =
    variant === 'primary'
      ? 'bg-[#1C1C1E] text-[#F3EFE9] border border-[#1C1C1E] hover:bg-[#2E2E32]'
      : 'bg-transparent text-[#1C1C1E] border border-[#1C1C1E]/30 hover:border-[#1C1C1E] hover:bg-[#1C1C1E]/[0.04]';

  const combinedClasses = `${baseClasses} ${sizeClasses} ${variantClasses} ${className}`.trim();

  const content = (
    <>
      <span>{children}</span>
      {showArrow && (
        <ArrowRight
          aria-hidden="true"
          className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-1.5"
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClasses}>
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
