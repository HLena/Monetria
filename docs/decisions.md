# Technical Decisions

## 2026-05-14

Decision:
Use Clean Architecture.

Reason:
Clear separation of concerns.

Tradeoff:
More boilerplate.

---

## 2026-05-16

Decision:
Use decimal for money.

Reason:
Prevent precision issues.

Rejected:
float
double

---

## 2026-05-18

Decision:
Backend-first development.

Reason:
Frontend was blocked by API instability.

---

## 2026-05-20

Decision:
Transactions immutable.

Reason:
Financial auditability.

Tradeoff:
Requires reversal entries.