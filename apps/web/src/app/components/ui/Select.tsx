import React from 'react';
import { cn } from './utils';

const baseCls =
  'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-slate-800';

export function Select({ className, ...props }: React.ComponentPropsWithoutRef<'select'>) {
  return <select {...props} className={cn(baseCls, className)} />;
}
