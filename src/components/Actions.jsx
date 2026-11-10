import React from 'react';

export default function Actions({ children, ...props }) {
  return (
    <div
      className="actions flex flex-wrap items-center justify-end gap-3 pt-1"
      {...props}
    >
      {children}
    </div>
  );
}
