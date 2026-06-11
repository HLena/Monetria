# Backend — Estado del Proyecto

**Última actualización:** 2026-06-11

Documento de referencia del estado actual del backend de Monetria. Cubre lo que ya está implementado, lo que está pendiente, y mejoras identificadas.

---

## Resumen ejecutivo

| Categoría | Estado |
|---|---|
| Dominios implementados | 10 de 10 |
| Endpoints disponibles | 45 |
| Servicios | 11 de 11 |
| Repositorios | 9 de 9 |
| Migraciones aplicadas | 15 |
| Autenticación | JWT + BCrypt |
| Tests | 57 (6 nuevos de SavingsPocket) |

**Completud general: ~98%** — SavingsPocket completado. Pendiente: RecurringOccurrence endpoints, background service para Recurrings, paginación en listas.

---

## Lo que está implementado

### Auth

**Archivo:** `Monetria.API/Endpoints/AuthEndpoints.cs`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registra un usuario nuevo |
| `POST` | `/auth/login` | Devuelve JWT si las credenciales son válidas |

- Hash de contraseñas con BCrypt
- Token JWT firmado con clave secreta, configurable vía `appsettings`
- Validación de email único en registro
- El token incluye `userId` y `email` como claims

---

### Accounts

**Archivo:** `Monetria.API/Endpoints/AccountEndpoints.cs`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/accounts` | Crea una cuenta nueva |
| `GET` | `/accounts` | Lista todas las cuentas del usuario |
| `GET` | `/accounts/{id}` | Obtiene una cuenta por ID |
| `PUT` | `/accounts/{id}` | Actualiza nombre, color, tipo, etc. |
| `DELETE` | `/accounts/{id}` | Soft delete (`IsActive = false`) |
| `GET` | `/accounts/balance/summary` | Saldo total consolidado de todas las cuentas |

- Soporta los 4 tipos: `Cash`, `BankAccount`, `CreditCard`, `EWallet`
- Saldo calculado en tiempo real (`InitialBalance + SUM(Income) - SUM(Expense)`) — nunca almacenado
- Campos opcionales para tarjetas: `CreditLimit`, `CardLast4Digits`, `StatementClosingDay`, `PaymentDueDay`
- Ownership check: solo el dueño puede ver/modificar/borrar
- Soft delete universal

---

### Transactions

**Archivo:** `Monetria.API/Endpoints/TransactionEndpoints.cs`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/transactions` | Crea una transacción (Income, Expense o Transfer) |
| `GET` | `/transactions` | Lista con filtros y paginación por offset |
| `GET` | `/transactions/{id}` | Obtiene transacción por ID |
| `PUT` | `/transactions/{id}` | Actualiza monto, descripción, fecha, categoría |
| `DELETE` | `/transactions/{id}` | Soft delete |
| `GET` | `/accounts/{accountId}/transactions` | Transacciones de una cuenta específica |

- Transferencias = 2 filas atómicas vinculadas por `TransferPairId`
- Montos siempre positivos — el `Type` define la dirección
- Paginación por offset: `?page=1&pageSize=20`
- Filtros disponibles: `accountId`, `categoryId`, `type`, `startDate`, `endDate`
- Transferencias no afectan presupuestos ni reportes
- `PagedResponse<T>` devuelve `Items`, `TotalCount`, `Page`, `PageSize`

---

### Categories

**Archivo:** `Monetria.API/Endpoints/CategoryEndpoints.cs`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/categories` | Crea una categoría personalizada |
| `PATCH` | `/categories/{id}` | Actualiza nombre, color, ícono |
| `PATCH` | `/categories/{id}/deactivate` | Desactiva categoría (soft delete) |
| `GET` | `/categories` | Lista categorías del sistema + las del usuario |

- Categorías del sistema (`UserId = null`) no se pueden eliminar ni modificar
- `KeyIcon` referencia nombres de íconos Lucide
- Tipo puede ser `Income` o `Expense`
- La lista devuelve sistema + propias juntas, ordenadas

---

### Budgets

**Archivo:** `Monetria.API/Endpoints/BudgetEndpoints.cs`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/budgets` | Crea un presupuesto mensual para una categoría |
| `GET` | `/budgets` | Lista presupuestos (opcionalmente filtrando por mes/año) |
| `PUT` | `/budgets/{id}` | Actualiza el límite o rollover |
| `DELETE` | `/budgets/{id}` | Elimina el presupuesto |

