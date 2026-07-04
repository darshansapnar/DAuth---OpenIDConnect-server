import * as React from 'react';

/**
 * Reusable controlled Dropdown menu.
 * Automatically closes on click outside and escape keys.
 */
export function Dropdown({ trigger, children, isOpen, onClose, className = '', align = 'right' }) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const alignmentStyles = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
  };

  const currentAlign = alignmentStyles[align] || alignmentStyles.right;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div className="inline-flex">{trigger}</div>

      {isOpen && (
        <div
          className={`absolute mt-2 w-56 rounded-xl bg-white dark:bg-[#18181B] shadow-xl border border-gray-200 dark:border-white/5 focus:outline-none z-40 p-1 ${currentAlign} ${className}`}
          role="menu"
          aria-orientation="vertical"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, active = false, className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      className={`w-[calc(100%-8px)] text-left px-3 py-2 text-sm transition-colors text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-zinc-100 rounded-lg mx-1 flex items-center gap-2 ${
        active ? 'bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 font-medium' : ''
      } ${className}`}
      role="menuitem"
      {...props}
    >
      {children}
    </button>
  );
}
