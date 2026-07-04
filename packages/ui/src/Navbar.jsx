import * as React from 'react';

/**
 * Reusable Top Navigation Bar.
 */
export function Navbar({ children, className = '' }) {
  return (
    <header
      className={`h-16 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-white/5 sticky top-0 z-30 w-full shrink-0 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {children}
      </div>
    </header>
  );
}

export function NavbarBrand({ children, className = '' }) {
  return (
    <div
      className={`flex items-center gap-2 font-bold text-gray-900 dark:text-zinc-50 tracking-tight shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}

export function NavbarContent({ children, className = '' }) {
  return <div className={`flex items-center gap-4 ${className}`}>{children}</div>;
}
