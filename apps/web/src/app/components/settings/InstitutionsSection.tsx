import { useState } from 'react';
import { Check } from 'lucide-react';
import { SectionCard } from '@/app/components/shared';

const PERUVIAN_BANKS = [
  { name: 'BCP',              color: '#003087' },
  { name: 'Interbank',        color: '#00a651' },
  { name: 'BBVA',             color: '#004481' },
  { name: 'Scotiabank',       color: '#e31837' },
  { name: 'Banco de la Nación', color: '#003087' },
  { name: 'Banco Pichincha',  color: '#e4032e' },
  { name: 'BanBif',           color: '#003087' },
  { name: 'Mibanco',          color: '#ff6600' },
  { name: 'Yape',             color: '#6b21a8' },
  { name: 'Plin',             color: '#00b4d8' },
  { name: 'Tunki',            color: '#f97316' },
  { name: 'PayPal',           color: '#003087' },
];

export function InstitutionsSection() {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(PERUVIAN_BANKS.map(b => b.name))
  );

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <SectionCard title="Instituciones financieras">
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        Selecciona las instituciones que quieres ver como opciones al crear una cuenta.
      </p>
      <div className="space-y-1.5">
        {PERUVIAN_BANKS.map(bank => {
          const checked = selected.has(bank.name);
          return (
            <label
              key={bank.name}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                checked ? 'bg-slate-50 dark:bg-slate-800' : 'opacity-50 hover:opacity-70'
              }`}
            >
              <input type="checkbox" checked={checked} onChange={() => toggle(bank.name)} className="sr-only" />
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: bank.color }}
              >
                {bank.name.charAt(0)}
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-200 font-medium flex-1">{bank.name}</span>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {checked && <Check className="w-3 h-3 text-white" />}
              </div>
            </label>
          );
        })}
      </div>
    </SectionCard>
  );
}
