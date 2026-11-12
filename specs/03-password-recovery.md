# SPEC 03 — Password recovery by email

> **Status:** Draft
> **Depends on:** SPEC 02
> **Date:** 2026-11-11
> **Objective:** Permitir que un usuario con contraseña reciba un enlace por correo y establezca una nueva contraseña de 8 o más caracteres.

## Scope

**In:**

- `src/lib/email.ts` con un `sendEmail` sobre Resend.
- Página `/forgot-password` con formulario de correo.
- Página `/reset-password` que lee el token de la URL y pide la nueva contraseña.
- Callback `sendResetPassword` de Better Auth conectado a Resend.
- Mensaje genérico en `/forgot-password`: "Si el correo existe, enviamos un enlace".

**Out of scope (future specs):**

- Verificación de correo al registrarse.
- Cambio de contraseña desde sesión activa.
- Plantillas de correo más allá del texto mínimo.

## Data model

No añade tablas propias: Better Auth usa `verification` (token, `expiresAt`) y `account.password`.

```ts
// src/lib/email.ts
export type EmailMessage = { to: string; subject: string; text: string }

export async function sendEmail(message: EmailMessage): Promise<void>
```

```ts
// src/lib/reset.ts
export type ResetRequestResult = 'sent' | 'ignored'
export async function requestReset(email: string): Promise<ResetRequestResult>
```

`requestReset` devuelve `'ignored'` cuando el correo no existe o la cuenta solo tiene Google, y en ambos casos la página muestra el mismo texto.

## Implementation plan

1. Instalar `resend`, crear `src/lib/email.ts` y verificar un envío real a un correo propio desde `pnpm dev`.
2. Crear `src/lib/reset.ts`: buscar el usuario por correo; si existe y tiene `account.providerId = 'credential'`, pedir a Better Auth el token y enviar el correo; en cualquier otro caso devolver `'ignored'`.
3. Configurar `sendResetPassword` en `src/lib/auth.ts` para reutilizar `src/lib/email.ts`.
4. Crear `/forgot-password` con formulario y mensaje genérico tras enviar, válido también cuando el correo no existe.
5. Crear `/reset-password` que lee `token` de la query, valida la nueva contraseña (mínimo 8) y llama al endpoint de reset de Better Auth.
6. Manejar token inválido o expirado: mensaje "El enlace no es válido o caducó" con enlace a `/forgot-password`.
7. Al cambiar la contraseña, redirigir a `/login` con aviso de éxito.
8. Añadir pruebas de `requestReset` para: correo inexistente, cuenta con contraseña y cuenta solo Google (todas con Resend simulado).

## Acceptance criteria

- [ ] Solicitar recuperación con una cuenta de correo/contraseña envía un correo con un enlace que abre `/reset-password`.
- [ ] El enlace permite fijar una contraseña de 8 caracteres y después iniciar sesión con ella.
- [ ] Una contraseña nueva de menos de 8 caracteres se rechaza con mensaje y no cambia nada.
- [ ] Renombrar (`requestReset`) con un correo sin cuenta muestra el mismo mensaje genérico que con una cuenta existente.
- [ ] Una cuenta creada solo con Google no recibe un enlace utilizable; la pantalla sigue mostrando el mensaje genérico.
- [ ] Un token inválido o expirado no cambia la contraseña y muestra el mensaje de enlace no válido.
- [ ] Tras restablecer, el enlace no puede reutilizarse.

## Decisions

- **Yes:** Mensaje genérico siempre. Evita enumerar correos registrados, coherente con el mensaje genérico de credenciales.
- **Yes:** A una cuenta solo Google se le envía un correo que dice "esta cuenta entra con Google" en lugar de mostrar ese aviso en pantalla. Cumple la decisión de bloquear el reset y no revela a un tercero qué correos tienen cuenta. *(Ajuste a confirmar por el usuario; alternativa registrada: mostrar el aviso en pantalla y aceptar la enumeración.)*
- **Yes:** Resend con texto plano. Un correo con un enlace no necesita HTML.
- **Yes:** La expiración del token la fija Better Auth (1 hora por defecto). No se implementa otro mecanismo.
- **No:** Enviar el token en el cuerpo de la respuesta HTTP. Solo viaja por correo.
- **No:** Recuperación manual por el autor del proyecto. El MVP incluye F-07.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Resend exige un dominio verificado para enviar a terceros | Verificar el dominio en Resend antes de publicar; en dev, usar la dirección de pruebas `onboarding@resend.dev` con el correo del autor. |
| Correos que caen en spam | Remitente con dominio verificado y asunto plano; documentar en el README que el enlace puede tardar. |
| Fuerza bruta sobre `/forgot-password` | Activar el rate limit de Better Auth en esa ruta y limitar a 3 intentos por IP y minuto. |

## What is not in this spec

- Verificación del correo al crear la cuenta.
- Cambio de contraseña desde una sesión activa.
- Notificaciones por correo de otros eventos.
