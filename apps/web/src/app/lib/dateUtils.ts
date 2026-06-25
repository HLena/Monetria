export function formatDateLabel(dateStr: string): string {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (dateStr === todayStr) return 'Hoy';
  if (dateStr === yesterdayStr) return 'Ayer';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}
