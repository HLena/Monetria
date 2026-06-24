import { useMemo, useState } from 'react';
import { Plus, Trash2, Edit2, CalendarClock, PauseCircle } from 'lucide-react';
import { formatCurrency } from '../store/FinanceContext';
import { FixedExpense, FixedExpensePeriod, fixedExpenseMonthlyEquivalent } from '../types/finance';
import { Modal } from '../components/Modal';
import { CategoryIconCircle } from '../lib/categoryIcons';
import { useFinanceStore } from '../store/FinanceStore';
import { PageContainer, HeaderPage, SummaryCard, EmptyState } from '../components/shared';
import { RecurringForm } from '../components/recurrings/RecurringForm';

const PERIOD_LABEL: Record<FixedExpensePeriod, string> = {
  monthly: 'Mensual',
  weekly: 'Semanal',
  yearly: 'Anual',
};

export function Recurrings() {
  const { accounts, fixedExpenses } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<FixedExpense | null>(null);

  const { monthlyTotal, activeCount } = useMemo(() => {
    const active = fixedExpenses.filter(f => f.isActive);
    const monthlyTotal = active.reduce(
      (sum, f) => sum + fixedExpenseMonthlyEquivalent(f.amount, f.period),
      0,
    );
    return { monthlyTotal, activeCount: active.length };
  }, [fixedExpenses]);

  return (
    <PageContainer>
      <HeaderPage
        title="Recurrentes"
        subtitle="Compromisos recurrentes (equivalente mensual estimado)"
        actions={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Nuevo recurrente
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <SummaryCard
          label="Equivalente mensual"
          value={formatCurrency(monthlyTotal)}
          colorVariant="indigo"
          description={`${activeCount} activo${activeCount !== 1 ? 's' : ''}`}
        />
        <SummaryCard
          label="Total registros"
          value={String(fixedExpenses.length)}
          colorVariant="slate"
          description="Incluye pausados"
        />
      </div>

      {fixedExpenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <EmptyState
            icon={CalendarClock}
            message="No hay recurrentes"
            description="Agrega renta, servicios o suscripciones"
            action={
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Agregar el primero
              </button>
            }
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
          {fixedExpenses.map(item => {
            const account = accounts.find(a => a.id === item.accountId);
            const monthlyEq = fixedExpenseMonthlyEquivalent(item.amount, item.period);
            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 transition-colors ${
                  item.isActive ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : 'opacity-70 bg-slate-50/50 dark:bg-slate-950/30'
                }`}
              >
                <CategoryIconCircle category={item.category} />
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
                    {item.category} · {PERIOD_LABEL[item.period]}
                    {item.dueDay != null ? ` · día ${item.dueDay}` : ''}
                    {account && ` · ${account.name}`}
                  </p>
                  {item.notes && (
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{item.notes}</p>
                  )}
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-1">
                  <div className="text-right">
                    <p className="text-slate-800 dark:text-slate-100 font-semibold">{formatCurrency(item.amount)}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">~{formatCurrency(monthlyEq)}/mes</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditItem(item)}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {}}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo recurrente">
        <RecurringForm accounts={accounts} onSave={() => {}} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar recurrente">
        {editItem && (
          <RecurringForm initial={editItem} accounts={accounts} onSave={() => {}} onClose={() => setEditItem(null)} />
        )}
      </Modal>
    </PageContainer>
  );
}
