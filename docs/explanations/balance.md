# Balance System Documentation

## Overview

The Monetria balance system handles three distinct balance concepts, each serving a specific purpose in personal finance tracking:

1. **Account Balance** - The current amount in a specific account
2. **User Balance** - The net financial position (income vs expenses)
3. **Credit Card Debt** - The amount owed on a credit card

---

## 1. Account Balance

**Formula**: `InitialBalance + BalanceDelta`

**Definition**: The current amount of money in a specific account, including all transactions affecting that account.

### Calculation

```
AccountBalance = InitialBalance + Σ(Transactions)

Where Transactions are calculated as:
- Income: +Amount
- Expense: -Amount
- Transfer (outgoing): -Amount
- Transfer (incoming): +Amount
```

### Examples

**Example 1: Simple Account**
- Cash Account with InitialBalance = $1000
- Add Income transaction of $500 → Balance = $1500
- Add Expense transaction of $200 → Balance = $1300
- Final balance: $1300 ✓

**Example 2: Transfer Between Accounts**
- Account A (starting $1000) transfers $300 to Account B (starting $500)
  - Account A: $1000 - $300 = $700
  - Account B: $500 + $300 = $800
  - Total system balance: $1500 (unchanged)

**Example 3: Credit Card Payment**
- Credit Card Account with InitialBalance = $0 (represents $0 owed)
- Add Expense of $500 → Balance = -$500 (owed $500)
- Pay $200 via transfer from Bank Account
  - Credit Card: -$500 + $200 = -$300 (owed $300)
  - Bank Account: reduced by $200
  - User balance unchanged (payment is not income/expense)

---

## 2. User Balance (Overall Financial Position)

**Formula**: `TotalIncome - TotalExpense`

**Definition**: The net financial position reflecting the user's accumulated income minus accumulated expenses, excluding transfers.

### Why Transfers Are Excluded

Transfers between a user's own accounts do not change their overall financial position:
- Money transferred from Account A to Account B still belongs to the user
- The user hasn't gained or lost money overall
- Transfers are internal redistribution, not financial movement

### Calculation

```
UserBalance = Σ(Income Transactions) - Σ(Expense Transactions)

Transfers are EXCLUDED from this calculation.
```

### Examples

**Example 1: Simple Month**
- Income: $3000 (salary)
- Expenses: $2000 (groceries, utilities, etc.)
- Transfer: $500 (to savings account)
- **User Balance = $3000 - $2000 = $1000** ✓
- Transfer does NOT affect this calculation

**Example 2: Multiple Months**
- Month 1: Income $3000, Expenses $2000 → Balance $1000
- Month 2: Income $3500, Expenses $1500 → Balance $2000
- Month 3: Income $2800, Expenses $2300 → Balance $500
- **Overall User Balance = $1000 + $2000 + $500 = $3500** ✓

**Example 3: Transfers Don't Affect User Balance**
- Income: $5000
- Expenses: $3000
- Transfers out: $500, $300, $800 (multiple transfers to savings/investments)
- **User Balance = $5000 - $3000 = $2000** ✓
- The $1600 transferred is still user's money, just moved to different accounts

---

## 3. Credit Card Debt

**Formula**: `Max(0, -AccountBalance)`

**Definition**: The amount owed on a credit card, derived from the account balance.

### How Credit Card Accounts Work

- Credit Card InitialBalance = 0 (represents no balance/no debt)
- Expenses on the card make balance negative (debt increases)
- Payments (transfers from bank to card) make balance less negative (debt decreases)

### Examples

**Example 1: Using Credit Card**
- Initial balance: $0 (no debt)
- Purchase $500: balance = -$500 (owe $500)
- Purchase $300: balance = -$800 (owe $800)
- **Credit Card Debt = $800** ✓

