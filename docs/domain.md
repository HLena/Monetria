# Monetria Domain Rules

## Transactions

Transaction types:
- Expense
- Income
- Transfer

Rules:
- Amount must be positive
- Transactions are immutable
- Deleting creates reversal
- Currency required

---

## Accounts

Rules:
- Balance cannot drift
- Balance derived from transactions
- Account must belong to user

---

## Budgets

Rules:
- Budget period is monthly
- Budget cannot be negative
- Category budget optional

---

## Savings Goals

Rules:
- Goal target required
- Current progress auto calculated

---

## Debts

Rules:
- Debt must have due date
- Interest optional
- Payment reduces balance

---

## Precision Rules

Money:
- Use decimal only
- Never use float
- Round to 2 decimals