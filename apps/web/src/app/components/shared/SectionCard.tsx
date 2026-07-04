export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
      <h3 className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest py-2">{title}</h3>
      {children}
    </div>
  );
}