**Example 2: Credit Card Payment**
- Before payment: balance = -$800 (owe $800)
- Transfer $300 from bank account to credit card
- After payment: balance = -$500 (owe $500)
- **Credit Card Debt = $500** ✓
- Bank account balance decreased by $300 (that's the actual payment)
- User balance unchanged (not income/expense, just redistribution)

**Example 3: Paying Off Card**
- Current debt: -$800
- Transfer $800 from bank account
- After payment: balance = $0 (no debt)
- **Credit Card Debt = $0** ✓

---

## 4. API Endpoints

### Get Account Balance (Per Account)

**Endpoint**: `GET /accounts` (list all accounts)

**Response includes**: `CurrentBalance` for each account

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Checking Account",
  "type": "BankAccount",
  "initialBalance": 1000,
  "currentBalance": 1300,
  "currencyCode": "PEN"
}
```

### Get User Overall Balance

**Endpoint**: `GET /accounts/balance/summary`

**Response**:

```json
{
  "totalIncome": 5000,
  "totalExpense": 2500,
  "balance": 2500,
  "currencyCode": "PEN"
}
```

---

## 5. Transaction Types and Their Balance Impact

| Type | Source Account Impact | Destination Account Impact | User Balance | Notes |
|------|----------------------|---------------------------|--------------|-------|
| Income | +Amount | N/A | +Amount | Increases financial position |
| Expense | -Amount | N/A | -Amount | Decreases financial position |
| Transfer | -Amount | +Amount | 0 | Neutral - just redistribution |

---

## 6. Common Scenarios

### Scenario 1: Monthly Budget Review

User wants to see:
1. **Overall financial health**: `GET /accounts/balance/summary` → Shows net income-expense
2. **Account balances**: `GET /accounts` → Shows money in each account

**Interpretation**: If User Balance = $2000 and total account balances sum to $5000, it means:
- Earned $4500 and spent $2500 this month (net +$2000)
- That $2000 was allocated across various accounts (checking $1500, savings $500, etc.)

### Scenario 2: Credit Card Management

User makes $800 purchase on credit card:
- Credit Card Account balance: -$800 (owe $800)
- User Balance: -$800 (spent $800)
- Bank Account: Unaffected

User pays credit card with $500 from bank:
- Transfer from Bank → Credit Card for $500
- Credit Card balance: -$300 (owe $300)
- User Balance: Still -$800 (payment is not income, just redistribution)
- Bank Account balance: -$500

### Scenario 3: Salary Income and Monthly Bills

Month start:
- User Balance: $0
- Bank Account: $5000 (paycheck)

During month:
- Income (salary): +$5000
- Expenses (rent, food, utilities): -$2000
- User Balance after: +$3000

Account balances:
- Bank: $5000 - $2000 = $3000
- Savings (from prior transfer): Unchanged
- Credit Card: $0 (no debt)

---

## 7. Database Implementation

### Transaction Entity

```csharp
public class Transaction
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public TransactionType Type { get; set; }  // Income, Expense, Transfer
    public decimal Amount { get; set; }
    public Guid? TransferAccountId { get; set; }  // For transfers
    public bool IsActive { get; set; }  // Soft delete support
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### Calculation Logic

**GetAccountBalanceDeltaAsync**:
```csharp
public async Task<decimal> GetAccountBalanceDeltaAsync(Guid accountId)
{
    var transactions = await dbContext.Transactions
        .Where(t => t.IsActive && t.AccountId == accountId)
        .ToListAsync();

    return transactions.Sum(t => 
        t.Type switch
        {
            TransactionType.Income => t.Amount,
            TransactionType.Expense => -t.Amount,
            TransactionType.Transfer => -t.Amount,  // Source account pays
            _ => 0
        }
    );
}
```

**GetUserBalanceAsync** (BalanceService):
```csharp
public async Task<UserBalanceResponse> GetUserBalanceAsync(Guid userId)
{
    var incomeTransactions = await transactionRepository
        .ListByUserIdAsync(userId, new TransactionFilterRequest(Type: TransactionType.Income));
    
    var expenseTransactions = await transactionRepository
        .ListByUserIdAsync(userId, new TransactionFilterRequest(Type: TransactionType.Expense));

    var totalIncome = incomeTransactions.Sum(t => t.Amount);
    var totalExpense = expenseTransactions.Sum(t => t.Amount);
    var balance = totalIncome - totalExpense;

    return new UserBalanceResponse(totalIncome, totalExpense, balance, currencyCode);
}
```

