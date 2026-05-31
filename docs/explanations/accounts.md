# Accounts — Change Log

## 2026-05-14 — Fix account validation regressions and unify InstitutionName

### Problem
Three critical bugs were introduced in recent modifications:

1. **EWallet provider never saved.** `HasCardOrCreditDetails` included an `InstitutionName` check, which caused `ValidateEWalletAccount` to reject any EWallet with a non-empty provider name. Additionally, the validation blocks inside `ValidateBankAccount` and `ValidateCreditCardAccount` incorrectly rejected `InstitutionName` (the bank/issuer name), making it impossible to create a bank account or credit card with an institution name.

2. **`PaymentDueDay` copy-paste bug.** `HasCardOrCreditDetails` had `StatementClosingDay.HasValue` duplicated instead of checking `PaymentDueDay.HasValue`. Same error appeared in `ValidateBankAccount`. This meant `PaymentDueDay` was never validated.

3. **`AccountResponse` missing fields.** `CardHolderName`, `StatementClosingDay`, and `PaymentDueDay` were not included in the response DTO, so the frontend never received them after a GET.

### Decision
Use `InstitutionName` as the single field for institution/provider name across all account types (Bank, CreditCard, EWallet). The `ProviderName` column on the entity is kept unused to avoid an unnecessary migration.

### Changes

**Backend (`AccountService.cs`)**
- Removed `InstitutionName` from `HasCardOrCreditDetails` — cash accounts block it with an explicit check in `ValidateCashAccount`.
- Removed the incorrect `InstitutionName` rejection blocks from `ValidateBankAccount` and `ValidateCreditCardAccount`.
- Fixed the `PaymentDueDay` copy-paste in `HasCardOrCreditDetails`.
- `CreateEWalletAccount` now sets `account.InstitutionName` (was incorrectly using `ProviderName`).

**Backend (`AccountDtos.cs`)**
- Added `CardHolderName`, `StatementClosingDay`, `PaymentDueDay` to `AccountResponse`.
- Removed unused `ProviderName` parameter from `CreateAccountRequest`.

**Backend (`ApplicationServiceTests.cs`)**
- Added 4 tests: bank with institution succeeds, credit card with institution succeeds, EWallet with provider as institution name succeeds, cash with institution name throws.
- Removed stale `ProviderName: null` from the `CreateCreditAccountRequest` helper.

**Frontend (`AccountForm.tsx`)**
- Added `institutionName` and `cardHolderName` input fields to the CreditCard section of the form (they were only present for BankAccount before).

**Frontend (`accountMappers.ts`)**
- Removed stale `Savings` entries from `BACKEND_TYPE_MAP` and `FRONTEND_TYPE_MAP` (the Savings type was removed in a prior commit).



## 2026-05-30 — Restore InitialBalance

**Change:** Restored InitialBalance field to Account entity.

**Reason:** Removed in migration 20260522041029 but needed to represent
historical balance before the user started using the app. Without it,
all accounts start at zero even if the user had existing money.

**Approach:** Field added directly to Account entity (not as a Transaction)
to avoid contaminating income/expense reports with opening balance entries.

**Affected files:**
- Monetria.Domain/Entities/Account.cs — added InitialBalance
- Monetria.Application/Accounts/AccountDtos.cs — added to responses
- Monetria.Application/Accounts/AccountService.cs — removed opening Transaction, assign to entity
- Monetria.Application/Accounts/BalanceService.cs — balance = InitialBalance + delta
- Migration: RestoreInitialBalance
