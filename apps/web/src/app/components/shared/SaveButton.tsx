import { Save } from 'lucide-react';

export function SaveButton({ loading, disabled, label = 'Guardar cambios', onClick }: {
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
    >
      <Save className="w-4 h-4" />
      {loading ? 'Guardando…' : label}
    </button>
  );
}
