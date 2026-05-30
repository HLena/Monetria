import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { AccountDetail } from './pages/AccountDetail';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { FixedExpenses } from './pages/FixedExpenses';
import { Savings } from './pages/Savings';
import { DebtPlanning } from './pages/DebtPlanning';
import { Reports } from './pages/Reports';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  { path: '/login', Component: Login },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'accounts', Component: Accounts },
      { path: 'accounts/:id', Component: AccountDetail },
      { path: 'transactions', Component: Transactions },
      { path: 'fixed-expenses', Component: FixedExpenses },
      { path: 'budgets', Component: Budgets },
      { path: 'savings', Component: Savings },
      { path: 'debts', Component: DebtPlanning },
      { path: 'reports', Component: Reports },
      { path: '*', Component: NotFound },
    ],
  },
]);
