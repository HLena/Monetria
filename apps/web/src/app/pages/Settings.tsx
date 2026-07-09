import { useState } from 'react';
import { User, SlidersHorizontal, Tag, Building2, ShieldCheck, Bell, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageContainer, HeaderPage } from '@/app/components/shared';
import {
  AccountsSection, ProfileSection, PreferencesSection, CategoriesSection,
  InstitutionsSection, SecuritySection, NotificationsSection,
} from '@/app/components/settings';

type Section = 'accounts' | 'profile' | 'preferences' | 'categories' | 'institutions' | 'security' | 'notifications';

const SECTIONS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: 'profile',       label: 'Perfil',            icon: User },
  { id: 'preferences',   label: 'Preferencias',      icon: SlidersHorizontal },
  { id: 'accounts',      label: 'Cuentas',           icon: Wallet },
  { id: 'categories',    label: 'Categorías',        icon: Tag },
  { id: 'institutions',  label: 'Instituciones',     icon: Building2 },
  { id: 'security',      label: 'Seguridad y datos', icon: ShieldCheck },
  { id: 'notifications', label: 'Notificaciones',    icon: Bell },
];

function ActiveSection({ active }: { active: Section }) {
  switch (active) {
    case 'profile':       return <ProfileSection />;
    case 'preferences':   return <PreferencesSection />;
    case 'accounts':      return <AccountsSection />;
    case 'categories':    return <CategoriesSection />;
    case 'institutions':  return <InstitutionsSection />;
    case 'security':      return <SecuritySection />;
    case 'notifications': return <NotificationsSection />;
  }
}

export function Settings() {
  const [active, setActive] = useState<Section>('profile');

  return (
    <PageContainer>
      <HeaderPage title="Configuraciones" />
      <div className="flex gap-6 min-h-0">
        <nav className="w-52 flex-shrink-0">
          <ul className="space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setActive(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active === id
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-1 min-w-0">
          <ActiveSection active={active} />
        </div>
      </div>
    </PageContainer>
  );
}
