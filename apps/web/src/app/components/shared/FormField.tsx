import React from 'react';

export function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1 block">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  );
}
