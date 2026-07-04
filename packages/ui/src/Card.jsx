import * as React from 'react';

/**
 * Reusable Card component for SaaS dashboards.
 */
export const Card = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/5 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}
      {...props}
    />
  );
});
Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`px-6 py-5 border-b border-gray-200 dark:border-white/5 flex flex-col gap-1.5 ${className}`}
      {...props}
    />
  );
});
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={`text-base font-semibold text-gray-900 dark:text-zinc-50 tracking-tight leading-none ${className}`}
      {...props}
    />
  );
});
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={`text-sm text-gray-500 dark:text-zinc-400 leading-normal ${className}`}
      {...props}
    />
  );
});
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`px-6 py-5 text-sm text-gray-700 dark:text-zinc-300 leading-relaxed ${className}`}
      {...props}
    />
  );
});
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`px-6 py-4 bg-gray-50 dark:bg-zinc-900/40 border-t border-gray-200 dark:border-white/5 flex items-center justify-end gap-3 ${className}`}
      {...props}
    />
  );
});
CardFooter.displayName = 'CardFooter';
