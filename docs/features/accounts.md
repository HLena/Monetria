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

Fields

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

Removed:
- initialBalance
- providerName

---

## Business Rules

### Ownership

- Account belongs to authenticated user.
- Users can only access their own accounts.

---

### Balance Rules

- Account balance is derived from transactions.
- `InitialBalance` does not exist in Account entity.
- Balance must never be manually edited.
- Creating transactions updates effective balance.

### Initial Funding

1. Create account
2. Remove initial balance from AccountForm

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
- behave like cash account

Rules:
- statementClosingDay range: 1–31
- paymentDueDay range: 1–31
- creditLimit must be positive

---

#### Wallet

Examples:
- Yape
- Plin
- PayPal

Rules:
- behaves like cash account
- no providerName stored

---

### Currency Rules

- CurrencyCode required.
- Default = PEN.
- Must support future multi-currency.

Supported examples:
- PEN
- USD
- EUR

Rules:
- must use ISO currency code

---

### Validation Rules

#### name
- required
- min length = 2
- max length = 100

#### currencyCode
- required
- valid ISO currency code

#### colorCode
- required
- valid HEX color

Example:
- #000000
- #3B82F6

#### creditLimit
- must be positive

#### statementClosingDay
- range: 1–31

#### paymentDueDay
- range: 1–31

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

Rules:
- `initialBalance` is NOT stored in Account entity

---

### UpdateAccountRequest

Can update:
- name
- colorCode
- institutionName
- cardLast4Digits
- creditLimit
- cardHolderName
- statementClosingDay
- paymentDueDay
- isActive
- currencyCode

Cannot update:
- userId
- createdAt
- balance

Rules:
- changing account type should be restricted
- no manual balance mutation

---
## Accounts Page

Route:
`/accounts`

Goal

Display the accounts list by userId and calculated balance 

### Data Required

Account:
- id
- name
- institutionName
- colorCode
- currencyCode
- type
- if type is credit card return credit limit

Calculated balance:
- derived from transactions

## Account Details Page

Route:
`/accounts/:accountId`

Goal:

Display detailed account information,
calculated balance and related transactions.

### Data Required

Account:
- id
- name
- type
- currencyCode
- colorCode
- institutionName
- cardLast4Digits

if it's credit card return:
- creditLimit
- cardHolderName
- statementClosingDay
- paymentDueDay

Calculated balance:
- derived from transactions

Transactions:
- account transactions only
- newest first

---

### UI Sections

#### Header

Use reusable `HeaderPage`.

Show:
- account name
- account type
- institution name (if exists)

Actions:
- Edit account
- Add transaction

---

#### Balance Card

Show:
- current balance
- currency

Credit card accounts:

Show:
- credit limit
- available credit

---

#### Account Metadata

Show only when available:
- institution name
- last 4 digits
- statement closing day
- payment due day

---

#### Transactions Section

Show:
- related transactions
- newest first

Transaction item:
- category
- amount
- date
- type

Future support:
- pagination
- filters

Empty state:
- no transactions found

---

### Loading States

Must include:
- loading skeleton
- error state
- empty state

No blank screens allowed.

---

## Business Flow

### Create Account

Create Account
↓
Validate request
↓
Validate account type requirements
↓
Persist account
↓
Return created account

---

### Get Account Details

Validate ownership
↓
Get account
↓
Calculate balance from transactions
↓
Get account transactions
↓
Return account details

---

### Hooks

Usa hooks para simplificar mejor el flujo de datos
- useAccounts: obtener listado de cuentas y crear cuenta. 
- useAccount: obtener detalle de una cuenta, actualizacion y eliminacion

## Edge Cases

- duplicate account name
- invalid currency code
- invalid credit card dates
- negative credit limit
- account not found
- unauthorized account access
- inactive account
- account with no transactions
- initialBalance < 0

---

## Delete Rules

- No hard delete.
- Use `IsActive = false`.
- Historical transactions must remain intact.
- Account history must stay accessible.

---

## Tests Required

### Create

- create bank account
- create credit card account
- create wallet account

### Validation

- invalid currency
- invalid color
- invalid statement day
- invalid payment due day
- negative credit limit
- negative initial balance

### Authorization

- user cannot access another account

### Business

- no manual balance mutation
- balance derived from transactions
- soft delete only