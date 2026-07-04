import * as React from 'react';

/**
 * Reusable Badge/Pill component for dashboard status labels.
 */
export function Badge({ variant = 'default', children, className = '' }) {
  const variants = {
    default: 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 border-gray-200 dark:border-white/5',
    primary: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20',
    success: 'bg-green-50 dark:bg-green-500/10 text-green-800 dark:text-green-300 border-green-200 dark:border-green-500/20',
    warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    danger: 'bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300 border-red-200 dark:border-red-500/20',
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentVariant} ${className}`}
    >
      {children}
    </span>
  );
}
