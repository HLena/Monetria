# Monetria Architecture

## Overview

Monetria follows Clean Architecture.

Layers:

API
↓
Application
↓
Domain
↑
Infrastructure

---

## Responsibilities

### Monetria.API
Responsibilities:
- endpoints
- authentication middleware
- request/response mapping

Must NOT:
- contain business logic

---

### Monetria.Application
Responsibilities:
- use cases
- commands
- queries
- validators
- orchestration

Examples:
- CreateTransaction
- RegisterUser
- UpdateBudget

---

### Monetria.Domain
Responsibilities:
- entities
- enums
- business invariants

Examples:
- Transaction
- Account
- Budget

Must remain framework independent.

---

### Monetria.Infrastructure
Responsibilities:
- database access
- auth provider
- persistence
- repositories

Examples:
- EF Core
- JWT services

---

## Feature Organization

Every feature should contain:

- Commands
- Queries
- DTOs
- Validators
- Handlers

Example:

Transactions/
├── Commands/
├── Queries/
├── DTOs/
└── Validators/