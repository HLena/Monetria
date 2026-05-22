import React from 'react';

interface HeaderPageProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function HeaderPage({ title, subtitle, actions }: HeaderPageProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-slate-800 dark:text-slate-100 text-2xl font-bold">{title}</h1>
        {subtitle && (
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
