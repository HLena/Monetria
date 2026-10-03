import { useEffect } from 'react';
import { useFinanceStore } from '@/app/store';

export function useCategories() {
  const {
    categories,
    isLoading,
    error,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleDefaultCategory,
  } = useFinanceStore();

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading: isLoading,
    error,
    reload: loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleDefaultCategory,
  };
}
