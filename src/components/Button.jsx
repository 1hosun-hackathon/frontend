import React from 'react';

const variants = {
  primary: '',
  secondary: 'border border-[#D8DDD5] !bg-white !text-[#59654F]',
  danger:
    '!border !border-[#E3D8D4] !bg-white !text-[#98665C] hover:!bg-[#FCF7F6]',
};
const compactVariants = {
  primary: 'bg-[#727D67] text-white',
  secondary: 'border border-[#D8DDD5] bg-white text-[#59654F]',
  danger: 'bg-[#A4524B] text-white',
};

export default function Button({
  variant = 'primary',
  size = 'default',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={
        size === 'compact'
          ? `rounded-xl px-5 py-2.5 text-sm font-semibold ${compactVariants[variant]} ${className}`
          : `rounded-xl bg-[#727D67] px-6 py-3.5 font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`
      }
      {...props}
    >
      {children}
    </button>
  );
}
