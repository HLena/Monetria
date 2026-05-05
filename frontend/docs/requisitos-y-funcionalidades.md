# Monetria — Requisitos y funcionalidades

Documento de producto alineado con la implementación actual de la aplicación (React, TypeScript, persistencia en `localStorage`).

---

## 1. Objetivo y alcance

**Objetivo:** aplicación web de finanzas personales para registrar y visualizar ingresos, gastos, presupuestos, ahorros y deudas, con gestión de múltiples cuentas (incluido crédito) y análisis con gráficos.

**Alcance actual:** SPA sin backend propio; el estado se persiste en el navegador vía `localStorage`. No hay autenticación ni sincronización multi-dispositivo en la implementación vigente.

---

## 2. Requisitos no funcionales

| Área | Requisito |
|------|------------|
| Plataforma | Cliente web (React 18, Vite) |
| Persistencia | `localStorage` (claves `fin_accounts`, `fin_transactions`, `fin_budgets`, `fin_fixed_expenses`, `fin_savings`, `fin_debts`) |
| Moneda y formato | Principalmente MXN; `Intl.NumberFormat` con locale `es-MX` |
| Interfaz | Tailwind CSS v4; modales; tema claro/oscuro (`next-themes`) |
| Navegación | `createBrowserRouter`, layout anidado, página 404 |

---

## 3. Modelo de dominio (resumen)

- **Cuenta:** `credit` \| `debit` \| `cash`; `balance`, `currency`, `color`, `createdAt`; opcionales: `cardNumber` (últimos dígitos), `cardHolder`, `expiryDate` (MM/AA), `bank`, `creditLimit`, `billingDate` / `paymentDate` (día 1–31) para crédito.
- **Transacción:** `accountId`, `income` \| `expense`, categoría, monto positivo, `date`, descripción.
- **Presupuesto:** categoría de gasto, límite, periodo `monthly` \| `weekly`.
- **Gasto fijo:** nombre, monto, categoría, `accountId`, periodo `monthly` \| `weekly` \| `yearly`, `dueDay` opcional, `isActive`, notas.
- **Meta de ahorro:** nombre, `targetAmount`, `currentAmount`, `targetDate`, categoría, color, descripción opcional.
- **Deuda:** nombre, acreedor, monto original y restante, tasa anual %, pago mínimo, próximo pago, tipo (préstamo, TDC, hipoteca, auto, otro), color.

Categorías de **gastos** e **ingresos** están predefinidas en el código; existe un mapa de colores por categoría.

---

## 4. Mapa de rutas

| Ruta | Pantalla |
|------|----------|
| `/` | Dashboard |
| `/accounts` | Cuentas |
| `/accounts/:id` | Detalle de cuenta |
| `/transactions` | Transacciones |
| `/fixed-expenses` | Gastos fijos |
| `/budgets` | Presupuestos |
| `/savings` | Ahorros y metas |
| `/debts` | Deudas y planificación |
| `/reports` | Reportes |
| `*` | 404 – página no encontrada |

---

## 5. Requisitos funcionales por módulo

### 5.1 Gestión de cuentas

- Alta, edición y baja de cuentas a través del contexto global.
- Tipos: tarjeta de crédito, débito y efectivo.
- Visualización con el componente `CreditCardVisual` (listado, dashboard, detalle).
- Detalle de cuenta: totales de ingresos y gastos vinculados, historial de movimientos, desglose de gastos por categoría, gráfico de evolución (ingresos vs gastos) en una ventana de meses; para crédito: límite, saldo, crédito disponible y porcentaje de uso.
- Datos de tarjeta: almacenamiento modelado con **últimos cuatro dígitos** (no el PAN completo), titular, fecha de vencimiento, banco; fechas de facturación y pago en cuentas de crédito.
- Cálculo de consumo/totales a partir de transacciones asociadas a la cuenta.

### 5.2 Transacciones

- Registro de ingresos y de gastos con vínculo obligatorio a una cuenta, categoría, monto, fecha y descripción.
- El “método de pago” se identifica por la **cuenta** usada.
- Categorías distintas para ingresos y para gastos.
- Listado y análisis filtrables por lógica de fechas y cuentas según la pantalla.

