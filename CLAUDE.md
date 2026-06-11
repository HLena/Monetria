# Project Rules

## Stack
- React
- TypeScript
- .NET 10 / C# 13
- PostgreSQL

## Coding Rules
- Use TypeScript strict mode
- No `any`
- Functional components only
- Reusable hooks
- Clean architecture

## Workflow
Before coding:
1. Explain approach
2. Create plan
3. Wait for approval

When implementing:
1. Backend first
2. Tests second
3. Frontend last

After implementing:
1. If I type commit, add commits for each new change in the project
2. After each modification, new implementation or fix an issue create or update a file in docs/explanations/. Name it after the feature (e.g. accounts.md, savings.md). If the file already exists, append a new dated section.

Never:
- Modify unrelated files
- Add dependencies unnecessarily
- Break existing APIs

---

## Domain Model — Quick Reference

### Entities and their key rules

**Account**
- Saldo = `InitialBalance + SUM(Income) - SUM(Expense)` — NUNCA almacenado como columna
- Soft delete: `IsActive = false`
- Tipos: Cash, BankAccount, CreditCard, EWallet

**Transaction**
- Monto SIEMPRE positivo — el tipo define la dirección
- Transferencia = 2 filas atómicas vinculadas por `TransferPairId`
- Soft delete: `IsActive = false`
- Transferencias NO afectan presupuestos ni reportes

**Category**
- `UserId = null` → categoría del sistema, no se puede eliminar
- FK real en Budget — nunca string

**Budget**
- `SpentAmount` calculado: `SUM(t.Amount WHERE CategoryId + Month/Year + Expense + IsActive)`
- Restricción única: `(UserId, CategoryId, Month, Year)`
- No bloquea gastos — solo alerta

**Recurring** (antes FixedExpense)
- AmountType: Fixed (auto), Estimated (confirmar), VariableFree (ingresar)
- Fixed → Transaction automática
- Estimated/VariableFree → RecurringOccurrence(Pending)
- Skipped ≠ Amount=0 — no contaminar promedios históricos

**SavingsGoal**
- Requiere `TargetAmount > 0`
- `IsCompleted = true` cuando `CurrentAmount >= TargetAmount`
- `LinkedAccountId` presente → `CurrentAmount` = saldo calculado de esa cuenta
- `TargetDate` es `DateOnly?`, no `DateTime`
- `CategoryId` es FK real a `Category`, no string
- Soft delete: `IsActive = false`

**SavingsPocket** ← NUEVA ENTIDAD (2026-06-04)
- Sin `TargetAmount`, sin `TargetDate`, sin `IsCompleted`, sin `CategoryId`
- `CurrentAmount` NUNCA negativo — validado en `AdjustAmountAsync`
- Endpoint de ajuste: `POST /savings-pockets/{id}/adjust`
  - `Amount > 0` = depósito
  - `Amount < 0` = retiro
- Soft delete: `IsActive = false`
- Ver: `docs/explanations/savings.md`

**Debt**
- Pago = `Transaction(Expense)` + reducir `RemainingAmount`, en la misma `UnitOfWork`
- `IsActive = false` cuando `RemainingAmount <= 0`

---

## Savings Module — Two Concepts, Two Entities

NO mezclar SavingsGoal con SavingsPocket. Son conceptos distintos:

| Pregunta | Usar |
|---|---|
| ¿El usuario tiene un monto objetivo? | `SavingsGoal` |
| ¿El usuario solo quiere apartar dinero sin meta? | `SavingsPocket` |

La página `/savings` (frontend) debe mostrar ambas secciones claramente separadas.
La calculadora de ahorro aplica SOLO a `SavingsGoal`.

---

## Global Financial Rules

- `decimal(18,2)` para todos los montos — nunca `float` o `double`
- `decimal(9,4)` para tasas de interés
- `Guid` para todos los IDs
- `DateTime UTC` para timestamps
- `DateOnly` para fechas de calendario
- Soft delete universal — nunca `DELETE` físico en datos financieros