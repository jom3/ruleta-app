# Overview — Ruleta de elementos por categoría

> **Status:** Draft
> **Date:** 2026-11-11
> **Source:** `idea.md` (MVP, F-01 a F-08)

## Modules

| # | Spec | Objective | Depends on |
| - | ---- | --------- | ---------- |
| 01 | `01-project-foundation` | Astro + TypeScript + adaptador de Vercel, cliente Drizzle contra Neon, Vitest y README ejecutables. | — |
| 02 | `02-authentication` | Registro e inicio de sesión con correo/contraseña y con Google, sesión persistente y rutas privadas protegidas. | 01 |
| 03 | `03-password-recovery` | Restablecer contraseña por enlace enviado con Resend. | 02 |
| 04 | `04-categories` | Listar, crear y borrar categorías propias con nombre único y estado vacío (F-06). | 02 |
| 05 | `05-elements-and-variants` | Crear y borrar elementos dentro de una categoría y variantes dentro de un elemento. | 04 |
| 06 | `06-spin-engine` | Calcular pesos con penalización, sortear elemento y variante, y registrar el giro. | 05 |
| 07 | `07-wheel-ui` | Endpoint de giro y ruleta animada de ~4 s que muestra el resultado, también en móvil. | 06 |

Implementation order = number order. Each spec leaves the app runnable and deployed.

## Global decisions

- **Lenguaje:** TypeScript estricto en todo el repo. Los `.astro` incluyen `lang="ts"` cuando tienen lógica.
- **Framework:** Astro en `output: 'server'` con `@astrojs/vercel`. Sin framework de UI; la interactividad va en scripts TS de navegador dentro de componentes Astro.
- **Estilos:** CSS por componente + variables globales en `src/styles/tokens.css`. Sin Tailwind, sin kit de componentes.
- **Base de datos:** PostgreSQL en Neon, acceso con Drizzle ORM sobre `@neondatabase/serverless`. Un único cliente exportado desde `src/db/client.ts`. Migraciones con `drizzle-kit`.
- **Autenticación:** Better Auth (`src/lib/auth.ts`) con correo/contraseña y proveedor Google. Tablas de Better Auth en `src/db/schema/auth.ts`.
- **Correo:** Resend (`src/lib/email.ts`), remitente desde `EMAIL_FROM`.
- **Gestor de paquetes:** pnpm. Los scripts viven en `package.json` (`dev`, `build`, `test`, `db:generate`, `db:migrate`).
- **Glosario obligatorio:** categoría, elemento, variante, giro. Nombres de código en inglés: `category`, `element`, `variant`, `spin`.
- **Aislamiento por usuario:** toda consulta filtra por `userId` de la sesión. Un `id` de otro usuario responde 404, nunca 403 con datos.
- **Unicidad sin distinguir mayúsculas:** cada tabla con nombre guarda `name` (como lo escribió el usuario) y `name_key` (`name.trim().toLowerCase()`), con índice único sobre `name_key` y su padre.
- **Errores:** una mutación fallida no deja escrituras parciales. Los mensajes al usuario son específicos para datos inválidos y genéricos para credenciales.
- **Testing:** Vitest en entorno `node` para lógica de dominio y repositorios; criterios de UI verificados a mano en móvil, tablet y escritorio.
- **Regla de penalización (única para todo el producto):** el último elemento que salió en la categoría pesa 1/10, el anterior 1/2, el resto 1. Solo cuentan los 2 giros más recientes cuyo elemento todavía existe. Nunca hay peso 0.

## Vocabulary of records

- Un **giro** guarda `categoryId`, `elementId`, `variantId` (nulo si el elemento no tenía variantes) y `createdAt`.
- El **historial** es la tabla `spins`; no se muestra al usuario en el MVP.
