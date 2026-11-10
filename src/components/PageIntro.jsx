import React from 'react';

export default function PageIntro({
  as: Component = 'section',
  children,
  ...props
}) {
  return (
    <Component
      className="page-intro py-3 [&_h1]:text-4xl [&_h1]:leading-[1.3] max-sm:[&_h1]:text-3xl"
      {...props}
    >
      {children}
    </Component>
  );
}
