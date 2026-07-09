import { AccountType } from "@monetria/enums";
import { Banknote, CreditCardIcon, Landmark, Smartphone } from "lucide-react";

export const CARD_COLORS = [
  '#e63946', '#2563eb', '#059669', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#dc2626', '#9333ea',
];

export function usageColor(ratio: number): string {
  if (ratio < 0.5) return '#34d399';
  if (ratio < 0.8) return '#fbbf24';
  return '#f87171';
}

export const FILTER_TABS: [AccountType | 'all', string][] = [
  ['all', 'Todas'],
  [AccountType.CreditCard, 'Crédito'],
  [AccountType.BankAccount, 'Bancaria'],
  [AccountType.Cash, 'Efectivo'],
  [AccountType.Wallet, 'Billetera'],
];

export const TYPE_CONFIG: Record<number, { label: string; icon: typeof Banknote; badge: string; iconBg: string }> = { 
  [AccountType.Cash]:       { label: 'Efectivo',          icon: Banknote,       badge: 'bg-emerald-500/20 text-emerald-400', iconBg: 'bg-emerald-500/10 text-emerald-400' },
  [AccountType.BankAccount]:{ label: 'Bancaria',           icon: Landmark,       badge: 'bg-blue-500/20 text-blue-400',      iconBg: 'bg-blue-500/10 text-blue-400' },
  [AccountType.CreditCard]: { label: 'Tarjeta de crédito', icon: CreditCardIcon, badge: 'bg-red-500/20 text-red-400',        iconBg: 'bg-red-500/10 text-red-400' },
  [AccountType.Wallet]:     { label: 'Billetera',          icon: Smartphone,     badge: 'bg-purple-500/20 text-purple-400',  iconBg: 'bg-purple-500/10 text-purple-400' },
};

export const CURRENCY_SYMBOL: Record<string, string> = {
  PEN: 'S/',
  USD: '$',
};