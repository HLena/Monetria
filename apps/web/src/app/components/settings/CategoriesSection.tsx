import { useState, useEffect, useCallback } from 'react';
import { Save, Edit2, Trash2 } from 'lucide-react';
import type { CategoryDto } from '@/app/types/api';
import {
  listCategories as listCategoriesApi,
  createCategory as createCategoryApi,
  updateCategory as updateCategoryApi,
  deactivateCategory,
  activateCategory,
} from '@/app/api';
import { ErrorBanner, FormField, SectionCard, ColorPicker } from '@/app/components/shared';
import { Input } from '@/app/components/ui';
import { CategoryIconCircle, getCategoryIcon } from '@/app/lib/categoryIcons';

const CATEGORY_COLORS = [
  '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#6366f1',
  '#14b8a6', '#94a3b8',
];

const AVAILABLE_ICONS = [
  'ShoppingCart', 'Car', 'Heart', 'GraduationCap', 'Zap', 'Laptop',
  'Shirt', 'Home', 'Plane', 'UtensilsCrossed', 'Briefcase', 'Code2',
  'TrendingUp', 'Store', 'Gift', 'CircleDot', 'Clapperboard',
];

interface CategoryFormState {
  name: string;
  type: 'Income' | 'Expense';
  color: string;
  keyIcon: string;
}

function TypePill({ type }: { type: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
      type === 'Income'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
    }`}>
      {type === 'Income' ? 'Ingreso' : 'Gasto'}
    </span>
  );
}

function useSettingsCategories() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCategoriesApi(true);
      setCategories(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (data: { name: string; type: string; color?: string; keyIcon?: string }) => {
    await createCategoryApi({ name: data.name, type: data.type as 'Income' | 'Expense', color: data.color, keyIcon: data.keyIcon });
    await reload();
  }, [reload]);

  const updateCategory = useCallback(async (id: string, data: { name: string; color?: string; keyIcon?: string }) => {
    await updateCategoryApi(id, data);
    await reload();
  }, [reload]);

  const deleteCategory = useCallback(async (id: string) => {
    await deactivateCategory(id);
    await reload();
  }, [reload]);

  const toggleDefaultCategory = useCallback(async (id: string, currentlyActive: boolean) => {
    if (currentlyActive) await deactivateCategory(id);
    else await activateCategory(id);
    await reload();
  }, [reload]);

  return { categories, loading, error, reload, addCategory, updateCategory, deleteCategory, toggleDefaultCategory };
}

export function CategoriesSection() {
  const { categories, loading, error: catError, reload, addCategory, updateCategory, deleteCategory, toggleDefaultCategory } = useSettingsCategories();
  const [editTarget, setEditTarget] = useState<CategoryDto | null>(null);
  const [form, setForm] = useState<CategoryFormState>({ name: '', type: 'Expense', color: '#6366f1', keyIcon: 'CircleDot' });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void reload(); }, [reload]);

  const defaultCats = categories.filter(c => c.isDefault);
  const userCats = categories.filter(c => !c.isDefault && c.isActive);

  function startEdit(cat: CategoryDto) {
    setForm({ name: cat.name, type: cat.type as 'Income' | 'Expense', color: cat.color ?? '#6366f1', keyIcon: cat.keyIcon ?? 'CircleDot' });
    setEditTarget(cat);
    setFormError(null);
  }

  function cancelForm() {
    setEditTarget(null);
    setForm({ name: '', type: 'Expense', color: '#6366f1', keyIcon: 'CircleDot' });
    setFormError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError('El nombre es requerido.'); return; }
    setSaving(true);
    setFormError(null);
    try {
      if (editTarget) {
        await updateCategory(editTarget.id, { name: form.name, color: form.color, keyIcon: form.keyIcon });
      } else {
        await addCategory({ name: form.name, type: form.type, color: form.color, keyIcon: form.keyIcon });
      }
      cancelForm();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {catError && <ErrorBanner message={catError} />}

      <SectionCard title={editTarget ? `Editando: ${editTarget.name}` : 'Nueva categoría'}>
        <div className="space-y-4">
          {formError && <p className="text-sm text-rose-500">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Nombre" required>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Mascotas"
              />
            </FormField>
            {!editTarget && (
              <FormField label="Tipo">
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as 'Income' | 'Expense' }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Expense">Gasto</option>
                  <option value="Income">Ingreso</option>
                </select>
              </FormField>
            )}
          </div>
          <FormField label="Color">
            <ColorPicker colors={CATEGORY_COLORS} value={form.color} onChange={v => setForm(f => ({ ...f, color: v }))} />
          </FormField>
          <FormField label="Ícono">
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map(key => {
                const Icon = getCategoryIcon(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, keyIcon: key }))}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all ${
                      form.keyIcon === key
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                    style={{ color: form.keyIcon === key ? form.color : undefined }}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </FormField>
          <div className="flex gap-2 pt-1">
            {editTarget && (
              <button
                type="button"
                onClick={cancelForm}
                className="py-2.5 px-4 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando…' : editTarget ? 'Actualizar' : 'Crear categoría'}
            </button>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Categorías del sistema">
          <p className="text-xs text-slate-400 dark:text-slate-500 py-2">Activa o desactiva las categorías que quieras usar.</p>
          {loading ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-2">Cargando…</p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {defaultCats.map(cat => (
                <div
                  key={cat.id}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                    cat.isActive ? 'bg-slate-50 dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/30 opacity-50'
                  }`}
                >
                  <CategoryIconCircle iconKey={cat.keyIcon} color={cat.isActive ? (cat.color ?? undefined) : '#94a3b8'} size="sm" />
                  <span className="text-sm text-slate-600 dark:text-slate-300 flex-1 min-w-0 truncate">{cat.name}</span>
                  <TypePill type={cat.type} />
                  <button
                    type="button"
                    role="switch"
                    aria-checked={cat.isActive}
                    onClick={() => toggleDefaultCategory(cat.id, cat.isActive)}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                      cat.isActive ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      cat.isActive ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Mis categorías">
          {userCats.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-2">Usa el formulario de arriba para crear tu primera categoría.</p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {userCats.map(cat => (
                <div
                  key={cat.id}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 transition-all ${
                    editTarget?.id === cat.id ? 'ring-2 ring-indigo-400' : ''
                  }`}
                >
                  <CategoryIconCircle iconKey={cat.keyIcon} color={cat.color ?? undefined} size="sm" />
                  <span className="text-sm text-slate-700 dark:text-slate-200 flex-1 min-w-0 truncate">{cat.name}</span>
                  <TypePill type={cat.type} />
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
