export const CARD_COLORS = [
  '#e63946', '#2563eb', '#059669', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#dc2626', '#9333ea',
];

export function usageColor(ratio: number): string {
  if (ratio < 0.5) return '#34d399';
  if (ratio < 0.8) return '#fbbf24';
  return '#f87171';
}
