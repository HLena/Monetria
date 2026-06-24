import React from 'react';

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
      {children}
    </p>
  );
}
