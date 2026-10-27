import { Save } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';

export function SaveButton({ loading, disabled, label = 'Guardar cambios', onClick }: {
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <Button type="button" onClick={onClick} disabled={loading || disabled}>
      <Save className="w-4 h-4" />
      {loading ? 'Guardando…' : label}
    </Button>
  );
}
