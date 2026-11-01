'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'ghost' | 'destructive' | 'danger' | 'conversion' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] border border-transparent shadow-xs',
  secondary:
    'bg-[var(--surface)] text-[var(--text)] border border-[var(--line-strong)] hover:bg-[var(--surface-sunken)] active:scale-[0.98]',
  quiet:
    'bg-transparent text-[var(--primary)] border border-transparent hover:bg-[var(--primary-tint)] active:scale-[0.98]',
  ghost:
    'bg-transparent text-[var(--text)] border border-transparent hover:bg-[var(--surface-sunken)] active:scale-[0.98]',
  destructive:
    'bg-[var(--danger)] text-white hover:opacity-90 active:scale-[0.98] border border-transparent shadow-xs',
  danger:
    'bg-[var(--danger)] text-white hover:opacity-90 active:scale-[0.98] border border-transparent shadow-xs',
  conversion:
    'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] border border-transparent shadow-xs font-semibold',
  gold:
    'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] border border-transparent shadow-xs font-semibold',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] h-9 px-3 text-xs gap-1.5',
  md: 'min-h-[44px] h-11 px-4 text-sm font-semibold gap-2',
  lg: 'min-h-[48px] h-12 px-6 text-sm font-semibold gap-2',
};

/**
 * Button component adhering to Unified Calm Design System:
 * - 12px moderate rounded corners
 * - 44px minimum tap target for accessibility
 * - No heavy shadows, no card gradients
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center rounded-[12px]
          transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)]
          disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed
          cursor-pointer select-none font-sans
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
