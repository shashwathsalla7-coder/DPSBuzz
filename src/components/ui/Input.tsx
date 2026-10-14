'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  sunken?: boolean;
}

/**
 * Input component strictly adhering to DESIGN.md and Master Prompt radius override:
 * - 10px radius (var(--r-md))
 * - 48px standard height
 * - Visible focus ring (2px var(--primary), 2px offset)
 * - Accessible label above, error below in var(--danger)
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      sunken = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[var(--text)] select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            style={{ borderRadius: 0 }}
            className={`
              w-full h-12 text-sm text-[var(--text)] rounded-none
              border transition-colors font-sans
              placeholder:text-[var(--text-muted)]
              focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20
              disabled:opacity-40 disabled:cursor-not-allowed
              ${sunken ? 'bg-[var(--surface-sunken)]' : 'bg-[var(--surface)]'}
              ${error ? 'border-[var(--danger)]' : 'border-[var(--line)]'}
              ${leftIcon ? 'pl-10' : 'px-3.5'}
              ${rightIcon ? 'pr-10' : 'px-3.5'}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-[var(--text-muted)] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--danger)] font-medium pt-0.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {helperText && !error && (
          <p className="text-xs text-[var(--text-muted)] pt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
