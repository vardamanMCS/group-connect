'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helper ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-base font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [errorId, helperId].filter(Boolean).join(' ') || undefined
          }
          className={`
            w-full h-14 px-4 text-lg
            bg-white border-2 rounded-xl
            transition-colors duration-150
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
            ${
              error
                ? 'border-[#722F37] focus:ring-[#722F37]/30 focus:border-[#722F37]'
                : 'border-gray-200 focus:ring-[#1B4965]/30 focus:border-[#1B4965]'
            }
            ${className}
          `.trim()}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-[#722F37] font-medium" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
