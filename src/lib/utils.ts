import { formatDistanceToNow } from 'date-fns';

/**
 * Format a timestamp into a relative time string like "2h ago".
 */
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format a number for display (1000 -> "1K", etc.)
 */
export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Generate a random color from the brand palette.
 */
export function randomBrandColor(): string {
  const colors = ['#833AB4', '#C13584', '#F77737', '#FCAF45'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Validate username format: lowercase letters, numbers, dots, underscores.
 */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_.]{3,20}$/.test(username);
}

/**
 * Class name helper - filters out falsy values and joins.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
