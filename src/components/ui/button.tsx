'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#1B4965] text-white hover:bg-[#153a52] active:bg-[#0f2d40] focus-visible:ring-[#1B4965]',
  secondary:
    'border-2 border-[#1B4965] text-[#1B4965] bg-white hover:bg-[#1B4965]/5 active:bg-[#1B4965]/10 focus-visible:ring-[#1B4965]',
  danger:
    'bg-[#722F37] text-white hover:bg-[#5f272e] active:bg-[#4d1f25] focus-visible:ring-[#722F37]',
  success:
    'bg-[#2D6A4F] text-white hover:bg-[#245740] active:bg-[#1b4432] focus-visible:ring-[#2D6A4F]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm rounded-lg',
  md: 'h-12 px-5 text-base rounded-xl',
  lg: 'h-14 px-6 text-lg rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-colors duration-150 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        select-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
