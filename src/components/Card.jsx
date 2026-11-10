import React from 'react';

export default function Card({
  as: Component = 'div',
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      className={`card-content rounded-2xl border border-[#E6E9E4] bg-white p-5 sm:p-8 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
