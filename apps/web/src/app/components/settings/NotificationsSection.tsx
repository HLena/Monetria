import { SectionCard, ToggleSwitch } from '@/app/components/shared';

export function NotificationsSection() {
  return (
    <SectionCard title="Alertas y notificaciones">
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        Las notificaciones estarán disponibles cuando se implementen las alertas automáticas.
      </p>
      <div className="space-y-3 opacity-50 pointer-events-none">
        <ToggleSwitch value={false} onChange={() => {}} label="Presupuesto excedido" description="Avísame cuando supere el límite de una categoría" />
        <ToggleSwitch value={false} onChange={() => {}} label="Cierre de tarjeta próximo" description="Recordatorio antes de que cierre mi tarjeta de crédito" />
        <ToggleSwitch value={false} onChange={() => {}} label="Recurrentes próximos" description="Avísame 3 días antes de un pago recurrente" />
      </div>
      <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-4 font-medium">Próximamente</p>
    </SectionCard>
  );
}
