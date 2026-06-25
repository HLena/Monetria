import { useMemo } from 'react';
import type { Transaction } from '../../types/finance';
import type { Account } from '../../types/models';
import { TransactionRow } from './TransactionRow';
import { formatDateLabel } from '../../lib/dateUtils';

interface Props {
  items: Transaction[];
  accounts: Account[];
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionGroupedList({ items, accounts, onEdit, onDelete }: Props) {
  const groupedItems = useMemo(() => {
    const groups: { date: string; transactions: Transaction[] }[] = [];
    const seen = new Map<string, Transaction[]>();
    for (const tx of items) {
      let group = seen.get(tx.date);
      if (!group) {
        group = [];
        seen.set(tx.date, group);
        groups.push({ date: tx.date, transactions: group });
      }
      group.push(tx);
    }
    return groups;
  }, [items]);

  return (
    <div className="space-y-4">
      {groupedItems.map(group => (
        <div key={group.date}>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase px-1 pb-2">
            {formatDateLabel(group.date)}
          </p>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
            {group.transactions.map(tx => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                account={accounts.find(a => a.id === tx.fromAccountId)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
