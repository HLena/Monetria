# Auth Module

## Overview

Módulo de autenticación completo: registro, login con JWT, guard de rutas y manejo global de sesión expirada.

---

## 2026-10-26 — Completar módulo de autenticación

### Cambios realizados

**Backend:**

- `AuthDtos.cs`: `AuthResponse` extendido con `PreferredCurrency`, `DateFormat`, `Theme`, `PhoneNumber?`. Los valores vienen directamente del `User` entity (que tiene defaults: `"PEN"`, `"DD/MM/YYYY"`, `"light"`).
- `AuthService.cs`: `CreateAuthResponse` actualizado para mapear los nuevos campos.
- `AuthSessionResponse.cs`: `AuthSessionUser` extendido con los mismos campos; `FromAuth` actualizado.

**Frontend:**

- `AuthStore.tsx`: `AuthApiResponse.user` tipado con los 8 campos completos — tras login/register, el `AuthUser` en Zustand ya tiene preferencias populadas sin necesidad de llamar a `GET /users/me`.
- `apiClient.ts`: Auto-logout en 401 cuando hay sesión activa — limpia `auth_token` y `auth-storage` de localStorage y redirige a `/login` vía `window.location.replace`. Solo actúa si hay token (evita dispararse en login con credenciales inválidas).
- `ProtectedRoute.tsx` (nuevo en `shared/`): Guard que verifica `accessToken` en el store y redirige a `/login` si no existe.
- `routes.tsx`: Ruta raíz envuelta en `ProtectedRoute` → `Layout` → páginas. Todas las rutas bajo `/` requieren sesión.
- `Login.tsx`: Redirect a `/` si ya hay `accessToken`; `handleTabChange` resetea `showPassword` y `showConfirmPassword` al cambiar de tab.
- `AuthContext.tsx`: Eliminado — era código muerto (stubs comentados), nunca integrado, reemplazado por `AuthStore.tsx`.

### Flujo post-login

```
POST /auth/login → { token, user: { userId, firstName, lastName, email, preferredCurrency, dateFormat, theme, phoneNumber } }
→ AuthStore.login() guarda todo en Zustand + localStorage
→ Zustand persist sincroniza accessToken a auth_token en localStorage
```

### Protección de rutas

```
/ (ProtectedRoute)
  → si accessToken == null → redirect /login
  → si accessToken existe → renderiza Layout + children
/login
  → si accessToken existe → redirect /
  → si no hay sesión → muestra formulario
```

### Auto-logout por expiración de token

Cuando cualquier llamada a la API recibe `401` y hay un token almacenado:
1. Elimina `auth_token` de localStorage
2. Elimina `auth-storage` de localStorage (Zustand persist)
3. Redirige a `/login` con recarga completa

En el próximo montaje, Zustand rehydrata con `{ user: null, accessToken: null }` y `ProtectedRoute` redirige al login.
