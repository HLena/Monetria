import { useMemo, useState } from 'react';
import { Plus, Trash2, Edit2, CalendarClock, PauseCircle, History } from 'lucide-react';
import { useAccounts, useCategories, useRecurrings } from '@/app/hooks';
import { Recurring, recurringMonthlyEquivalent } from '@/app/types/finance';
import { Modal } from '@/app/components/Modal';
import { CategoryIconCircle } from '@/app/lib';
import { PageContainer, HeaderPage, SummaryCard, EmptyState, LoadingState, ErrorBanner } from '@/app/components/shared';
import { Button } from '@/app/components/ui/Button';
import { RecurringForm, RecurringOccurrencesModal } from '@/app/components/recurrings';

function fmt(n: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);
}

const FREQUENCY_LABEL: Record<string, string> = {
  Daily: 'Diaria',
  Weekly: 'Semanal',
  Biweekly: 'Quincenal',
  Monthly: 'Mensual',
  Yearly: 'Anual',
};

const TYPE_LABEL: Record<string, string> = {
  Income: 'Ingreso',
  Expense: 'Gasto',
  Transfer: 'Transferencia',
};

export function Recurrings() {
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { recurrings, isLoading, error, addRecurring, updateRecurring, deactivateRecurring } = useRecurrings();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Recurring | null>(null);
  const [occurrencesItem, setOccurrencesItem] = useState<Recurring | null>(null);

  const { monthlyTotal, activeCount } = useMemo(() => {
    const active = recurrings.filter(r => r.isActive);
    const monthlyTotal = active.reduce(
      (sum, r) => sum + recurringMonthlyEquivalent(r.amount ?? r.estimatedAmount ?? 0, r.frequency),
      0,
    );
    return { monthlyTotal, activeCount: active.length };
  }, [recurrings]);

  const handleSave = async (data: Omit<Recurring, 'id'>) => {
    if (editItem) {
      await updateRecurring(editItem.id, data);
      setEditItem(null);
    } else {
      await addRecurring(data);
      setShowForm(false);
    }
  };

  if (isLoading && recurrings.length === 0) return <LoadingState message="Cargando recurrentes…" />;

  return (
    <PageContainer>
      <HeaderPage
        title="Recurrentes"
        subtitle="Compromisos recurrentes (equivalente mensual estimado)"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Nuevo recurrente
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <SummaryCard
          label="Equivalente mensual"
          value={fmt(monthlyTotal)}
          colorVariant="indigo"
          description={`${activeCount} activo${activeCount !== 1 ? 's' : ''}`}
        />
        <SummaryCard
          label="Total registros"
          value={String(recurrings.length)}
          colorVariant="slate"
          description="Incluye pausados"
        />
      </div>

      {recurrings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <EmptyState
            icon={CalendarClock}
            message="No hay recurrentes"
            description="Agrega renta, servicios o suscripciones"
            action={<Button onClick={() => setShowForm(true)}>Agregar el primero</Button>}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
          {recurrings.map(item => {
            const account = accounts.find(a => a.id === item.accountId);
            const category = categories.find(c => c.id === item.categoryId);
            const displayAmount = item.amount ?? item.estimatedAmount;
            const monthlyEq = displayAmount
              ? recurringMonthlyEquivalent(displayAmount, item.frequency)
              : undefined;

            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 transition-colors ${
                  item.isActive ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : 'opacity-70 bg-slate-50/50 dark:bg-slate-950/30'
                }`}
              >
                <CategoryIconCircle
                  category={item.categoryName ?? TYPE_LABEL[item.type]}
                  iconKey={category?.keyIcon ?? undefined}
                  color={category?.color ?? undefined}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-slate-800 dark:text-slate-100 font-semibold">{item.name}</p>
                    {!item.isActive && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                        <PauseCircle className="w-3 h-3" /> Pausado
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                    {TYPE_LABEL[item.type]} · {FREQUENCY_LABEL[item.frequency]}
                    {account && ` · ${account.name}`}
                    {` · próxima: ${item.nextDueDate}`}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-1">
                  <div className="text-right">
                    <p className="text-slate-800 dark:text-slate-100 font-semibold">
                      {displayAmount != null ? fmt(displayAmount) : 'Variable'}
                    </p>
                    {monthlyEq != null && (
                      <p className="text-slate-400 dark:text-slate-500 text-xs">~{fmt(monthlyEq)}/mes</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setOccurrencesItem(item)}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                      title="Ver ocurrencias"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditItem(item)}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {item.isActive && (
                      <button
                        type="button"
                        onClick={() => deactivateRecurring(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Pausar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo recurrente">
        <RecurringForm onSave={handleSave} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar recurrente">
        {editItem && (
          <RecurringForm initial={editItem} onSave={handleSave} onClose={() => setEditItem(null)} />
        )}
      </Modal>
      <RecurringOccurrencesModal recurring={occurrencesItem} onClose={() => setOccurrencesItem(null)} />
    </PageContainer>
  );
}
