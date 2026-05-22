# Transactions Module

## Goal

Allow users to manage financial transactions.

Types:
- Expense
- Income
- Transfer

---

## Endpoints

POST /transactions
GET /transactions
GET /transactions/{id}
PUT /transactions/{id}
DELETE /transactions/{id}

---

## Rules

- amount must always be positve
- never store negative values
- decimal only
- belongs to authenticated user
- the financial impact is determined by transactionType
- this fields can be edited (Amount,CategoryId,TransactionDate,Description,AccountId)
- consider soft delete for transactions

---

## Request DTO

CreateTransactionRequest

Fields:
- amount
- categoryId
- accountId
- description
- type
- transferAccountId: Account where a transaccion arrive
- createdAt: fecha en la que registro la transaccion (default)
- date: fecha en la que se realizo la transaccion (required)

---

## Validation Rules

userId and createdAt
- inmutable

amount:
- required
- positive

description:
- max 500 chars

categoryId:
- required for expenses

type 
- (expense, income, transfer)
- inmutable

transferAccountId
- Account where a transaccion arrives
- required when type is transfer

---

## Business Flow

Create Transaction
↓
Validate request
↓
Validate account ownership
↓
Save transaction
↓
Recalculate balance
↓
Return response

---

## Edge Cases

- invalid category
- deleted account
- duplicated request
- future date

---

## Tests Required

- create expense
- create income
- invalid amount
- unauthorized user
- invalid category

# Fronted

- Add in the transaction form a new type "transfer"

# Backend

- Actualiza la entidad de transaction en el backend y considera los siguientes campos:
    - fromAccountId
    - type
    - categoryId
    - amount
    - description
    - toAccountId
    - createdAt
    - date
    - isActive: false means deleted transaccion and true that it is not deleted
- Categorias: agrega dos nuevos campos en la tabla uno para el color y otro llamado keyIcon para el nombre del icon
    - Agrega estos colores:
        Alimentación: '#f59e0b',
        Transporte: '#3b82f6',
        Entretenimiento: '#8b5cf6',
        Salud: '#10b981',
        Educación: '#06b6d4',
        Servicios: '#6366f1',
        Tecnología: '#ec4899',
        Ropa: '#f97316',
        Hogar: '#84cc16',
        Viajes: '#14b8a6',
        Restaurantes: '#ef4444',
        Otros: '#94a3b8',
        Salario: '#10b981',
        Freelance: '#6366f1',
        Inversiones: '#f59e0b',
        Ventas: '#3b82f6',
        Bonos: '#8b5cf6',

# Frontend

Implementa los metodos necesarios en Finance store para poder hacer uso de los endpoints del backend, pero primero idea un plan de todo lo que se va a realizar y de todo lo necesario que se necesita crear para poder manejar los datos como interfaces, etc. Prioriza mantener una aquitectura limpia.

- separa el componente TransaccionForm a un componente aparte
- crea componentes reutilizables en una carpeta ui para compartirse en otras paginas o modulos:
    - componente para cada div dentro de la seccion Summary
    - componente para los select e inputs dentro del filtro
    - componente para cada transaccion que se muestra dentro del map
- usa la funcion addTransaction que permita crear transacciones llamando a la API
- las categorias que se muestran en el formulari para crear uns nueva transaccion se deben obtener del backend, lo que aun nose es como enlazarlo con el icono, genera una propuesta.
- las cuentas que se muestran en el formulario para crear una transaccion, aveces se muestra y otras no, eso indica que no se espera la obtencion de estos satos cuando si deberia ser asi

