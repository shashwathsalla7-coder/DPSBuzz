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
  default: 'bg-[var(--card-hover)] text-[var(--foreground)] border border-[var(--border-color)]',
  primary: 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20',
  success: 'bg-[#16A34A]/15 text-[#16A34A] dark:text-[#22c55e]',
  warning: 'bg-[#FFB020]/15 text-[#B45309] dark:text-[#FFB020]', // Dark text on amber tint for high contrast
  error: 'bg-[#DC2626]/15 text-[#DC2626]',
  urgent: 'bg-[#DC2626] text-white font-bold', // Red reserved for urgent notices & critical alerts
  reward: 'bg-[#FFB020]/15 text-[#D97706] dark:text-[#F5B301] border border-[#FFB020]/30 font-semibold', // Amber/gold reserved for rewards
  verified: 'bg-[var(--primary)]/15 text-[var(--primary)] font-semibold',
  exams: 'bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60a5fa]',
  holidays: 'bg-[#16A34A]/15 text-[#16A34A] dark:text-[#4ade80]',
  events: 'bg-[#FF4D8D]/15 text-[#E11D48] dark:text-[#FF4D8D]',
  sports: 'bg-[#F97316]/15 text-[#EA580C] dark:text-[#FB923C]',
  fees: 'bg-[#0891B2]/15 text-[#0891B2] dark:text-[#22d3ee]',
};

/**
 * Small badge/chip for labels, categories, status indicators.
 * The 'verified' variant is used for "Verified by School" badges.
 */
const Badge: FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', icon, className = '' }) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-[6px] chip-radius
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {icon}
      {children}
    </span>
  );
};

export default Badge;
