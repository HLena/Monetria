import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store';
import { SectionCard, ToggleGroup } from '@/app/components/shared';

export function PreferencesSection() {
  const { user, updatePreferences } = useAuthStore();
  const { theme, setTheme } = useTheme();

  async function handleCurrencyChange(value: string) {
    if (value === user?.preferredCurrency) return;
    try {
      await updatePreferences({ preferredCurrency: value });
    } catch {
      toast.error('No se pudo guardar la moneda.');
    }
  }

  async function handleThemeChange(value: 'light' | 'dark') {
    if (value === (user?.theme ?? theme)) return;
    setTheme(value);
    try {
      await updatePreferences({ theme: value });
    } catch {
      toast.error('No se pudo guardar el tema.');
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Moneda">
        <div className="flex items-center justify-between rounded-xl py-3">
          <div className="min-w-0 pr-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Moneda base</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Se usa para mostrar totales y resúmenes</p>
          </div>
          <ToggleGroup
            options={[
              { value: 'PEN', label: 'S/ PEN' },
              { value: 'USD', label: '$ USD' },
            ]}
            value={user?.preferredCurrency ?? 'PEN'}
            onChange={handleCurrencyChange}
            size="sm"
          />
        </div>
      </SectionCard>
      <SectionCard title="Tema de la aplicación">
        <div className="flex items-center justify-between rounded-xl py-3">
          <div className="min-w-0 pr-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Apariencia</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Modo visual de la interfaz</p>
          </div>
          <div className="flex flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-600 p-0.5 gap-0.5">
            {([
              { value: 'light', label: 'Claro',  Icon: Sun },
              { value: 'dark',  label: 'Oscuro', Icon: Moon },
            ] as const).map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleThemeChange(value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  (user?.theme ?? theme) === value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
