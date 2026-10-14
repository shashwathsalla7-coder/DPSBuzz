'use client';

import { type FC } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Toggle switch for settings (dark mode, notifications, etc.).
 * Large tap target for mobile use.
 */
const Toggle: FC<ToggleProps> = ({ checked, onChange, label, description, disabled = false }) => {
  return (
    <label className={`flex items-center justify-between gap-4 min-h-[48px] cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {(label || description) && (
        <div className="flex-1">
          {label && <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>}
          {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
        </div>
      )}
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-7 w-12 flex-shrink-0 rounded-full
          transition-colors duration-200 ease-in-out
          cursor-pointer
          ${checked ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md
            transition-transform duration-200 ease-in-out
            mt-1
            ${checked ? 'translate-x-6 ml-0' : 'translate-x-1'}
          `}
        />
      </button>
    </label>
  );
};

export default Toggle;
