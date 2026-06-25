import { Edit2, Trash2, ArrowLeftRight } from 'lucide-react';
import { Transaction } from '../../types/finance';
import type { Account } from '../../types/models';
import { formatAmount } from '../../lib/formatAmount';
import { CategoryIconCircle } from '../../lib/categoryIcons';

export function TransactionRow({
  transaction: tx,
  account,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  account: Account | undefined;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
      {tx.categoryId ? (
        <CategoryIconCircle iconKey={tx.categoryKeyIcon} color={tx.categoryColor} />
      ) : (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-800">
          <ArrowLeftRight className="w-5 h-5 text-slate-400 dark:text-slate-500" strokeWidth={2} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">
          {tx.description || tx.category || 'Transferencia'}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-slate-400 dark:text-slate-500 text-xs">
            {tx.category || 'Transferencia'}
          </span>
          <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{
              background: account ? `${account.colorCode}20` : '#f1f5f9',
              color: account ? account.colorCode : '#94a3b8',
            }}
          >
            {account?.name ?? 'Cuenta eliminada'}
          </span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-semibold ${
          tx.type === 'income' || (tx.type === 'transfer' && !tx.toAccountId)
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400'
        }`}>
          {tx.type === 'income' || (tx.type === 'transfer' && !tx.toAccountId) ? '+' : '-'}
          {formatAmount(tx.amount, tx.currency ?? 'PEN')}
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-xs">
          {new Date(tx.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(tx)}
              className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(tx.id)}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
