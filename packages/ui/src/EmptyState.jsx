import * as React from 'react';

/**
 * Reusable Empty State container.
 * Prompts user to perform an action when no records are available.
 */
export function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div
      className={`border border-dashed border-gray-300 dark:border-white/10 rounded-xl p-12 text-center bg-gray-50/50 dark:bg-zinc-900/10 flex flex-col items-center justify-center ${className}`}
    >
      {icon && <div className="mb-4 text-gray-400 dark:text-zinc-500 shrink-0">{icon}</div>}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-50 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm mb-6 leading-normal">{description}</p>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
