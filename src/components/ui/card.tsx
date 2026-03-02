'use client';

import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

export default function Card({
  title,
  subtitle,
  onClick,
  className = '',
  children,
}: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`
        w-full bg-white rounded-2xl shadow-sm border border-gray-100
        p-5
        ${onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.99] transition-all duration-150 text-left' : ''}
        ${className}
      `.trim()}
    >
      {(title || subtitle) && (
        <div className="mb-3">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </Component>
  );
}
