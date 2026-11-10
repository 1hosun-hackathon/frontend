import React from 'react';

export function Eyebrow({ children, ...props }) {
  return (
    <span
      className="eyebrow block text-xs tracking-0.5 text-[#796052] font-extrabold"
      {...props}
    >
      {children}
    </span>
  );
}

export function MutedText({ as: Component = 'p', children, ...props }) {
  return (
    <Component className="text-[#7B8078] leading-[1.8]" {...props}>
      {children}
    </Component>
  );
}

export function FieldLabel({ children, ...props }) {
  return (
    <label className="mt-7 mb-2.5 block text-sm font-semibold" {...props}>
      {children}
    </label>
  );
}
