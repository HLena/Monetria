export function Divider({ label }: { label?: string }) {
  if (!label) {
    return <hr className="border-slate-100 dark:border-slate-800" />;
  }
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-slate-100 dark:border-slate-800" />
      <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{label}</span>
      <hr className="flex-1 border-slate-100 dark:border-slate-800" />
    </div>
  );
}
