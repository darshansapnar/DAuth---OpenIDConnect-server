import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Reusable modal component for user prompts and forms.
 * Accessible with escape-key handling, backdrop closures, and Framer Motion transitions.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
  maxWidth = 'max-w-md',
}) {
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`relative w-full ${maxWidth} transform overflow-hidden rounded-xl bg-white dark:bg-[#18181B] p-6 text-left shadow-2xl border border-gray-200 dark:border-white/5 ${className}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50 leading-6">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-500 dark:hover:text-zinc-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="mt-4 text-sm text-gray-600 dark:text-zinc-300 leading-normal">{children}</div>

            {/* Footer */}
            {footer !== undefined ? (
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                {footer}
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
