import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  grid?: boolean;
  as?: 'div' | 'section' | 'article' | 'header' | 'footer';
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  grid = false,
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component
      className={`container-editorial w-full max-w-[1440px] mx-auto px-[clamp(1.25rem,4vw,3rem)] ${
        grid ? 'grid-12' : ''
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
};
