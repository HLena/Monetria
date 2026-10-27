import { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { useAuthStore } from '@/app/store';
import { ErrorBanner, ErrorMsg, FormField, SectionCard, SaveButton } from '@/app/components/shared';
import { Input } from '@/app/components/ui';

function validate(firstName: string, lastName: string, phoneNumber: string) {
  const errors: { firstName?: string; lastName?: string; phoneNumber?: string } = {};
  if (!firstName.trim()) errors.firstName = 'El nombre es requerido.';
  if (!lastName.trim()) errors.lastName = 'El apellido es requerido.';
  if (phoneNumber.trim() && !/^\+?[\d\s\-().]{6,20}$/.test(phoneNumber.trim()))
    errors.phoneNumber = 'Formato inválido. Ej: +51 999 000 111';
  return errors;
}

export function ProfileSection() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [touched, setTouched] = useState({ firstName: false, lastName: false, phoneNumber: false });
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const errors = useMemo(
    () => validate(firstName, lastName, phoneNumber),
    [firstName, lastName, phoneNumber],
  );

  const hasChanges =
    firstName.trim() !== (user?.firstName ?? '') ||
    lastName.trim() !== (user?.lastName ?? '') ||
    (phoneNumber.trim() || null) !== (user?.phoneNumber ?? null);

  const isDisabled = !hasChanges || Object.keys(errors).length > 0;

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';

  function touch(field: keyof typeof touched) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  async function handleSave() {
    setTouched({ firstName: true, lastName: true, phoneNumber: true });
    if (Object.keys(errors).length > 0) return;
    setServerError(null);
    setSaved(false);
    try {
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phoneNumber: phoneNumber.trim() || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setServerError((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      {serverError && <ErrorBanner message={serverError} />}
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
        <div className="flex flex-col gap-2">
          <FormField label="Nombre" required>
            <Input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onBlur={() => touch('firstName')}
              placeholder="Nombre"
            />
            {touched.firstName && <ErrorMsg message={errors.firstName} />}
          </FormField>
          <FormField label="Apellido" required>
            <Input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onBlur={() => touch('lastName')}
              placeholder="Apellido"
            />
            {touched.lastName && <ErrorMsg message={errors.lastName} />}
          </FormField>
          <FormField label="Correo electrónico">
            <Input value={user?.email ?? ''} disabled />
          </FormField>
          <FormField label="Número de teléfono">
            <Input
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              onBlur={() => touch('phoneNumber')}
              placeholder="+51 999 000 111"
              type="tel"
            />
            {touched.phoneNumber && <ErrorMsg message={errors.phoneNumber} />}
          </FormField>
        </div>
        <div className="flex items-center gap-3 mt-5">
          <SaveButton loading={isLoading} disabled={isDisabled} onClick={handleSave} />
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