### 5.3 Gastos fijos

- Registro de pagos recurrentes (nombre, monto, categoría, cuenta, periodicidad mensual/semanal/anual, día de cargo opcional, notas, activo/inactivo).
- Cálculo de **equivalente mensual** para unificar importes con distinta periodicidad.
- Diferente de “transacción puntual”: sirve al planeamiento, no reemplaza el historial de movimientos reales en la pantalla de transacciones (salvo que se registren allí de forma explícita).

### 5.4 Presupuestos y control

- Presupuestos por **categoría de gasto** con límite y periodo (mensual o semanal en el dato; el seguimiento del gasto asociado usa el mes calendario actual y la misma categoría de las transacciones de gasto).
- Indicadores: gasto acumulado, remanente, porcentaje del límite.
- Estados: normal, **advertencia** (por encima del 80% del límite sin excederlo), **excedido** (por encima del 100%).
- Resumen: presupuesto total, total gastado en el mes, número de categorías excedidas.

### 5.5 Ahorros y metas

- Metas con nombre, monto objetivo, monto ahorrado, fecha límite, categoría, color, descripción opcional.
- Capacidad de añadir dinero a una meta respetando el tope al objetivo.
- **Calculadora de ahorro (modo 1):** dados meta, ahorro actual y plazo en meses, indica el **ahorro mensual** necesario.
- **Calculadora de ahorro (modo 2):** dados meta, ahorro actual y aportación mensual, indica el **número de meses** estimados para alcanzar el faltante.

### 5.6 Planificación de deudas

- Registro y edición de deudas con monto original, saldo restante, tasa anual, pago mínimo, próxima fecha de pago, tipo y acreedor.
- Vistas de resumen: deuda total, monto pagado, suma de pagos mínimos, progreso global.
- Gráficos comparando capital pagado vs restante.
- **Calculadora de deuda:** saldo, tasa, pago mensual → meses para liquidar (hasta 600 iteraciones de seguridad), intereses totales estimados, total a pagar; pago mínimo recomendado y validación de pago insuficiente frente a intereses.
- Contenido educativo sobre **estrategias** (método avalancha, bola de nieve, consolidación) como guía, sin automatizar la priorización de pagos.

### 5.7 Reportes y analítica

- Selección de año; serie mensual de ingresos, gastos y balance.
- Indicadores del mes actual con variación porcentual frente al mes anterior.
- Distribución de gastos por categoría (año seleccionado).
- Gráficos con Recharts (área, barras, pie, etc. según vista).

### 5.8 Dashboard

- Resumen de la situación global (cuentas, métricas y accesos rápidos) coherente con el contexto de datos; uso de `CreditCardVisual` donde aplica.

---

## 6. Stack tecnológico (referencia)

- React 18, TypeScript, Vite
- React Router 7 (`createBrowserRouter`, `RouterProvider`, rutas anidadas)
- Recharts
- Lucide React (iconografía principal)
- Tailwind CSS 4
- `next-themes` para tema claro/oscuro
- `localStorage` para persistencia; estado global vía `FinanceContext` / `useFinance`

Otras dependencias (Radix, MUI, etc.) pueden existir en el proyecto; las listadas arriba son las que sustentan directamente las funcionalidades descritas en este documento.

---

## 7. Limitaciones y notas de producto

- **Seguridad de tarjetas:** se documenta y modela con últimos dígitos; no sustituye cumplimiento PCI en escenarios bancarios reales.
- **Presupuestos con periodo semanal:** el campo existe en el modelo; validar con negocio si el cálculo de “gastado” debe alinearse a semanas naturales en una iteración futura.
- **Backup y portabilidad:** no hay exportación/importación de datos en la base actual; requisito adicional para roadmap.
- **Multi-usuario o multi-dispositivo:** requeriría backend o servicio de sincronización; fuera del alcance actual.

---

*Última actualización: documento generado para acompañar el código de Monetria.*
