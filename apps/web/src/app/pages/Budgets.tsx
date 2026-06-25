import { useEffect, useState } from 'react';
import { Plus, AlertTriangle, CheckCircle, Edit2, Trash2, Target } from 'lucide-react';
import { Budget } from '../types/finance';
import { Modal } from '../components/Modal';
import { CategoryIconCircle } from '../lib/categoryIcons';
import { useFinanceStore } from '../store/FinanceStore';
import { PageContainer, HeaderPage, SummaryCard, EmptyState, LoadingState, ErrorBanner } from '../components/shared';
import { BudgetForm } from '../components/budgets/BudgetForm';

function fmt(n: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

interface BudgetWithMeta extends Budget {
  categoryName: string;
  categoryColor: string | undefined;
  categoryKeyIcon: string | undefined;
  remaining: number;
  percent: number;
  isOver: boolean;
  isWarning: boolean;
}

export function Budgets() {
  const { budgets, categories, isLoading, error, loadBudgets, addBudget, updateBudget, deleteBudget, loadCategories } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);

  const now = new Date();
  const [filterMonth] = useState(now.getMonth() + 1);
  const [filterYear] = useState(now.getFullYear());

  useEffect(() => {
    void loadCategories();
    loadBudgets(filterMonth, filterYear);
  }, [filterMonth, filterYear]);

  const budgetsWithMeta: BudgetWithMeta[] = budgets.map(b => {
    const cat = categories.find(c => c.id === b.categoryId);
    const remaining = Math.max(0, b.limitAmount - b.spentAmount);
    const percent = b.limitAmount > 0 ? Math.min((b.spentAmount / b.limitAmount) * 100, 100) : 0;
    return {
      ...b,
      categoryName: cat?.name ?? b.categoryId,
      categoryColor: cat?.color ?? undefined,
      categoryKeyIcon: cat?.keyIcon ?? undefined,
      remaining,
      percent,
      isOver: b.spentAmount > b.limitAmount,
      isWarning: b.spentAmount > b.limitAmount * 0.8 && b.spentAmount <= b.limitAmount,
    };
  });

  const totalBudget = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);
  const overBudgetCount = budgetsWithMeta.filter(b => b.isOver).length;

  const handleSave = async (data: Omit<Budget, 'id' | 'createdAt'>) => {
    if (editBudget) {
      await updateBudget(editBudget.id, data);
      setEditBudget(null);
    } else {
      await addBudget(data);
      setShowForm(false);
    }
  };

  if (isLoading && budgets.length === 0) return <LoadingState message="Cargando presupuestos…" />;

  return (
    <PageContainer>
      <HeaderPage
        title="Presupuestos"
        subtitle={`${MONTH_NAMES[filterMonth - 1]} ${filterYear}`}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Nuevo Presupuesto
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="Presupuesto Total"
          value={fmt(totalBudget)}
          colorVariant="indigo"
          description={`${budgets.length} categoría${budgets.length !== 1 ? 's' : ''}`}
        />
        <SummaryCard
          label="Gastado este mes"
          value={fmt(totalSpent)}
          colorVariant="rose"
          description={`${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}% del total`}
        />
        <SummaryCard
          label={overBudgetCount > 0 ? 'Categorías excedidas' : 'Todo en orden'}
          value={overBudgetCount > 0 ? String(overBudgetCount) : '✓'}
          colorVariant={overBudgetCount > 0 ? 'amber' : 'emerald'}
          description={overBudgetCount > 0 ? `categoría${overBudgetCount !== 1 ? 's' : ''} sobre límite` : 'Dentro del presupuesto'}
        />
      </div>

      {budgets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <EmptyState
            icon={Target}
            message="No hay presupuestos para este mes"
            description="Crea tu primer presupuesto para controlar tus gastos"
            action={
              <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                Crear presupuesto
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgetsWithMeta.map(budget => (
            <div
              key={budget.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border transition-all ${
                budget.isOver
                  ? 'border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20'
                  : budget.isWarning
                  ? 'border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20'
                  : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CategoryIconCircle
                    category={budget.categoryName}
                    iconKey={budget.categoryKeyIcon ?? undefined}
                    color={budget.categoryColor ?? undefined}
                  />
                  <div>
                    <p className="text-slate-700 dark:text-slate-200 font-semibold">{budget.categoryName}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">
                      {MONTH_NAMES[budget.month - 1]} {budget.year}
                    </p>
                  </div>
                </div>
                {budget.isOver && <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                {budget.isWarning && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                {!budget.isOver && !budget.isWarning && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Gastado</span>
                  <span className={budget.isOver ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-600 dark:text-slate-300'}>
                    {budget.percent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(budget.percent, 100)}%`,
                      background: budget.isOver ? '#ef4444' : budget.isWarning ? '#f59e0b' : (budget.categoryColor ?? '#6366f1'),
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Gastado</p>
                  <p className={`font-semibold ${budget.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {fmt(budget.spentAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 dark:text-slate-500 text-xs">{budget.isOver ? 'Excedido' : 'Disponible'}</p>
                  <p className={`font-semibold ${budget.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {budget.isOver ? `+${fmt(budget.spentAmount - budget.limitAmount)}` : fmt(budget.remaining)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 text-xs">Límite: {fmt(budget.limitAmount)}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditBudget(budget)}
                    className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteBudget(budget.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo Presupuesto">
        <BudgetForm onSave={handleSave} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editBudget} onClose={() => setEditBudget(null)} title="Editar Presupuesto">
        {editBudget && (
          <BudgetForm initial={editBudget} onSave={handleSave} onClose={() => setEditBudget(null)} />
        )}
      </Modal>
    </PageContainer>
  );
}
