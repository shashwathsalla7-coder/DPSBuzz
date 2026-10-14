'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive' | 'conversion' | 'gold';
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
    'bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)] active:scale-[0.96] border border-transparent shadow-none',
  secondary:
    'bg-transparent text-[var(--text)] border border-[var(--line-strong)] hover:bg-[var(--surface-sunken)] active:scale-[0.96]',
  quiet:
    'bg-transparent text-[var(--primary)] border border-transparent hover:bg-[var(--primary-tint)] active:scale-[0.96]',
  destructive:
    'bg-[var(--danger)] text-white hover:opacity-90 active:scale-[0.96] border border-transparent',
  conversion:
    'bg-[var(--accent-cta)] text-[var(--on-accent-cta)] hover:bg-[var(--accent-cta-hover)] active:scale-[0.96] border border-transparent shadow-sm font-bold',
  gold:
    'bg-[var(--gold-cta)] text-[var(--on-gold-cta)] hover:bg-[var(--gold-hover)] active:scale-[0.96] border border-transparent shadow-sm font-bold',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-11 px-4 text-sm font-semibold gap-2',
  lg: 'h-12 px-6 text-sm font-bold gap-2',
};

/**
 * Button component strictly adhering to DESIGN.md and Master Prompt radius override:
 * - Exactly 10px radius (var(--r-md))
 * - No pill-shapes, no gradients
 * - 44px minimum tap target for md/lg sizes
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
        style={{ borderRadius: 0 }}
        className={`
          inline-flex items-center justify-center rounded-none
          transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]
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
