# Backend Rules

Architecture:

Monetria.API
= endpoints only

Monetria.Application
= use cases, handlers, business logic

Monetria.Domain
= entities and business rules

Monetria.Infrastructure
= database, repositories, auth, external services

Rules:
- API must stay thin
- Business logic belongs in Application
- Domain must stay pure
- Infrastructure cannot contain business logic

Feature organization:
Each feature has:
- Commands
- Queries
- Validators
- DTOs
- Handlers

Testing:
All business logic changes require tests.