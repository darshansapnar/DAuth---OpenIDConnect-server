import * as React from 'react';

/**
 * Reusable Sidebar navigation container.
 */
export function Sidebar({ children, className = '' }) {
  return (
    <aside
      className={`w-64 bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-white/5 h-screen sticky top-0 flex flex-col justify-between shrink-0 ${className}`}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ children, className = '' }) {
  return (
    <div className={`h-16 px-6 border-b border-gray-100 dark:border-white/5 flex items-center shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarContent({ children, className = '' }) {
  return (
    <nav className={`flex-1 px-4 py-6 overflow-y-auto space-y-1 ${className}`}>{children}</nav>
  );
}

export function SidebarLink({ children, active = false, icon, ...props }) {
  const baseStyles =
    'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all';
  const activeStyles = 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold';
  const inactiveStyles = 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/40 hover:text-gray-900 dark:hover:text-zinc-100';

  const Component = props.href ? 'a' : 'button';

  return (
    <Component className={`${baseStyles} ${active ? activeStyles : inactiveStyles}`} {...props}>
      {icon && (
        <span className={`shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-405 dark:text-zinc-500'}`}>{icon}</span>
      )}
      <span className="truncate">{children}</span>
    </Component>
  );
}

export function SidebarFooter({ children, className = '' }) {
  return (
    <div className={`p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-900/40 shrink-0 ${className}`}>
      {children}
    </div>
  );
}
