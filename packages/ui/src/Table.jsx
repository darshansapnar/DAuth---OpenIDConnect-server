import * as React from 'react';

/**
 * Reusable components for data tables.
 */
export const TableContainer = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`w-full overflow-x-auto border border-gray-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#18181B] ${className}`}
      {...props}
    />
  );
});
TableContainer.displayName = 'TableContainer';

export const Table = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <table
      ref={ref}
      className={`min-w-full divide-y divide-gray-200 dark:divide-white/5 text-left text-sm ${className}`}
      {...props}
    />
  );
});
Table.displayName = 'Table';

export const TableHeader = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <thead
      ref={ref}
      className={`bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-white/5 ${className}`}
      {...props}
    />
  );
});
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <tbody
      ref={ref}
      className={`divide-y divide-gray-200 dark:divide-white/5 bg-white dark:bg-[#18181B] ${className}`}
      {...props}
    />
  );
});
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <tr
      ref={ref}
      className={`hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors ${className}`}
      {...props}
    />
  );
});
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={`px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider ${className}`}
      {...props}
    />
  );
});
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <td
      ref={ref}
      className={`px-6 py-4 text-sm text-gray-900 dark:text-zinc-300 whitespace-nowrap leading-5 ${className}`}
      {...props}
    />
  );
});
TableCell.displayName = 'TableCell';
