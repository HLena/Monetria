import React from 'react';
import { Link } from 'react-router';
import { Home, AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50 dark:bg-slate-950">
      <AlertCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
      <h1 className="text-slate-700 dark:text-slate-200 text-3xl font-bold mb-2">404</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Página no encontrada</p>
      <Link
        to="/"
        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
      >
        <Home className="w-4 h-4" />
        Ir al Dashboard
      </Link>
    </div>
  );
}
