# SPEC 02 — Authentication with email/password and Google

> **Status:** Draft
> **Depends on:** SPEC 01
> **Date:** 2026-11-11
> **Objective:** Permitir registrarse y entrar con correo/contraseña o con Google, manteniendo sesión y bloqueando el acceso anónimo.

## Why

Better Auth necesita su propio esquema y una ruta comodín; por eso la base de datos de autenticación llega aquí y no en SPEC 01.

## Scope

**In:**

- Tablas de Better Auth en `src/db/schema/auth.ts` con su migración.
- `src/lib/auth.ts` con `emailAndPassword` (mínimo 8 caracteres) y el proveedor `google`.
- Ruta `src/pages/api/auth/[...all].ts`.
- Middleware `src/middleware.ts` que redirige a `/login` sin sesión en `/app/*`.
- Páginas `/register` y `/login` con sus formularios y mensajes de error.
- Botón "Continuar con Google" en ambas páginas y enlace "Olvidé mi contraseña" (la página llega en SPEC 03).
- Cerrar sesión desde el encabezado.
- Sesión iniciada automáticamente tras el registro con correo y contraseña.

**Out of scope (future specs):**

- Recuperación de contraseña (SPEC 03).
- Verificación de correo y exigencia de mezcla de caracteres.

## Data model

Tablas generadas por `npx @better-auth/cli generate` en `src/db/schema/auth.ts`:

```ts
user        { id, name, email (unique), emailVerified, image, createdAt, updatedAt }
session     { id, token, userId → user.id, expiresAt, ipAddress, userAgent }
account     { id, userId → user.id, providerId, accountId, password?, ... }
verification{ id, identifier, value, expiresAt }
```

- `providerId` vale `credential` o `google`.
- Un correo es una única fila en `user`; Better Auth rechaza un segundo registro con el mismo correo.

## Implementation plan

1. Instalar `better-auth` y generar `src/db/schema/auth.ts` con el CLI; exportarlo desde `src/db/schema/index.ts`.
2. Generar y aplicar la migración; verificar las cuatro tablas en Neon.
3. Crear `src/lib/auth.ts` con `drizzleAdapter`, `emailAndPassword: { enabled: true, minPasswordLength: 8 }` y `socialProviders.google`; `secret` y `baseURL` desde `env`.
4. Montar `src/pages/api/auth/[...all].ts` que delega en el handler de Better Auth.
5. Crear `src/lib/session.ts` con `getCurrentUser(Astro)` que devuelve el usuario o `null`.
6. Añadir `src/middleware.ts`: para `context.url.pathname.startsWith('/app')` sin usuario, redirigir 302 a `/login`.
7. Crear `src/pages/register.astro` y `src/pages/login.astro` con formulario accesible, mensaje de error y enlace a la otra página; validación de contraseña de 8 caracteres antes de enviar.
8. Añadir el flujo de Google y el cierre de sesión; tras autenticar, redirigir a `/app`.
9. Mostrar en `/register` el aviso de correo ya registrado ("ya tienes cuenta, inicia sesión; si te registraste con Google, usa Google").
10. Añadir pruebas de `getCurrentUser` con una sesión simulada y un caso sin sesión.

## Acceptance criteria

- [ ] Un correo nuevo con contraseña de 8 caracteres crea la cuenta y deja al usuario en `/app` con sesión iniciada.
- [ ] Una contraseña de 7 caracteres se rechaza con mensaje y no crea cuenta.
- [ ] Registrar dos veces el mismo correo no crea una segunda cuenta y muestra el aviso de cuenta existente.
- [ ] Un correo con formato inválido se rechaza con mensaje.
- [ ] Credenciales incorrectas muestran "Correo o contraseña incorrectos", sin indicar cuál falló.
- [ ] Entrar con Google con un correo que ya tiene cuenta manual lleva a esa misma cuenta y conserva sus datos.
- [ ] Cancelar la autorización de Google devuelve a `/login` sin cambios y sin error bloqueante.
- [ ] Cerrar sesión y volver a entrar con las mismas credenciales devuelve al usuario a su `/app`.
- [ ] Un visitante sin sesión que abre `/app` es redirigido a `/login`.
- [ ] Un usuario sin sesión que llama a `POST /api/auth/sign-in/email` con datos válidos obtiene sesión (la API no exige sesión previa, las páginas sí).

## Decisions

- **Yes:** Better Auth también para Google. Un solo modelo de sesión y un solo esquema evita sincronizar dos sistemas.
- **Yes:** Login automático después del registro. El usuario nuevo cae directamente en el estado vacío (SPEC 04).
- **Yes:** Middleware central para `/app/*`. La protección vive en un solo archivo, no en cada página.
- **Yes:** Interfaz de auth sin framework de UI: componente `.astro` + `<script>` con `better-auth/client`. Menos dependencias para dos formularios.
- **Yes:** Aviso explícito de correo ya registrado. La idea acepta el riesgo de revelar que el correo tiene cuenta.
- **No:** Verificación de correo. Fuera de alcance del MVP.
- **No:** Campo "nombre" obligatorio en el registro. Better Auth lo pide; se envía la parte local del correo sin pedirlo al usuario.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| El esquema de Better Auth cambia entre versiones | Fijar la versión en `package.json` y regenerar el esquema solo con actualización explícita. |
| `BETTER_AUTH_URL` mal configurada rompe las redirecciones de Google | Documentar el valor por entorno (localhost en dev, dominio de Vercel en producción) en el README. |

## What is not in this spec

- Recuperación de contraseña (SPEC 03).
- Datos de categorías, elementos y giros (SPEC 04 en adelante).
