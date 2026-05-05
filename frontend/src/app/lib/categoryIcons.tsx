import type { LucideIcon } from 'lucide-react';
import React from 'react';
import {
  Briefcase,
  Car,
  CircleDot,
  Clapperboard,
  Code2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  Plane,
  Shirt,
  ShoppingCart,
  Store,
  TrendingUp,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import { CATEGORY_COLORS } from '../types/finance';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Alimentación: ShoppingCart,
  Transporte: Car,
  Entretenimiento: Clapperboard,
  Salud: Heart,
  Educación: GraduationCap,
  Servicios: Zap,
  Tecnología: Laptop,
  Ropa: Shirt,
  Hogar: Home,
  Viajes: Plane,
  Restaurantes: UtensilsCrossed,
  Otros: CircleDot,
  Salario: Briefcase,
  Freelance: Code2,
  Inversiones: TrendingUp,
  Ventas: Store,
  Bonos: Gift,
  Ahorro: TrendingUp,
};

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? CircleDot;
}

export function CategoryIconCircle({
  category,
  size = 'md',
  className = '',
}: {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const Icon = getCategoryIcon(category);
  const bg = CATEGORY_COLORS[category] ?? '#94a3b8';
  const box =
    size === 'sm' ? 'w-8 h-8 rounded-lg' : size === 'lg' ? 'w-12 h-12 rounded-2xl' : 'w-10 h-10 rounded-xl';
  const iconClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <div
      className={`${box} flex items-center justify-center flex-shrink-0 text-white ${className}`}
      style={{ background: bg }}
      aria-hidden
    >
      <Icon className={iconClass} strokeWidth={2} />
    </div>
  );
}