- `SpentAmount` es calculado: `SUM(Transactions WHERE CategoryId + Month + Year + Expense + IsActive)`
- Restricción única: `(UserId, CategoryId, Month, Year)` — un presupuesto por categoría por mes
- No bloquea gastos, solo informa
- `RolloverUnused`: si el remanente del mes anterior se suma al nuevo límite

---

### Recurrings

**Archivo:** `Monetria.API/Endpoints/RecurringEndpoints.cs`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/recurrings` | Crea un gasto/ingreso recurrente |
| `GET` | `/recurrings` | Lista todos los recurrentes del usuario |
| `PUT` | `/recurrings/{id}` | Actualiza monto, frecuencia, etc. |
| `PATCH` | `/recurrings/{id}/deactivate` | Desactiva el recurrente |

- Soporta `AmountType`: `Fixed` (automático), `Estimated` (confirmar), `VariableFree` (ingresar)
- Frecuencias: `Daily`, `Weekly`, `Biweekly`, `Monthly`, `Yearly`
- `Fixed` → crea Transaction automáticamente al llegar `NextDueDate`
- `Estimated`/`VariableFree` → crea `RecurringOccurrence(Pending)` para que el usuario confirme
- Entidad `RecurringOccurrence` existe en dominio y se crea, pero **no tiene endpoints propios** (ver Pendientes)

---

### SavingsGoals

**Archivo:** `Monetria.API/Endpoints/SavingsGoalEndpoints.cs`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/savings-goals` | Crea una meta de ahorro |
| `GET` | `/savings-goals` | Lista metas activas del usuario |
| `PUT` | `/savings-goals/{id}` | Actualiza nombre, monto objetivo, fecha |
| `DELETE` | `/savings-goals/{id}` | Soft delete |

- `TargetAmount > 0` requerido
- `IsCompleted` se actualiza automáticamente cuando `CurrentAmount >= TargetAmount`
- `LinkedAccountId` presente → `CurrentAmount` = saldo calculado de esa cuenta
- `TargetDate` es `DateOnly?`
- `CategoryId` es FK real a `Category`

---

### Debts

**Archivo:** `Monetria.API/Endpoints/DebtEndpoints.cs`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/debts` | Registra una deuda |
| `GET` | `/debts` | Lista deudas del usuario |
| `PUT` | `/debts/{id}` | Actualiza datos de la deuda |
| `DELETE` | `/debts/{id}` | Soft delete |
| `POST` | `/debts/{id}/pay` | Registra un pago parcial o total |

- Pago = `Transaction(Expense)` + reducir `RemainingAmount`, en la misma `UnitOfWork`
- `IsActive = false` automático cuando `RemainingAmount <= 0`
- `InterestRate` en `decimal(9,4)`

---

### SavingsPockets

**Archivo:** `Monetria.API/Endpoints/SavingsPocketEndpoints.cs`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/savings-pockets` | Crea una alcancía (`CurrentAmount = 0` siempre) |
| `GET` | `/savings-pockets` | Lista alcancías activas del usuario |
| `PUT` | `/savings-pockets/{id}` | Actualiza nombre, color, descripción |
| `DELETE` | `/savings-pockets/{id}` | Soft delete |
| `POST` | `/savings-pockets/{id}/adjust` | Deposita (`Amount > 0`) o retira (`Amount < 0`) |

- `CurrentAmount` siempre empieza en 0 — ignorado en el request de creación
- Retiro rechazado si resultaría en saldo negativo → `ArgumentException`
- `Amount == 0` rechazado → `ArgumentException`
- `UpdatedAt` actualizado en create, update y adjust
- `LinkedAccountId` usa `OnDelete(SetNull)` — si se borra la cuenta el pocket queda desvinculado
- Migración: `20260611005136_AddSavingsPockets`

---

### Dashboard

