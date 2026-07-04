import { useState } from 'react';
import { Check } from 'lucide-react';
import { useAuthStore } from '@/app/store';
import { ErrorBanner, FormField, SectionCard, SaveButton } from '@/app/components/shared';
import { Input } from '@/app/components/ui';

export function ProfileSection() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await updateProfile({ firstName, lastName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <SectionCard title="Información personal">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{firstName} {lastName}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <FormField label="Nombre" required>
            <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nombre" />
          </FormField>
          <FormField label="Apellido" required>
            <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Apellido" />
          </FormField>
        </div>
        <FormField label="Correo electrónico">
          <Input value={user?.email ?? ''} disabled />
        </FormField>
        <div className="flex items-center gap-3 mt-5">
          <SaveButton loading={isLoading} onClick={handleSave} />
          {saved && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm">
              <Check className="w-4 h-4" /> Guardado
            </span>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
