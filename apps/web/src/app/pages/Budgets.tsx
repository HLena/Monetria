import { useState } from 'react';
import { Plus, AlertTriangle, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { useFinance, formatCurrency, getCurrentMonthKey, getMonthKey } from '../store/FinanceContext';
import { Budget, CATEGORY_COLORS } from '../types/finance';
import { Modal } from '../components/Modal';
import { CategoryIconCircle } from '../lib/categoryIcons';
import { useFinanceStore } from '../store/FinanceStore';
import { PageContainer, HeaderPage, SummaryCard, EmptyState } from '../components/shared';
import { BudgetForm } from '../components/budgets/BudgetForm';
import { Target } from 'lucide-react';

interface BudgetWithSpent extends Budget {
  spent: number;
  remaining: number;
  percent: number;
  isOver: boolean;
  isWarning: boolean;
}

export function Budgets() {
  const { budgets, transactions } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const currentMonth = getCurrentMonthKey();

  const budgetsWithSpent: BudgetWithSpent[] = budgets.map(b => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.categoryId === b.categoryId && getMonthKey(t.date) === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0);
    const remaining = Math.max(0, b.limit - spent);
    const percent = Math.min((spent / b.limit) * 100, 100);
    return {
      ...b,
      spent,
      remaining,
      percent,
      isOver: spent > b.limit,
      isWarning: spent > b.limit * 0.8 && spent <= b.limit,
    };
  });

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgetsWithSpent.filter(b => b.isOver).length;

  return (
    <PageContainer>
      <HeaderPage
        title="Presupuestos"
        subtitle="Control de gastos por categoría"
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="Presupuesto Total"
          value={formatCurrency(totalBudget)}
          colorVariant="indigo"
          description={`${budgets.length} categorías`}
        />
        <SummaryCard
          label="Gastado este mes"
          value={formatCurrency(totalSpent)}
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
            message="No hay presupuestos configurados"
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
          {budgetsWithSpent.map(budget => (
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
                  <CategoryIconCircle category={budget.categoryId} />
                  <div>
                    <p className="text-slate-700 dark:text-slate-200 font-semibold">{budget.categoryId}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs capitalize">{budget.period === 'monthly' ? 'Mensual' : 'Semanal'}</p>
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
                      background: budget.isOver ? '#ef4444' : budget.isWarning ? '#f59e0b' : CATEGORY_COLORS[budget.categoryId] || budget.color,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Gastado</p>
                  <p className={`font-semibold ${budget.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {formatCurrency(budget.spent)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 dark:text-slate-500 text-xs">{budget.isOver ? 'Excedido' : 'Disponible'}</p>
                  <p className={`font-semibold ${budget.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {budget.isOver ? `+${formatCurrency(budget.spent - budget.limit)}` : formatCurrency(budget.remaining)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 text-xs">Límite: {formatCurrency(budget.limit)}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditBudget(budget)}
                    className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {}}
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
        <BudgetForm onSave={() => {}} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editBudget} onClose={() => setEditBudget(null)} title="Editar Presupuesto">
        {editBudget && (
          <BudgetForm initial={editBudget} onSave={() => {}} onClose={() => setEditBudget(null)} />
        )}
      </Modal>
    </PageContainer>
  );
}
