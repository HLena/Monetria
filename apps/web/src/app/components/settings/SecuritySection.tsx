import { useState } from 'react';
import { Eye, EyeOff, Lock, Download, UserX, Check } from 'lucide-react';
import { useAuthStore } from '@/app/store';
import { FormField, SectionCard } from '@/app/components/shared';
import { Input } from '@/app/components/ui';

export function SecuritySection() {
  const { changePassword, deleteAccount, isLoading } = useAuthStore();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleChangePassword() {
    setPwError(null);
    setPwSaved(false);
    if (next !== confirm) { setPwError('Las contraseñas no coinciden.'); return; }
    if (next.length < 8) { setPwError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setCurrent(''); setNext(''); setConfirm('');
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    } catch (e) {
      setPwError((e as Error).message);
    }
  }

  async function handleDeleteAccount() {
    await deleteAccount();
    window.location.href = '/login';
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Cambiar contraseña">
        {pwError && <p className="text-sm text-rose-500 mb-3">{pwError}</p>}
        <div className="space-y-3">
          <FormField label="Contraseña actual" required>
            <div className="relative">
              <Input
                value={current}
                onChange={e => setCurrent(e.target.value)}
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
          <FormField label="Nueva contraseña" required>
            <div className="relative">
              <Input
                value={next}
                onChange={e => setNext(e.target.value)}
                type={showNext ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNext(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
          <FormField label="Confirmar nueva contraseña" required>
            <Input
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              type="password"
              placeholder="Repite la contraseña"
            />
          </FormField>
        </div>
        <div className="flex items-center gap-3 mt-5">
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={isLoading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            {isLoading ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
          {pwSaved && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm">
              <Check className="w-4 h-4" /> Contraseña actualizada
            </span>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Exportar mis datos">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Descarga un archivo CSV con todas tus transacciones, cuentas y presupuestos.
        </p>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-4 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exportar a CSV
          <span className="ml-1 text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">Próximamente</span>
        </button>
      </SectionCard>

      <SectionCard title="Zona de peligro">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Tu cuenta será desactivada permanentemente. Todos tus datos se conservarán pero no podrás iniciar sesión.
        </p>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl text-sm font-medium border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
          >
            <UserX className="w-4 h-4" />
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-rose-700 dark:text-rose-400">¿Estás seguro? Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="flex-1 bg-rose-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
