import type { LucideIcon } from 'lucide-react';
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

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingCart,
  Car,
  Clapperboard,
  Heart,
  GraduationCap,
  Zap,
  Laptop,
  Shirt,
  Home,
  Plane,
  UtensilsCrossed,
  Briefcase,
  Code2,
  TrendingUp,
  Store,
  Gift,
  CircleDot,
};

// Fallback for pages that still pass category name instead of iconKey
const CATEGORY_NAME_TO_KEY: Record<string, string> = {
  Alimentación: 'ShoppingCart',
  Transporte: 'Car',
  Entretenimiento: 'Clapperboard',
  Salud: 'Heart',
  Educación: 'GraduationCap',
  Servicios: 'Zap',
  Tecnología: 'Laptop',
  Ropa: 'Shirt',
  Hogar: 'Home',
  Viajes: 'Plane',
  Restaurantes: 'UtensilsCrossed',
  Salario: 'Briefcase',
  Freelance: 'Code2',
  Inversiones: 'TrendingUp',
  Ventas: 'Store',
  Bonos: 'Gift',
};

export function getCategoryIcon(iconKey?: string | null): LucideIcon {
  return (iconKey && ICON_MAP[iconKey]) || CircleDot;
}

export function CategoryIconCircle({
  iconKey,
  category,
  color,
  size = 'md',
  className = '',
}: {
  iconKey?: string | null;
  category?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const resolvedKey = iconKey ?? (category ? CATEGORY_NAME_TO_KEY[category] : null);
  const Icon = getCategoryIcon(resolvedKey);
  const box =
    size === 'xs' ? 'w-6 h-6 rounded-md'
    : size === 'sm' ? 'w-8 h-8 rounded-lg'
    : size === 'lg' ? 'w-12 h-12 rounded-2xl'
    : 'w-10 h-10 rounded-xl';
  const iconClass =
    size === 'xs' ? 'w-3 h-3'
    : size === 'sm' ? 'w-4 h-4'
    : size === 'lg' ? 'w-6 h-6'
    : 'w-5 h-5';

  return (
    <div
      className={`${box} flex items-center justify-center flex-shrink-0 text-white ${className}`}
      style={{ background: color || '#94a3b8' }}
      aria-hidden
    >
      <Icon className={iconClass} strokeWidth={2} />
    </div>
  );
}
