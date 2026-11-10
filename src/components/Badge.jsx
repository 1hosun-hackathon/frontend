import React from 'react';

export default function Badge({ children, ...props }) {
  return (
    <span
      className="inline-flex rounded-full bg-[#F1F3EF] px-3 py-1 text-xs font-semibold text-[#59654F]"
      {...props}
    >
      {children}
    </span>
  );
}
