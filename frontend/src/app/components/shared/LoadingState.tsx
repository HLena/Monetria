import React from 'react';

export function LoadingState({ message = 'Cargando…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
      <span className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
