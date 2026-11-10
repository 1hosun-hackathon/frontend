import React from 'react';

export default function TwoColumnGrid({ children, ...props }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" {...props}>
      {children}
    </div>
  );
}
