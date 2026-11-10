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
      className={`container-editorial ${grid ? 'grid-12' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
};
