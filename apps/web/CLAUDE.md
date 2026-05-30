# Frontend Rules

## Stack

- React
- TypeScript
- Vite

---

## Architecture

Use feature-based structure.

Shared UI goes into reusable components.

Avoid duplication.

---

## Reusability Rules

Before creating a new UI block:

1. Check if reusable component exists.
2. If repeated more than 2 times → extract component.
3. Prefer composition over duplication.

Examples of reusable components:

- HeaderPage
- PageContainer
- SectionCard
- EmptyState
- LoadingState
- ConfirmDialog
- FormField
- CurrencyInput
- PageActions

---

## HeaderPage Standard

Pages must use reusable `HeaderPage` component.

Purpose:
Provide consistent page headers.

Should support:

- title
- subtitle
- actions
- breadcrumbs (future)

Example usage:

```tsx
<HeaderPage
  title="Transactions"
  subtitle="Manage incomes and expenses"
  actions={<Button>Add Transaction</Button>}
/>
```

Do NOT duplicate page header markup.

---

## Component Rules

Reusable components go in:

src/components/shared/

Feature-specific components go in:

src/app/[feature]/components/

Example:

shared:
- HeaderPage
- Modal
- Button
- PageCard

feature:
- TransactionFilters
- BudgetProgress
- DebtSummaryCard

---

## UI Consistency Rules

Pages should follow same layout:

HeaderPage
↓
filters/actions
↓
content
↓
empty state

Spacing:
- consistent margins
- no arbitrary spacing

Avoid:
- duplicated layouts
- hardcoded styles
- repeated typography patterns

---

## Async State Rules

Every async screen must handle:

- loading
- empty
- error
- success

No blank screens allowed.

---

## API Rules

Do not call API directly inside UI components.

Use hooks/services.

Example:

Bad:
TransactionsPage.tsx → fetch()

Good:
useTransactions()

# Paginas
