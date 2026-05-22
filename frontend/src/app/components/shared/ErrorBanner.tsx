import React from 'react';

interface ErrorBannerProps {
  message: string;
  onClose?: () => void;
}

export function ErrorBanner({ message, onClose }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800
        dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 flex justify-between gap-3 items-start"
    >
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-rose-600 dark:text-rose-300 font-medium hover:underline"
        >
          Cerrar
        </button>
      )}
    </div>
  );
}
