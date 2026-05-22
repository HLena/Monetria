# Accounts Module

## Goal

Allow users to manage financial accounts used to register transactions.

Supported account types:

- Cash
- BankAccount
- CreditCard
- Wallet

---

## Entity

### Account

Fields:

Required:
- id
- userId
- name
- type
- currencyCode
- colorCode
- isActive
- createdAt
- updatedAt

Optional:

Institution metadata:
- institutionName
- cardLast4Digits

Credit card only:
- creditLimit
- cardHolderName
- statementClosingDay
- paymentDueDay

---

## Business Rules

### Ownership

- Account belongs to authenticated user.
- Users can only access their own accounts.

---

### Balance Rules

- Account balance is derived from transactions.
- InitialBalance and ProviderName is removed.
- Balance must never be manually edited.
- Creating transactions updates effective balance.

Example:

Balance =
sum(incomes)
- sum(expenses)
+ transfers

---

### Account Type Rules

#### Credit Card

Requires:
- creditLimit

Optional:
- cardHolderName
- statementClosingDay
- paymentDueDay

Cannot:
- behave like cash account.

---

#### Wallet

Examples:
- Yape
- Plin
- PayPal

---

### Currency Rules

- CurrencyCode required.
- Default = PEN.
- Must support future multi-currency.

Examples:
- PEN
- USD
- EUR

---

### Validation Rules

name:
- required
- min length = 2
- max length = 100

currencyCode:
- required
- ISO currency code

colorCode:
- required
- valid hex color

creditLimit:
- must be positive

statementClosingDay:
- range 1–31

paymentDueDay:
- range 1–31

---

## Endpoints

POST /accounts
GET /accounts
GET /accounts/{id}
PUT /accounts/{id}
DELETE /accounts/{id}

---

## Request DTOs

### CreateAccountRequest

Required:
- name
- type

Optional:
- currencyCode
- colorCode
- institutionName
- cardLast4Digits
- creditLimit
- cardHolderName
- statementClosingDay
- paymentDueDay
- providerName

---

### UpdateAccountRequest

Can update:
- name
- colorCode
- institutionName
- cardLast4Digits
- providerName
- creditLimit
- statementClosingDay
- paymentDueDay
- isActive

Cannot update:
- userId
- createdAt

---

## Business Flow

Create Account
↓
Validate request
↓
Validate account type requirements
↓
Persist account
↓
Return created account
↓
Si se envia saldo inicial > 0 desde el frontend, despues de crear la cuenta crear un transaccion inicial con este monto con la descripcion con la description de initial Balance


---

## Edge Cases

- duplicate account name
- invalid currency code
- invalid credit card dates
- negative credit limit
- account with transactions cannot hard delete

---

## Delete Rules

- No hard delete.
- Soft deactivate using IsActive.
- Historical transactions must remain intact.

---

## Tests Required

Create:
- create bank account
- create credit card account
- create wallet account

Validation:
- invalid currency
- invalid color
- invalid statement day
- negative credit limit

Authorization:
- user cannot access another account

Business:
- no manual balance mutation
- balance derived from transactions