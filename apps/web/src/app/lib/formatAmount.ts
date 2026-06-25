const LOCALE: Record<string, string> = {
  PEN: 'es-PE',
  USD: 'en-US',
};

export function formatAmount(amount: number, currencyCode: string): string {
  const locale = LOCALE[currencyCode] ?? 'es-PE';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(amount);
}
