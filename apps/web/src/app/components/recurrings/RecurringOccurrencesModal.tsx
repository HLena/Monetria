import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Ban } from 'lucide-react';
import { Recurring } from '@/app/types/finance';
import { useFinanceStore } from '@/app/store';
import { Modal } from '@/app/components/Modal';
import { Input } from '@/app/components/ui';
import { LoadingState, EmptyState } from '@/app/components/shared';

function fmt(n: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);
}

const STATUS_LABEL: Record<string, string> = {
  Pending: 'Pendiente',
  Confirmed: 'Confirmada',
  Skipped: 'Omitida',
  AutoRegistered: 'Auto-registrada',
};

export function RecurringOccurrencesModal({
  recurring,
  onClose,
}: {
  recurring: Recurring | null;
  onClose: () => void;
}) {
  const {
    recurringOccurrences,
    loadRecurringOccurrences,
    confirmRecurringOccurrence,
    skipRecurringOccurrence,
    isLoading,
  } = useFinanceStore();
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (recurring) void loadRecurringOccurrences(recurring.id);
  }, [recurring?.id]);

  if (!recurring) return null;

  const occurrences = [...(recurringOccurrences[recurring.id] ?? [])].sort((a, b) =>
    b.scheduledDate.localeCompare(a.scheduledDate),
  );

  const handleConfirm = async (occurrenceId: string) => {
    const draft = amountDrafts[occurrenceId];
    const parsed = draft ? parseFloat(draft) : NaN;
    setBusyId(occurrenceId);
    try {
      await confirmRecurringOccurrence(occurrenceId, recurring.id, parsed > 0 ? parsed : null);
    } catch {
      /* el store persiste el error en el banner de la página */
    } finally {
      setBusyId(null);
    }
  };

  const handleSkip = async (occurrenceId: string) => {
    setBusyId(occurrenceId);
    try {
      await skipRecurringOccurrence(occurrenceId, recurring.id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal isOpen title={`Ocurrencias · ${recurring.name}`} onClose={onClose}>
      {isLoading && occurrences.length === 0 ? (
        <LoadingState message="Cargando ocurrencias…" />
      ) : occurrences.length === 0 ? (
        <EmptyState
          icon={Clock}
          message="Sin ocurrencias todavía"
          description="Se generan automáticamente según la frecuencia configurada"
        />
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {occurrences.map(o => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{o.scheduledDate}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{STATUS_LABEL[o.status] ?? o.status}</p>
                {(o.realAmount != null || o.suggestedAmount != null) && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {fmt(o.realAmount ?? o.suggestedAmount ?? 0)}
                  </p>
                )}
              </div>

              {o.status === 'Pending' ? (
                <div className="flex items-center gap-2">
                  {recurring.amountType !== 'Fixed' && (
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder={o.suggestedAmount != null ? String(o.suggestedAmount) : 'Monto'}
                      className="w-24"
                      value={amountDrafts[o.id] ?? ''}
                      onChange={e => setAmountDrafts(prev => ({ ...prev, [o.id]: e.target.value }))}
                    />
                  )}
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => handleConfirm(o.id)}
                    className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => handleSkip(o.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : o.status === 'Skipped' ? (
                <Ban className="w-4 h-4 text-slate-300 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
