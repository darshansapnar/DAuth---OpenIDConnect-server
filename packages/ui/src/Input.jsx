import * as React from 'react';

/**
 * Reusable styled Input component adhering to DAuth Brand Guidelines.
 */
export const Input = React.forwardRef(
  ({ className = '', label, error, type = 'text', id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-gray-700 dark:text-zinc-400 uppercase tracking-wider mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 dark:text-zinc-50 bg-white dark:bg-[#18181B] placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-100 disabled:dark:bg-zinc-800 disabled:cursor-not-allowed ${
              error
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-300 dark:border-white/10'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
