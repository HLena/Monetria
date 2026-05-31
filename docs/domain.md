# Domain Rules

## Entities and Rules

### Account
- Balance = InitialBalance + SUM(transactions delta) — never stored as column
- InitialBalance default 0 — represents historical balance before using the app
- Soft delete: IsActive = false
- Types: Cash, BankAccount, CreditCard, EWallet

### Transaction
- Amount always positive — type defines direction
- Immutable after creation — soft delete only (IsActive = false)
- Transfer = always 2 rows linked by TransferPairId inside one UnitOfWork
- Transfers never affect budgets

### Category
- UserId nullable = system default category (cannot be deleted by user)
- Soft delete: IsActive = false

### Budget
- CategoryId = real FK to Category — never string or enum
- Period defined by Month (int) + Year (int) — not a generic enum
- SpentAmount = calculated from transactions — never stored
- Unique constraint: (UserId, CategoryId, Month, Year)
- RolloverUnused: unused amount carries over to next month

### Recurring (renamed from FixedExpense)
- Covers income, expenses and transfers — not just fixed expenses
- AmountType:
  - Fixed → auto-creates Transaction on due date
  - Estimated → creates RecurringOccurrence(Pending), user confirms with real amount
  - VariableFree → creates RecurringOccurrence(Pending), user enters amount manually
- RecurringOccurrence tracks each execution: Pending/Confirmed/Skipped/AutoRegistered

### SavingsGoal
- LinkedAccountId (nullable) → if set, CurrentAmount = account balance (calculated)
- If not linked → CurrentAmount updated manually by user
- IsCompleted = true when TargetAmount reached

### Debt
- Payment always creates Transaction(Expense) + reduces RemainingAmount atomically
- IsActive = false when fully paid (RemainingAmount <= 0)

## Monetary Precision
- All amounts: decimal(18,2)
- Interest rates: decimal(9,4)
- Never float or double

## Soft Delete
- All financial entities use IsActive = false — never hard delete
- Reason: financial history must be preserved for audit and balance calculations