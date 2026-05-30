import * as React from 'react';
import { cn } from './utils';

interface InputProps extends React.ComponentProps<'input'> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        data-slot="input"
        className={cn(
          'w-full border border-slate-200 dark:border-slate-600 rounded-xl py-2 text-sm',
          'text-slate-800 dark:text-slate-100 dark:bg-slate-800',
          'focus:outline-none focus:ring-2 focus:ring-indigo-400',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500',
          icon ? 'pl-9 pr-3' : 'px-3',
          className,
        )}
        {...props}
      />
    );

    if (!icon) return input;

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {icon}
        </span>
        {input}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
