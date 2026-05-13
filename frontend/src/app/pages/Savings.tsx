import React, { useState } from 'react';
import { Plus, Trash2, Edit2, PiggyBank, Calculator, Calendar, Target } from 'lucide-react';
import { useFinance, formatCurrency } from '../store/FinanceContext';
import { SavingsGoal } from '../types/finance';
import { Modal } from '../components/Modal';
import { useFinanceStore } from '../store/FinanceStore';

const GOAL_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16',
];

const GOAL_CATEGORIES = ['Viajes', 'Tecnología', 'Hogar', 'Vehículo', 'Educación', 'Emergencia', 'Inversión', 'Retiro', 'Otro'];

function SavingsGoalForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: SavingsGoal;
  onSave: (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    targetAmount: initial?.targetAmount || 0,
    currentAmount: initial?.currentAmount || 0,
    targetDate: initial?.targetDate || '',
    category: initial?.category || GOAL_CATEGORIES[0],
    color: initial?.color || GOAL_COLORS[0],
    description: initial?.description || '',
  });

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      targetAmount: parseFloat(form.targetAmount.toString()) || 0,
      currentAmount: parseFloat(form.currentAmount.toString()) || 0,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-slate-600 font-medium mb-1 block">Nombre de la meta *</label>
        <input
          required
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Ej: Viaje a Europa"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Meta (MXN) *</label>
          <input
            required
            type="number"
            min="1"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="50000"
            value={form.targetAmount || ''}
            onChange={e => set('targetAmount', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Ahorrado hasta ahora</label>
          <input
            type="number"
            min="0"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="0"
            value={form.currentAmount || ''}
            onChange={e => set('currentAmount', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Fecha límite *</label>
          <input
            required
            type="date"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.targetDate}
            onChange={e => set('targetDate', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 font-medium mb-1 block">Categoría</label>
          <select
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            value={form.category}
            onChange={e => set('category', e.target.value)}
          >
            {GOAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm text-slate-600 font-medium mb-1 block">Descripción</label>
        <textarea
          rows={2}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          placeholder="Descripción opcional..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm text-slate-600 font-medium mb-2 block">Color</label>
        <div className="flex gap-2 flex-wrap">
          {GOAL_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => set('color', color)}
              className={`w-8 h-8 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
              style={{ background: color }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancelar</button>
        <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700">
          {initial ? 'Guardar cambios' : 'Crear meta'}
        </button>
      </div>
    </form>
  );
}

function AddToGoalModal({
  goal,
  onUpdate,
  onClose,
}: {
  goal: SavingsGoal;
  onUpdate: (amount: number) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (n > 0) {
      onUpdate(Math.min(goal.currentAmount + n, goal.targetAmount));
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-slate-500 text-sm">Agregar dinero a: <strong className="text-slate-700">{goal.name}</strong></p>
      <div>
        <label className="text-sm text-slate-600 font-medium mb-1 block">Cantidad a agregar (MXN)</label>
        <input
          required
          type="number"
          min="1"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="1000"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          autoFocus
        />
        <p className="text-slate-400 text-xs mt-1">
          Pendiente: {formatCurrency(goal.targetAmount - goal.currentAmount)}
        </p>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancelar</button>
        <button type="submit" className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-emerald-700">Agregar</button>
      </div>
    </form>
  );
}

function SavingsCalculator() {
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [months, setMonths] = useState('');
  const [monthly, setMonthly] = useState('');
  const [mode, setMode] = useState<'months' | 'monthly'>('monthly');

  const targetNum = parseFloat(target) || 0;
  const currentNum = parseFloat(current) || 0;
  const remaining = Math.max(0, targetNum - currentNum);

  const result = (() => {
    if (!targetNum || !currentNum && currentNum !== 0) return null;
    if (mode === 'monthly' && months) {
      const m = parseFloat(months);
      if (m > 0) return remaining / m;
    }
    if (mode === 'months' && monthly) {
      const mo = parseFloat(monthly);
      if (mo > 0) return Math.ceil(remaining / mo);
    }
    return null;
  })();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="w-5 h-5 text-indigo-500" />
        <h2 className="text-slate-700 font-semibold">Calculadora de Ahorro</h2>
      </div>

      <div className="flex gap-2 mb-5 bg-slate-100 rounded-xl p-1">
        <button
          onClick={() => setMode('monthly')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          ¿Cuánto ahorrar?
        </button>
        <button
          onClick={() => setMode('months')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'months' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          ¿Cuánto tiempo?
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Meta ($)</label>
            <input
              type="number"
              min="0"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="50,000"
              value={target}
              onChange={e => setTarget(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Ya tengo ($)</label>
            <input
              type="number"
              min="0"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="0"
              value={current}
              onChange={e => setCurrent(e.target.value)}
            />
          </div>
        </div>

        {mode === 'monthly' ? (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">¿En cuántos meses?</label>
            <input
              type="number"
              min="1"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="12"
              value={months}
              onChange={e => setMonths(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Ahorro mensual ($)</label>
            <input
              type="number"
              min="1"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="3,000"
              value={monthly}
              onChange={e => setMonthly(e.target.value)}
            />
          </div>
        )}

        {remaining > 0 && (
          <div className="bg-slate-50 rounded-xl p-3 text-sm">
            <p className="text-slate-400 text-xs">Pendiente por ahorrar</p>
            <p className="text-slate-700 font-bold">{formatCurrency(remaining)}</p>
          </div>
        )}

        {result !== null && result > 0 && (
          <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
            <p className="text-indigo-500 text-xs mb-1">
              {mode === 'monthly' ? 'Debes ahorrar mensualmente:' : 'Lo lograrás en:'}
            </p>
            <p className="text-indigo-700 text-2xl font-bold">
              {mode === 'monthly'
                ? formatCurrency(result)
                : `${result} mes${result !== 1 ? 'es' : ''}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Savings() {
  const { savingsGoals } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [addToGoal, setAddToGoal] = useState<SavingsGoal | null>(null);

  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const completedGoals = savingsGoals.filter(g => g.currentAmount >= g.targetAmount).length;

  const daysUntil = (dateStr: string) => {
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const monthsUntil = (dateStr: string) => {
    const days = daysUntil(dateStr);
    return Math.max(1, Math.ceil(days / 30));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100 text-2xl font-bold">Metas de Ahorro</h1>
          <p className="text-slate-500 text-sm mt-1">{savingsGoals.length} metas activas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Nueva Meta
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
          <p className="text-indigo-600 text-sm">Total a ahorrar</p>
          <p className="text-indigo-700 text-2xl font-bold mt-1">{formatCurrency(totalTarget)}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <p className="text-emerald-600 text-sm">Ya ahorrado</p>
          <p className="text-emerald-700 text-2xl font-bold mt-1">{formatCurrency(totalSaved)}</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
          <p className="text-purple-600 text-sm">Metas completadas</p>
          <p className="text-purple-700 text-2xl font-bold mt-1">{completedGoals} / {savingsGoals.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals list */}
        <div className="lg:col-span-2 space-y-4">
          {savingsGoals.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-sm border border-slate-100 dark:border-slate-800">
              <PiggyBank className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No hay metas de ahorro</p>
              <button onClick={() => setShowForm(true)} className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
                Crear primera meta
              </button>
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
                <div key={goal.id} className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border ${isCompleted ? 'border-emerald-200' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `${goal.color}20` }}
                      >
                        <Target className="w-6 h-6" style={{ color: goal.color }} />
                      </div>
                      <div>
                        <p className="text-slate-800 font-semibold">{goal.name}</p>
                        <p className="text-slate-400 text-xs">{goal.category}</p>
                        {goal.description && (
                          <p className="text-slate-400 text-xs mt-0.5">{goal.description}</p>
                        )}
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        ¡Completado! 🎉
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600 font-semibold">{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-slate-400">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, background: goal.color }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span style={{ color: goal.color }} className="font-medium">{percent.toFixed(1)}% alcanzado</span>
                      <span className="text-slate-400">
                        Faltan {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <Calendar className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                      <p className="text-slate-700 text-sm font-semibold">
                        {days > 0 ? days : 0}
                      </p>
                      <p className="text-slate-400 text-xs">días</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-slate-700 text-sm font-semibold">{months}</p>
                      <p className="text-slate-400 text-xs">meses</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-slate-700 text-sm font-semibold">
                        {monthlyNeeded > 0 ? formatCurrency(monthlyNeeded).replace('MX$', '$') : '—'}
                      </p>
                      <p className="text-slate-400 text-xs">al mes</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    {!isCompleted && (
                      <button
                        onClick={() => setAddToGoal(goal)}
                        className="flex-1 bg-emerald-50 text-emerald-600 rounded-xl py-2 text-sm font-medium hover:bg-emerald-100 transition-colors"
                      >
                        + Agregar ahorro
                      </button>
                    )}
                    <button
                      onClick={() => setEditGoal(goal)}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {}}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Calculator */}
        <div>
          <SavingsCalculator />
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nueva Meta de Ahorro" size="lg">
        <SavingsGoalForm onSave={() => {}} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editGoal} onClose={() => setEditGoal(null)} title="Editar Meta" size="lg">
        {editGoal && (
          <SavingsGoalForm
            initial={editGoal}
            onSave={() => {}}
            onClose={() => setEditGoal(null)}
          />
        )}
      </Modal>
      <Modal isOpen={!!addToGoal} onClose={() => setAddToGoal(null)} title="Agregar Ahorro" size="sm">
        {addToGoal && (
          <AddToGoalModal
            goal={addToGoal}
            onUpdate={ () => {}}
            onClose={() => setAddToGoal(null)}
          />
        )}
      </Modal>
    </div>
  );
}