**Archivo:** `Monetria.API/Endpoints/DashboardEndpoints.cs`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/dashboard` | Resumen financiero del mes actual |

Devuelve en una sola llamada:
- Saldo total de todas las cuentas
- Ingresos y gastos del mes actual
- Lista de cuentas con saldo individual
- Presupuestos del mes con `SpentAmount` vs `LimitAmount`
- Próximos recurrentes (los próximos 7 días)

---

### Infraestructura y corte transversal

- **Clean Architecture**: `Domain` → `Application` → `Infrastructure` → `API`
- **UnitOfWork**: todas las operaciones multi-paso son atómicas
- **Soft delete**: ninguna entidad financiera se borra físicamente
- **DTOs como `sealed record`**: inmutables, sin herencia
- **Ownership check**: todos los servicios validan que `UserId` coincide antes de operar
- **Migraciones EF Core**: 14 aplicadas, esquema al día
- **Swagger**: disponible en desarrollo en `/swagger`
- **`decimal(18,2)`** para montos, **`decimal(9,4)`** para tasas, **`Guid`** para IDs, **`DateTime UTC`** para timestamps

---

## Lo que está pendiente

### 1. SavingsPocket — dominio completo faltante

**Prioridad: Alta**

Está definido en `CLAUDE.md` y en `docs/project-structure.md` como entidad separada de `SavingsGoal`, pero no existe en el código.

Diferencia clave: `SavingsPocket` no tiene objetivo ni fecha límite. Es una alcancía libre donde el usuario deposita y retira sin restricción, siempre que el saldo no sea negativo.

**Qué falta crear:**

| Capa | Qué crear |
|---|---|
| Domain | Entidad `SavingsPocket` |
| Infrastructure | Migración + `SavingsPocketRepository` |
| Application | `ISavingsPocketRepository`, `ISavingsPocketService`, `SavingsPocketService`, `SavingsPocketDtos` |
| API | `SavingsPocketEndpoints` con 5 endpoints |

**Endpoints requeridos:**

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/savings-pockets` | Crea una alcancía |
| `GET` | `/savings-pockets` | Lista alcancías del usuario |
| `PUT` | `/savings-pockets/{id}` | Actualiza nombre, color, descripción |
| `DELETE` | `/savings-pockets/{id}` | Soft delete |
| `POST` | `/savings-pockets/{id}/adjust` | Deposita (`Amount > 0`) o retira (`Amount < 0`) |

**Reglas del `POST /adjust`:**
- `Amount > 0` = depósito
- `Amount < 0` = retiro
- Validar que `CurrentAmount + Amount >= 0` antes de aplicar
- Actualizar `UpdatedAt` al ajustar

---

### 2. RecurringOccurrence — gestión sin endpoints

**Prioridad: Media**

La entidad `RecurringOccurrence` existe y se crea automáticamente cuando un `Recurring` de tipo `Estimated` o `VariableFree` llega a su `NextDueDate`. Sin embargo, el usuario no tiene forma de gestionar estas ocurrencias desde la API.

