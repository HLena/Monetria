# Web — React Frontend

## Stack
- React 18 + TypeScript (strict, no any)
- Vite
- Tailwind CSS v4
- Zustand (global state)
- React Hook Form (forms)
- Recharts (charts)
- Lucide React (icons)
- Radix UI (primitives)

## Structure

src/
├── app/
│   ├── pages/       ← one file per route
│   ├── components/  ← shared/ + feature components
│   ├── hooks/       ← data hooks (useAccounts, useTransactions...)
│   ├── store/       ← AuthStore, FinanceStore (Zustand)
│   ├── api/         ← HTTP fetch functions
│   ├── mappers/     ← DTO → UI model
│   └── types/       ← api/ (DTOs), models/ (UI)
└── lib/
├── apiClient.ts      ← HTTP client, injects JWT
└── categoryIcons.tsx ← Lucide icon map

## Conventions
- Functional components only
- No API calls inside components — use hooks
- Enums: import from @monetria/enums
- Every async screen handles: loading / empty / error / success

## Reusable Components (check before creating new ones)
HeaderPage, PageContainer, SectionCard, EmptyState, LoadingState,
ConfirmDialog, FormField, CurrencyInput, PageActions

## Page Layout Standard
HeaderPage
↓
filters / actions
↓
content
↓
empty state

## Component Locations
- Shared: src/app/components/shared/
- Feature-specific: src/app/components/<feature>/

## Rules
- Extract component if used 3+ times
- No hardcoded styles
- No blank screens — always show loading/empty/error state
- Backend first, frontend after API is stable

## Type Sync Rule
After any backend DTO change, update types in src/types/api/ first,
then fix the hook, then fix the component. Never the reverse order.