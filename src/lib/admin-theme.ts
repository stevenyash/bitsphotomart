/**
 * Centralized Admin Theme Constants
 * Use these constants for consistent styling across all admin pages
 * Based on CSS variables defined in globals.css
 */

// Text colors - use these instead of hardcoded Tailwind colors
export const theme = {
  // Backgrounds
  background: 'bg-[var(--background)]',
  card: 'bg-[var(--card)]',
  secondary: 'bg-[var(--secondary)]',
  muted: 'bg-[var(--muted)]',
  accent: 'bg-[var(--accent)]',
  
  // Primary colors
  primaryBg: 'bg-[var(--primary)]',
  primaryFg: 'text-[var(--primary-foreground)]',
  primary: 'text-[var(--primary)]',
  primaryHover: 'hover:bg-[var(--primary)]/90',
  
  // Text colors
  foreground: 'text-[var(--foreground)]',
  secondaryForeground: 'text-[var(--secondary-foreground)]',
  mutedForeground: 'text-[var(--muted-foreground)]',
  accentForeground: 'text-[var(--accent-foreground)]',
  
  // Border
  border: 'border-[var(--border)]',
  input: 'bg-[var(--input)]',
  
  // Admin specific
  adminHeader: 'bg-[var(--admin-header)]',
  adminHeaderForeground: 'text-[var(--admin-header-foreground)]',
  tableHeader: 'bg-[var(--table-header)]',
  tableRowHover: 'hover:bg-[var(--table-row-hover)]',
  
  // Common combinations
  cardStyle: 'bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm',
  cardHover: 'hover:shadow-md transition-shadow duration-200',
  
  // Text styles
  heading: 'text-[var(--foreground)] font-bold',
  body: 'text-[var(--foreground)]',
  mutedText: 'text-[var(--muted-foreground)]',
};

// Status badge colors with proper contrast
export const statusBadges = {
  SUCCESS: { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'bg-green-800', darkText: 'text-green-100' },
  WARNING: { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'bg-yellow-800', darkText: 'text-yellow-100' },
  ERROR: { bg: 'bg-red-100', text: 'text-red-800', darkBg: 'bg-red-800', darkText: 'text-red-100' },
  INFO: { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'bg-blue-800', darkText: 'text-blue-100' },
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'bg-yellow-800', darkText: 'text-yellow-100' },
  PROCESSING: { bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'bg-purple-800', darkText: 'text-purple-100' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'bg-green-800', darkText: 'text-green-100' },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'bg-gray-800', darkText: 'text-gray-100' },
  PAID: { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'bg-blue-800', darkText: 'text-blue-100' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'bg-green-800', darkText: 'text-green-100' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800', darkBg: 'bg-red-800', darkText: 'text-red-100' },
  REFUNDED: { bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'bg-gray-800', darkText: 'text-gray-100' },
};

// Icon color schemes for different sections
export const iconColors = {
  primary: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
  success: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
  error: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
};

// Admin page layout constants
export const adminLayout = {
  container: 'container mx-auto px-4 py-8',
  pageHeader: 'flex items-center gap-3 mb-8',
  pageTitle: 'text-2xl font-bold text-[var(--foreground)]',
  pageSubtitle: 'text-[var(--muted-foreground)]',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
  statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8',
};

export default theme;
