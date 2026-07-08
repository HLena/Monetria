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
    await createCategoryApi({ name: data.name, type: data.type as 'Income' | 'Expense', color: data.color, keyIcon: data.keyIcon });
    await reload();
  }

  async function updateCategory(id: string, data: { name: string; color?: string; keyIcon?: string }) {
    await updateCategoryApi(id, data);
    await reload();
  }

  async function deleteCategory(id: string) {
    await deleteCategoryApi(id);
    await reload();
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
