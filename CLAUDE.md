# Monetria — Project Context

## What is this project
Personal finance app. Monorepo with React frontend and ASP.NET Core backend.

## Docs
Full documentation is in `/docs/`. Read relevant files before making changes:
- `/docs/architecture.md` — Clean Architecture layers
- `/docs/domain.md` — domain rules per entity
- `/docs/decisions.md` — technical decisions log
- `/docs/project-structure.md` — full project structure
- `/docs/features/` — feature specifications
- `/docs/explanations/` — change logs per module

## Monorepo Structure

Monetria/
├── apps/
│   ├── web/     ← React 18 + Vite + TypeScript + Tailwind + Zustand + React Hook Form
│   └── api/     ← ASP.NET Core 10 + C# 13 + EF Core 10 + PostgreSQL + JWT
├── packages/
│   └── enums/   ← @monetria/enums — shared TypeScript enums
├── package.json ← npm workspaces (packageManager: npm)
└── turbo.json

## Running the Project
```bash
npm run dev        # web + api together
npm run dev:web    # React only (port 5173)
npm run dev:api    # .NET only (port 5000/5001)

# Migrations — always from monorepo root
dotnet ef migrations add <Name> --project apps/api/Monetria.Infrastructure --startup-project apps/api/Monetria.API
dotnet ef database update --project apps/api/Monetria.Infrastructure --startup-project apps/api/Monetria.API
```

## Domain Entities — Quick Reference

### Account
- Fields: Id, UserId, Name, Type, CurrencyCode, InitialBalance (decimal, default 0), ColorCode, IsActive
- Credit card extra: InstitutionName, CardLast4Digits, CreditLimit, CardHolderName, StatementClosingDay, PaymentDueDay
- Balance = InitialBalance + SUM(transactions delta) — never stored as column

### Transaction
- Fields: Id, AccountId (FK), Type (Income/Expense/Transfer), CategoryId (FK nullable), Amount, Description, TransferPairId (nullable), IsActive, Date, CreatedAt
- ⚠️ Transfer = always 2 rows linked by TransferPairId inside one UnitOfWork

### Category
- Fields: Id, UserId (nullable = system), Name, Type, IsDefault, IsActive, Color, KeyIcon

### Budget
- Fields: Id, UserId, CategoryId (FK), LimitAmount, Month (int), Year (int), RolloverUnused
- SpentAmount = calculated, never stored
- Unique: (UserId, CategoryId, Month, Year)

### Recurring (renamed from FixedExpense)
- Fields: Id, UserId, AccountId, ToAccountId (nullable), CategoryId (nullable), Name, Type, AmountType (Fixed/Estimated/VariableFree), Amount (nullable), EstimatedAmount (nullable), Frequency, StartDate, EndDate (nullable), NextDueDate, IsActive

### RecurringOccurrence
- Fields: Id, RecurringId, ScheduledDate, Status (Pending/Confirmed/Skipped/AutoRegistered), SuggestedAmount, RealAmount, TransactionId (nullable), ConfirmedAt

### SavingsGoal
- Fields: Id, UserId, Name, TargetAmount, CurrentAmount, LinkedAccountId (nullable), TargetDate (nullable), CategoryId (nullable), Color, Description, IsCompleted
- If LinkedAccountId set: CurrentAmount = account balance (calculated)

### Debt
- Fields: Id, UserId, AccountId (nullable), CategoryId (nullable), Name, Creditor, OriginalAmount, RemainingAmount, InterestRate, MinimumPayment, NextPaymentDate, Type, IsActive

## Critical Business Rules
1. Account balance = InitialBalance + SUM(income) - SUM(expenses) — never store as column
2. Transfers never affect budgets — not income or expense
3. Transfer = 2 Transaction rows with TransferPairId, created atomically in one UnitOfWork
4. Budget spending = SUM transactions WHERE CategoryId matches AND date within Month/Year
5. Recurring Fixed → auto-creates Transaction
6. Recurring Estimated/VariableFree → creates RecurringOccurrence(Pending), user confirms
7. SavingsGoal.CurrentAmount = linked account balance if LinkedAccountId set, else manual
8. Debt payment = Transaction(Expense) + reduce RemainingAmount in one UnitOfWork
9. Never hard delete financial records — always soft delete (IsActive = false)
10. All monetary amounts: decimal(18,2) — never float or double

## Pending Changes (do these in order)
- [x] Fix transfers — 2 atomic rows with TransferPairId (migration + data backfill applied)
- [ ] Rename FixedExpense → Recurring + new fields + RecurringOccurrence entity
- [ ] Fix Budget — CategoryId FK + Month/Year fields + BudgetService calculates SpentAmount
- [ ] Fix SavingsGoal — add LinkedAccountId + IsCompleted
- [ ] Fix Debt — add AccountId + CategoryId + POST /debts/{id}/pay endpoint
- [ ] Add GET /dashboard endpoint
- [ ] Add pagination to GET /transactions
- [ ] Setup orval in packages/types for TypeScript type generation from Swagger
- [ ] Create apps/mobile with Expo

## Completed
- [x] Monorepo with Turborepo + npm workspaces
- [x] @monetria/enums package with AccountType
- [x] InitialBalance restored to Account entity
- [x] BalanceService updated to include InitialBalance
- [x] Clean Architecture (Domain/Application/Infrastructure/API)
- [x] JWT + BCrypt auth
- [x] Soft delete on Transaction and Category
- [x] decimal(18,2) for all monetary amounts
- [x] Swagger active

## Workflow
Before coding:
1. Read relevant docs in /docs/
2. Explain approach
3. Create plan
4. Wait for approval

When implementing:
1. Backend first
2. Tests second  
3. Frontend last

After implementing:
1. If instructed to commit — create focused git commits per change
2. After each change — update relevant file in docs/explanations/

Never:
- Modify unrelated files
- Add unnecessary dependencies
- Break existing APIs
- Use float/double for money
- Hard delete financial records