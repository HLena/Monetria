import { CreditCard, Landmark, Wallet } from 'lucide-react';
import { Account } from '../../types/models';
import { AccountType } from '../../types/enums';

const SIZES = {
  sm: { container: 'w-7 h-7', icon: 'w-3.5 h-3.5' },
  md: { container: 'w-9 h-9', icon: 'w-4 h-4' },
};

function iconFor(type: AccountType) {
  if (type === AccountType.CreditCard) return CreditCard;
  if (type === AccountType.Wallet) return Wallet;
  return Landmark;
}

export function AccountTypeIcon({ account, size }: { account: Account; size: 'sm' | 'md' }) {
  const { container, icon } = SIZES[size];
  const Icon = iconFor(account.type);
  return (
    <div
      className={`${container} rounded-xl flex items-center justify-center`}
      style={{ backgroundColor: `${account.colorCode}33` }}
    >
      <Icon className={icon} style={{ color: account.colorCode }} />
    </div>
  );
}
