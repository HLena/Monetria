import { useState, useCallback } from 'react';
import type { CategoryDto } from '@/app/types/api';
import {
  listCategories as listCategoriesApi,
  createCategory as createCategoryApi,
  updateCategory as updateCategoryApi,
  deleteCategory as deleteCategoryApi,
  setSystemCategoryPreference,
} from '@/app/api';

export function useSettingsCategories() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useCallback needed: used in useEffect dependency array in CategoriesSection
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

  async function addCategory(data: { name: string; type: string; color?: string; keyIcon?: string }) {
    const tempId = `temp-${Date.now()}`;
    const tempCategory: CategoryDto = {
      id: tempId,
      userId: 'pending',
      name: data.name.trim(),
      type: data.type as 'Income' | 'Expense',
      isDefault: false,
      isActive: true,
      color: data.color ?? null,
      keyIcon: data.keyIcon ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCategories(prev => [...prev, tempCategory]);
    try {
      const created = await createCategoryApi({
        name: data.name,
        type: data.type as 'Income' | 'Expense',
        color: data.color,
        keyIcon: data.keyIcon,
      });
      setCategories(prev => prev.map(c => c.id === tempId ? created : c));
    } catch (e) {
      setCategories(prev => prev.filter(c => c.id !== tempId));
      throw e;
    }
  }

  async function updateCategory(id: string, data: { name: string; color?: string; keyIcon?: string }) {
    const previous = categories.find(c => c.id === id);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data, name: data.name.trim() } : c));
    try {
      const updated = await updateCategoryApi(id, data);
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
    } catch (e) {
      if (previous) setCategories(prev => prev.map(c => c.id === id ? previous : c));
      throw e;
    }
  }

  async function deleteCategory(id: string) {
    const previous = categories.find(c => c.id === id);
    setCategories(prev => prev.filter(c => c.id !== id));
    try {
      await deleteCategoryApi(id);
    } catch (e) {
      if (previous) setCategories(prev => [...prev, previous]);
      throw e;
    }
  }

  async function toggleDefaultCategory(id: string, currentlyActive: boolean) {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentlyActive } : c));
    try {
      await setSystemCategoryPreference(id, !currentlyActive);
    } catch {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: currentlyActive } : c));
    }
  }

  return { categories, loading, error, reload, addCategory, updateCategory, deleteCategory, toggleDefaultCategory };
}
