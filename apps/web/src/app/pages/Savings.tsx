import { useState } from 'react';
import { Plus, Trash2, Edit2, PiggyBank, Calendar, Target } from 'lucide-react';
import { formatCurrency } from '../store/FinanceContext';
import { SavingsGoal } from '../types/finance';
import { Modal } from '../components/Modal';
import { useFinanceStore } from '../store/FinanceStore';
import { PageContainer, HeaderPage, SummaryCard, EmptyState } from '../components/shared';
import { SavingsGoalForm } from '../components/savings/SavingsGoalForm';
import { AddToGoalModal } from '../components/savings/AddToGoalModal';
import { SavingsCalculator } from '../components/savings/SavingsCalculator';

const daysUntil = (dateStr: string) => {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const monthsUntil = (dateStr: string) =>
  Math.max(1, Math.ceil(daysUntil(dateStr) / 30));

export function Savings() {
  const { savingsGoals } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [addToGoal, setAddToGoal] = useState<SavingsGoal | null>(null);

  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const completedGoals = savingsGoals.filter(g => g.currentAmount >= g.targetAmount).length;

  return (
    <PageContainer>
      <HeaderPage
        title="Metas de Ahorro"
        subtitle={`${savingsGoals.length} metas activas`}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Nueva Meta
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total a ahorrar" value={formatCurrency(totalTarget)} colorVariant="indigo" />
        <SummaryCard label="Ya ahorrado" value={formatCurrency(totalSaved)} colorVariant="emerald" />
        <SummaryCard
          label="Metas completadas"
          value={`${completedGoals} / ${savingsGoals.length}`}
          colorVariant="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {savingsGoals.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <EmptyState
                icon={PiggyBank}
                message="No hay metas de ahorro"
                action={
                  <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Crear primera meta
                  </button>
                }
              />
            </div>
          ) : (
            savingsGoals.map(goal => {
              const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const isCompleted = goal.currentAmount >= goal.targetAmount;
              const days = daysUntil(goal.targetDate);
              const months = monthsUntil(goal.targetDate);
              const monthlyNeeded = !isCompleted && months > 0
                ? (goal.targetAmount - goal.currentAmount) / months
                : 0;

              return (
                <div key={goal.id} className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border ${isCompleted ? 'border-emerald-200 dark:border-emerald-900' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${goal.color}20` }}>
                        <Target className="w-6 h-6" style={{ color: goal.color }} />
                      </div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-100 font-semibold">{goal.name}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs">{goal.category}</p>
                        {goal.description && (
                          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{goal.description}</p>
                        )}
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                        ¡Completado!
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-slate-400 dark:text-slate-500">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, background: goal.color }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span style={{ color: goal.color }} className="font-medium">{percent.toFixed(1)}% alcanzado</span>
                      <span className="text-slate-400 dark:text-slate-500">
                        Faltan {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                      <Calendar className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                      <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold">{Math.max(0, days)}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">días</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold">{months}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">meses</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold">
                        {monthlyNeeded > 0 ? formatCurrency(monthlyNeeded).replace('MX$', '$') : '—'}
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">al mes</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {!isCompleted && (
                      <button
                        onClick={() => setAddToGoal(goal)}
                        className="flex-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl py-2 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                      >
                        + Agregar ahorro
                      </button>
                    )}
                    <button
                      onClick={() => setEditGoal(goal)}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {}}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div>
          <SavingsCalculator />
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nueva Meta de Ahorro" size="lg">
        <SavingsGoalForm onSave={() => {}} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editGoal} onClose={() => setEditGoal(null)} title="Editar Meta" size="lg">
        {editGoal && (
          <SavingsGoalForm initial={editGoal} onSave={() => {}} onClose={() => setEditGoal(null)} />
        )}
      </Modal>
      <Modal isOpen={!!addToGoal} onClose={() => setAddToGoal(null)} title="Agregar Ahorro" size="sm">
        {addToGoal && (
          <AddToGoalModal goal={addToGoal} onUpdate={() => {}} onClose={() => setAddToGoal(null)} />
        )}
      </Modal>
    </PageContainer>
  );
}