---

## 8. Testing Balance Calculations

### Test Cases

1. **Account Balance with Income**: Create income transaction, verify balance increases
2. **Account Balance with Expense**: Create expense transaction, verify balance decreases
3. **Account Balance with Transfer**: Create transfer, verify source decreases and destination increases
4. **User Balance Excludes Transfers**: Create income, expense, and transfer; verify user balance only includes income-expense
5. **User Balance Sums Multiple Accounts**: Verify balance aggregates across all user accounts
6. **Credit Card Debt Calculation**: Verify negative balance correctly represents debt

### Example Test

```csharp
[Fact]
public async Task GetUserBalanceAsync_WithTransfers_ExcludesTransfersFromBalance()
{
    // Setup: Create accounts, transactions
    var userId = Guid.NewGuid();
    var account = AddAccount(userId, AccountType.Cash);
    
    // Add transactions
    await CreateIncomeTransaction(userId, $500);       // +$500
    await CreateExpenseTransaction(userId, $200);      // -$200
    await CreateTransferTransaction(userId, $150);     // +$0 (excluded)
    
    // Act
    var balance = await balanceService.GetUserBalanceAsync(userId);
    
    // Assert
    Assert.Equal(500, balance.TotalIncome);
    Assert.Equal(200, balance.TotalExpense);
    Assert.Equal(300, balance.Balance);  // 500 - 200, transfer excluded
}
```

---

## 9. Summary Table

| Concept | Calculation | Includes | Example |
|---------|-----------|----------|---------|
| **Account Balance** | InitialBalance + All Transactions | Income, Expense, Transfer | $1000 (initial) + $500 (income) - $200 (expense) - $300 (transfer out) = $1000 |
| **User Balance** | Income - Expense | Income, Expense ONLY | $500 (income) - $200 (expense) = $300 |
| **Credit Card Debt** | Max(0, -AccountBalance) | Expenses and payments | If balance = -$800, debt = $800 |
| **Transfer Impact** | Per-account only | Negative for source, positive for destination | A: -$300, B: +$300, User: $0 change |

---

## 10. Frontend Integration

When displaying balance information to users:

### Dashboard/Home View

```
Total Balance (User Position): $2,500
├─ Total Income: $5,000
├─ Total Expense: $2,500
└─ Monthly change: +$2,500

Accounts Overview:
├─ Checking: $1,800
├─ Savings: $500
├─ Credit Card: -$300 (owed)
└─ Cash Wallet: $500
```

### Account Detail View

```
Checking Account
├─ Initial Balance: $1,000
├─ Current Balance: $1,800
├─ Income this month: +$1,000
├─ Expenses this month: -$200
└─ Transfers: +$1,000 (from savings)
```

### Transaction History

```
Income:    +$1,000
Expense:   -$200
Transfer:  -$1,000 (to savings) — Neutral for user balance
```

---

## 11. Common Mistakes to Avoid

❌ **Mistake 1**: Including transfers in user balance
- Wrong: "User earned $5000, spent $2000, transferred $1000 = $2000 net"
- Correct: "User earned $5000, spent $2000 = $3000 net" (transfer is redistribution)

❌ **Mistake 2**: Confusing account balance with user balance
- Wrong: "My user balance is $5000" when they mean account balance
- Correct: "My user balance is $1000 (income-expense) and my accounts total $5000"

❌ **Mistake 3**: Treating credit card debt as expense twice
- Wrong: "I spent $500 on card + paid $200 = $700 total spend"
- Correct: "I spent $500 on card (one-time expense), payment is just redistribution"

❌ **Mistake 4**: Counting transfers when calculating financial health
- Wrong: "I earned $3000, spent $2000, transferred $500 = I'm $500 better off"
- Correct: "I earned $3000, spent $2000 = I'm $1000 better off" (transfer doesn't affect position)

---

**Last Updated**: 2026-05-21  
**Version**: 1.0
