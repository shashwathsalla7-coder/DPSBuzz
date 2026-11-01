import { type FC, type ReactNode } from 'react';

type BadgeVariant = 
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'urgent'
  | 'reward'
  | 'verified'
  | 'exams'
  | 'holidays'
  | 'events'
  | 'sports'
  | 'fees';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface-sunken)] text-[var(--text)] border border-[var(--line)]',
  primary: 'bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/20',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  warning: 'bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/20',
  error: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20',
  urgent: 'bg-red-600 text-white font-bold',
  reward: 'bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/30 font-semibold',
  verified: 'bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/20 font-semibold',
  exams: 'bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/20',
  holidays: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  events: 'bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/20',
  sports: 'bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/20',
  fees: 'bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/20',
};

/**
 * Small badge/chip for labels, categories, status indicators.
 * Numbers > 9 automatically format as '9+'.
 */
const Badge: FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', icon, className = '' }) => {
  let displayContent = children;
  if (typeof children === 'number') {
    displayContent = children > 9 ? '9+' : children;
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {icon}
      {displayContent}
    </span>
  );
};

export default Badge;
