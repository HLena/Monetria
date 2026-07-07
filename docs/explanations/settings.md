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

---

## 2026-07-07 — Campos Theme, PhoneNumber y persistencia de preferencias

### Backend — cambios

**`User.cs` (Domain)**
- Campo `Theme: string` (default `"light"`) — valores permitidos: `"light"`, `"dark"`
- Campo `PhoneNumber: string?` (nullable, max 20 caracteres)

**`UserDtos.cs` (Application)**
- `UserResponse` ahora incluye `Theme` y `PhoneNumber`
- `UpdateProfileRequest` ahora acepta `Theme?` y `PhoneNumber?`

**`UserService.cs` (Application)**
- Validación: `Theme` debe ser `"light"` o `"dark"` si se proporciona
- Validación: `PhoneNumber` no puede exceder 20 caracteres
- `PhoneNumber` se sobreescribe con `null` si se pasa explícitamente como `null` (permite borrar el número)

**Migración:** `AddThemeAndPhoneToUser` — agrega columnas `Theme` (varchar(10), default `"light"`) y `PhoneNumber` (varchar(20), nullable) a `Users`

**Tests agregados:**
1. `UpdateProfileAsync_WithValidData_UpdatesNameAndPreferences` — actualizado para incluir `theme` y `phoneNumber`
2. `UpdateProfileAsync_WithInvalidTheme_ThrowsArgumentException`
3. `UpdateProfileAsync_WithPhoneTooLong_ThrowsArgumentException`
4. `UpdateProfileAsync_WithNullPhone_ClearsPhoneNumber`

---

### Frontend — cambios

**`types/api/users.ts`**
- `UserDto` ahora incluye `theme: string` y `phoneNumber: string | null`
- `UpdateProfileRequestBody` ahora acepta `theme?: string` y `phoneNumber?: string | null`

**`AuthStore.tsx`**
- `AuthUser` ahora incluye `theme` y `phoneNumber`
- `updateProfile` sincroniza los nuevos campos tras guardar

**`ProfileSection.tsx`**
- Campo de teléfono agregado bajo el correo electrónico (type `tel`, placeholder `+51 999 000 111`)
- Al guardar, envía `phoneNumber: null` si el campo está vacío (para borrar el número)

**`PreferencesSection.tsx`**
- Moneda y tema ahora persisten al backend mediante `updateProfile` al cambiar el toggle
- El indicador activo del tema usa `user?.theme` (fuente de verdad del servidor) con fallback a `theme` del hook local
- Se eliminó el estado local `currency` — se usa directamente `user?.preferredCurrency`

---

### Decisiones de diseño

- **Cambiar contraseña** vive solo en Seguridad (no duplicado en Perfil)
- **Instituciones** son catálogo estático en frontend — no hay tabla ni CRUD en backend, consistente con el plan de usar autocomplete en el form de cuentas
- **Eliminar cuenta** = soft delete: el email se reemplaza por `deleted_{id}@deleted.invalid` para liberar unicidad del índice sin destruir FKs
- **Notificaciones** = placeholder forzado con `opacity-50 pointer-events-none` para comunicar el roadmap sin funcionalidad prematura
