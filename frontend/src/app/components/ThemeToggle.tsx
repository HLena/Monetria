import React, { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

const options = [
  { value: 'light' as const, label: 'Claro', Icon: Sun },
  { value: 'dark' as const, label: 'Oscuro', Icon: Moon },
  { value: 'system' as const, label: 'Sistema', Icon: Monitor },
];

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={compact ? 'h-9 w-24' : 'h-10 w-full'} />;
  }

  if (compact) {
    const cycle = () => {
      if (theme === 'light') setTheme('dark');
      else if (theme === 'dark') setTheme('system');
      else setTheme('light');
    };
    const Icon =
      theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
    return (
      <button
        type="button"
        onClick={cycle}
        title="Cambiar tema"
        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
      >
        <Icon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="flex rounded-xl bg-slate-800/80 p-1 gap-0.5">
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            title={label}
            onClick={() => setTheme(value)}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${
              active ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
