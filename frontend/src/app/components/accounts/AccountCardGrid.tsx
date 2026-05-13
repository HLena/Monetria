import { Link } from 'react-router';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../store/FinanceContext';
import { Account } from '../../types/models';
import { AccountType } from '../../types/enums';
import { AccountTypeIcon } from '../icons/AccountTypeIcon';
import { usageColor } from '../../constants/accountColors';

export function AccountCardGrid({ accounts }: { accounts: Account[] }) {
  const netWorth = accounts.reduce(
    (sum, a) => sum + (a.type === AccountType.CreditCard ? -a.initialBalance : a.initialBalance),
    0,
  );

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 w-full">
      {accounts.map(account => {
        const isCredit = account.type === AccountType.CreditCard;
        const ratio = isCredit && account.creditLimit
          ? account.initialBalance / account.creditLimit
          : null;

        return (
          <Link
            key={account.id}
            to={`/accounts/${account.id}`}
            className="rounded-2xl p-4 flex flex-col gap-3 active:scale-95 transition-transform border border-white/[0.06] overflow-hidden relative"
            style={{ background: `linear-gradient(145deg, ${account.colorCode}22, ${account.colorCode}0a)` }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: account.colorCode }} />
            <AccountTypeIcon account={account} size="md" />
            <div>
              <p className="text-white font-semibold text-sm leading-tight truncate">{account.name}</p>
              {account.institutionName && (
                <p className="text-gray-500 text-[10px] mt-0.5">{account.institutionName}</p>
              )}
            </div>
            <div>
              <p className={`font-bold text-base ${isCredit ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isCredit ? '-' : ''}{formatCurrency(account.initialBalance)}
              </p>
              {ratio !== null && (
                <div className="mt-1.5">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: usageColor(ratio) }}
                    />
                  </div>
                  <p className="text-gray-600 text-[9px] mt-0.5">{(ratio * 100).toFixed(0)}% usado</p>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
