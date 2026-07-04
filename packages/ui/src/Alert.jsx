import * as React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

/**
 * Reusable Alert banner for status feedback, inline notifications, or form errors.
 */
export function Alert({ variant = 'info', title, children, onClose, className = '' }) {
  const styles = {
    info: {
      bg: 'bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-300',
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      icon: <AlertCircle className="h-5 w-5" />,
    },
    success: {
      bg: 'bg-green-50/70 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-900 dark:text-green-300',
      iconColor: 'text-green-500 dark:text-green-400',
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    warning: {
      bg: 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-300',
      iconColor: 'text-amber-500 dark:text-amber-400',
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    danger: {
      bg: 'bg-red-50/70 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-900 dark:text-red-300',
      iconColor: 'text-red-500 dark:text-red-400',
      icon: <XCircle className="h-5 w-5" />,
    },
  };

  const currentStyle = styles[variant] || styles.info;

  return (
    <div
      className={`p-4 border rounded-xl flex gap-3 items-start ${currentStyle.bg} ${className}`}
      role="alert"
    >
      <div className={`shrink-0 ${currentStyle.iconColor}`}>{currentStyle.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold mb-1 text-current">{title}</h4>}
        <div className="text-sm leading-normal text-current">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-current"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