**Qué falta:**

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/recurrings/{id}/occurrences` | Lista ocurrencias de un recurrente |
| `PATCH` | `/recurrings/occurrences/{id}/confirm` | Confirma con monto real → crea Transaction |
| `PATCH` | `/recurrings/occurrences/{id}/skip` | Marca como omitida (no contamina promedios) |

**Notas:**
- `Skipped` ≠ `Amount = 0` — las ocurrencias omitidas no se usan en cálculos de promedio
- Al confirmar, se crea una `Transaction` y se vincula en `TransactionId`
- Puede necesitar un `IRecurringOccurrenceRepository` separado

---

### 3. Paginación en endpoints de lista

**Prioridad: Media**

Solo `GET /transactions` tiene paginación por offset (`PagedResponse<T>`). El resto de los endpoints devuelven listas completas, lo que puede ser un problema a medida que crezcan los datos.

**Endpoints que deberían paginarse:**

| Endpoint | Volumen esperado |
|---|---|
| `GET /budgets` | Bajo (12 meses × N categorías) |
| `GET /recurrings` | Medio |
| `GET /debts` | Bajo |
| `GET /savings-goals` | Bajo |
| `GET /savings-pockets` | Bajo |
| `GET /accounts` | Bajo |

Para los de volumen bajo puede ser suficiente con un parámetro `?isActive=true/false` para filtrar activos vs inactivos, sin paginación completa.

---

### 4. Tests — sin cobertura

**Prioridad: Alta**

El proyecto no tiene ningún test escrito. `Monetria.Tests` existe como proyecto pero está vacío.

**Qué testear primero (por impacto):**

| Test | Razón |
|---|---|
| Cálculo de saldo de cuenta | Lógica crítica, nunca almacenada |
| Pago de deuda (atomicidad) | Dos operaciones en una `UnitOfWork` |
| `POST /adjust` en SavingsPocket | Validación de no-negatividad |
| Transferencias (par atómico) | Dos filas vinculadas |
| `SpentAmount` en Budget | Calculado, no almacenado |

**Stack sugerido:** xUnit + Moq para unit tests de servicios. Para integración, TestContainers con PostgreSQL real (evita divergencias mock/prod).

---

### 5. Procesamiento automático de Recurrings

**Prioridad: Media**

El campo `NextDueDate` existe en `Recurring` y la lógica de qué hacer según `AmountType` está definida, pero no hay ningún mecanismo que ejecute esa lógica periódicamente.

**Qué falta:**
- Un `IHostedService` (background service de .NET) que al arrancar (o por Hangfire/cron) consulte todos los `Recurring` activos con `NextDueDate <= hoy` y:
  - Para `Fixed`: crea `Transaction` automáticamente y avanza `NextDueDate`
  - Para `Estimated`/`VariableFree`: crea `RecurringOccurrence(Pending)` y avanza `NextDueDate`

Sin esto, los recurrentes no se "disparan" nunca automáticamente.

---

## Mejoras identificadas

### A. Dashboard — consultas N+1

**Archivo:** `Monetria.Application/Dashboard/DashboardService.cs`

El servicio itera sobre cada cuenta para calcular su saldo individualmente. Con 10 cuentas hace 10 queries separadas. Solución: query SQL que agrupe transacciones por cuenta y devuelva los deltas en una sola llamada, similar a `GetAccountBalanceDeltaAsync` pero para todas las cuentas del usuario en batch.

---

### B. `UpdateAsync` faltante en interfaces de repositorios

Algunos repositorios (ej. `IDebtRepository`, `IRecurringRepository`) no declaran explícitamente un método `UpdateAsync`. Las actualizaciones funcionan porque EF Core trackea los cambios en memoria y `UnitOfWork.SaveChangesAsync()` los persiste, pero esto rompe el contrato explícito de la interfaz. Si se cambia a un repositorio que no use EF Core (p.ej. Dapper), el código se rompería silenciosamente.

**Fix sugerido:** agregar `Task UpdateAsync(TEntity entity, CancellationToken ct = default)` en las interfaces que lo omiten.

---

### C. Sin caché para queries costosas

El endpoint `GET /dashboard` es el más pesado del sistema. Con muchos usuarios concurrentes puede ser un cuello de botella. Mejora futura: caché en memoria (`IMemoryCache`) con TTL corto (1-2 min) por `userId`.

---

### D. Manejo de errores inconsistente

Algunos servicios lanzan `NotFoundException` (definida en `Application/Common/`), pero otros lanzan `InvalidOperationException` directamente. Debería haber un conjunto consistente de excepciones de dominio (`NotFoundException`, `ForbiddenException`, `ValidationException`) y un middleware global que las mapee a los códigos HTTP correctos (`404`, `403`, `400`).

Actualmente el mapeo se hace ad-hoc en cada endpoint.

---

### E. Seed de categorías acoplado a migraciones

Las categorías del sistema se seedean dentro de una migración de EF Core. Esto mezcla datos con esquema y hace difícil actualizar las categorías sin crear una nueva migración. Mejor práctica: mover el seed a un `IDbSeeder` que corra al arrancar la aplicación (como `DataSeeder.SeedAsync()`), separado del esquema.

---

### F. Sin validaciones de request en API layer

Los DTOs de request no tienen validaciones explícitas (p.ej. con `FluentValidation` o Data Annotations). La validación ocurre dentro del servicio con `if/throw`. Si se quiere devolver errores de validación estructurados (listas de campos con errores) para el frontend, hay que agregar validación en la capa API antes de llegar al servicio.

---

## Checklist rápido

```
Implementado
  [x] Auth (register + login + JWT)
  [x] Accounts (CRUD + balance calculado)
  [x] Transactions (CRUD + transferencias + paginación)
  [x] Categories (CRUD + sistema vs custom)
  [x] Budgets (CRUD + SpentAmount calculado)
  [x] Recurrings (CRUD + tipos AmountType)
  [x] SavingsGoals (CRUD + LinkedAccount)
  [x] Debts (CRUD + pay endpoint)
  [x] Dashboard (resumen mensual)
  [x] UnitOfWork + soft delete + ownership checks
  [x] 14 migraciones aplicadas

Pendiente
  [x] SavingsPocket (entidad + CRUD + /adjust)
  [ ] RecurringOccurrence endpoints (confirm + skip)
  [ ] Background service para procesar Recurrings automáticos
  [ ] Tests (unitarios e integración)
  [ ] Paginación en endpoints de lista restantes

Mejoras
  [ ] Fix N+1 en DashboardService
  [ ] UpdateAsync explícito en interfaces de repositorios
  [ ] Caché para /dashboard
  [ ] Excepciones de dominio consistentes + middleware global
  [ ] Separar seed de categorías de las migraciones
  [ ] Validaciones de request estructuradas (FluentValidation)
```
