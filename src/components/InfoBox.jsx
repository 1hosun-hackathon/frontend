import React from 'react';

export default function InfoBox({ children, ...props }) {
  return (
    <div
      className="rounded-2.5 bg-[#F5F5F2] p-5 [&_p]:mt-3 [&_p]:mb-0 [&_p]:text-sm [&_p]:leading-relaxed"
      {...props}
    >
      {children}
    </div>
  );
}
