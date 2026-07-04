import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, X } from 'lucide-react';

/**
 * Reusable floating toast notification.
 * Supports auto-dismiss hook settings and Framer Motion transitions.
 */
export function Toast({ isOpen, onClose, message, variant = 'success', duration = 4000 }) {
  React.useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const styles = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    },
    info: {
      icon: <AlertCircle className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />,
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    },
    danger: {
      icon: <XCircle className="h-5 w-5 text-red-500" />,
    },
  };

  const currentStyle = styles[variant] || styles.success;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-[#18181B] rounded-xl shadow-2xl border border-gray-200 dark:border-white/5 p-4 flex gap-3 items-center"
          role="alert"
        >
          <div className="shrink-0">{currentStyle.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-normal">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 text-gray-400 dark:text-zinc-500 hover:text-gray-500 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-150 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
