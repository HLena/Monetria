# Settings — Configuraciones

## 2026-07-03 — Implementación inicial

### Estructura de la página

Página de configuración con navegación lateral (sidebar) y 6 secciones:

| Sección | Estado | Descripción |
|---|---|---|
| Perfil | Funcional | Nombre, apellido, avatar de iniciales, email de solo lectura |
| Preferencias | Funcional | Moneda base (PEN/USD), formato de fecha, selector de tema |
| Categorías | Funcional | Categorías del sistema (read-only) + CRUD de categorías del usuario |
| Instituciones | Catálogo estático | Lista predefinida de bancos peruanos — sin backend propio |
| Seguridad y datos | Parcial | Cambio de contraseña funcional; exportar y eliminar cuenta implementados |
| Notificaciones | Placeholder | Toggles visibles pero deshabilitados (próximamente) |

---

### Backend — cambios

**`User.cs` (Domain)**
- Campo `PreferredCurrency: string` (default `"PEN"`)
- Campo `DateFormat: string` (default `"DD/MM/YYYY"`)

**`UserDtos.cs` (Application)**
- `UserResponse` actualizado con `PreferredCurrency` y `DateFormat`
- Nuevo `UpdateProfileRequest(FirstName, LastName, PreferredCurrency?, DateFormat?)`
- Nuevo `ChangePasswordRequest(CurrentPassword, NewPassword)`

**`IUserService` / `UserService` (Application)**
- `UpdateProfileAsync` — valida nombre, moneda (PEN/USD), formato de fecha
- `ChangePasswordAsync` — verifica contraseña actual via `IPasswordService`
- `DeactivateAsync` — soft delete: reemplaza datos del usuario con valores marcados como eliminado

**`IUserRepository` / `UserRepository` (Infrastructure)**
- Método `UpdateAsync(User)` agregado

**`UserEndpoints.cs` (API)**
- `GET /users/me`
- `PATCH /users/me`
- `POST /users/me/change-password`
- `DELETE /users/me`

**Migración:** `20260703235845_AddUserPreferences` — agrega columnas `PreferredCurrency` y `DateFormat` a `Users`

**Tests agregados:**
1. `UpdateProfileAsync_WithValidData_UpdatesNameAndPreferences`
2. `UpdateProfileAsync_WithEmptyFirstName_ThrowsArgumentException`
3. `UpdateProfileAsync_WithInvalidCurrency_ThrowsArgumentException`
4. `ChangePasswordAsync_WithCorrectCurrentPassword_Succeeds`
5. `ChangePasswordAsync_WithWrongCurrentPassword_ThrowsUnauthorizedAccessException`
6. `ChangePasswordAsync_WithShortNewPassword_ThrowsArgumentException`

---

### Frontend — cambios

**`types/api/users.ts`** (nuevo)
- `UserDto`, `UpdateProfileRequestBody`, `ChangePasswordRequestBody`

**`api/users.ts`** (nuevo)
- `getMe`, `updateProfile`, `changePassword`, `deactivateMyAccount`

**`api/categories.ts`** (ampliado)
- `createCategory`, `updateCategory`, `deactivateCategory`

**`lib/apiClient.ts`**
- Método `patch` agregado al cliente HTTP

**`AuthStore.tsx`**
- `AuthUser` ahora incluye `preferredCurrency` y `dateFormat`
- Acciones nuevas: `updateProfile`, `changePassword`, `deleteAccount`

**`pages/Settings.tsx`** (reescrito)
- Layout de dos columnas: sidebar de navegación (izquierda) + contenido (derecha)
- 6 secciones internas como sub-componentes funcionales
- `useFinanceStoreForCategories` — bridge ligero que reutiliza el store existente sin duplicar estado

---

### Decisiones de diseño

- **Cambiar contraseña** vive solo en Seguridad (no duplicado en Perfil)
- **Instituciones** son catálogo estático en frontend — no hay tabla ni CRUD en backend, consistente con el plan de usar autocomplete en el form de cuentas
- **Eliminar cuenta** = soft delete: el email se reemplaza por `deleted_{id}@deleted.invalid` para liberar unicidad del índice sin destruir FKs
- **Notificaciones** = placeholder forzado con `opacity-50 pointer-events-none` para comunicar el roadmap sin funcionalidad prematura
