export function ErrorMsg({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{message}</p>
  );
}
