# SPEC 01 — Project foundation, database client and test harness

> **Status:** Implemented
> **Depends on:** None
> **Date:** 2026-11-11
> **Objective:** Dejar un proyecto Astro+TypeScript desplegable en Vercel que hable con Neon por Drizzle y ejecute Vitest.

## Scope

**In:**

- Proyecto Astro con TypeScript estricto, `output: 'server'` y `@astrojs/vercel`.
- `src/db/client.ts` con un cliente Drizzle único sobre `@neondatabase/serverless`.
- `src/lib/env.ts` que valida las variables de entorno al arrancar.
- `drizzle.config.ts` y los scripts `db:generate` / `db:migrate`.
- Vitest configurado en entorno `node` con `pnpm test`.
- Ruta `GET /api/health` que comprueba la conexión a la base de datos.
- `.env.example` y `README.md` con instalación, variables, pruebas y despliegue.

**Out of scope (future specs):**

- Tablas de dominio: llegan con SPEC 02 (`user`, `session`, `account`, `verification`) y SPEC 04 en adelante.
- Autenticación, páginas de producto y estilos de la aplicación.

## Data model

Sin tablas de dominio todavía. Solo infraestructura:

```ts
// src/lib/env.ts
export const env = {
  DATABASE_URL: string,
  BETTER_AUTH_SECRET: string,
  BETTER_AUTH_URL: string,
  GOOGLE_CLIENT_ID: string,
  GOOGLE_CLIENT_SECRET: string,
  RESEND_API_KEY: string,
  EMAIL_FROM: string,
}
```

`src/db/schema/index.ts` existe vacío como barril; `src/db/client.ts` exporta `db` tipado con `typeof schema`.

## Implementation plan

1. `pnpm create astro@latest` en la raíz, plantilla vacía, TypeScript estricto; `pnpm install` y commit inicial del esqueleto.
2. Añadir `@astrojs/vercel`, fijar `output: 'server'` en `astro.config.mjs` y confirmar que `pnpm build` pasa.
3. Añadir `drizzle-orm`, `drizzle-kit` y `@neondatabase/serverless`; crear `src/lib/env.ts` y `src/db/client.ts`.
4. Crear `drizzle.config.ts` apuntando a `src/db/schema/index.ts` y a `DATABASE_URL`; añadir scripts `db:generate` y `db:migrate`.
5. Añadir `GET /api/health` que ejecuta `select 1` y devuelve `{ ok: true }` o 503.
6. Añadir `vitest` + `vitest.config.ts` con `environment: 'node'`, un test trivial que valide `normalizeName` inexistente aún — en su lugar, un test de `env` que acepte un objeto válido.
7. Escribir `.env.example` y `README.md` (qué es, instalar, variables, migrar, probar, desplegar).
8. `.gitignore` con `.env`, `dist/`, `.vercel/`, `node_modules/`; verificar que `git status` no muestra secretos.

## Acceptance criteria

- [ ] `pnpm install` termina sin errores en un clon limpio.
- [ ] `pnpm dev` levanta el sitio y `GET /api/health` responde 200 con `{ "ok": true }`.
- [ ] Con `DATABASE_URL` inválida, `/api/health` responde 503 y el error se registra en consola.
- [ ] Faltando una variable de `env`, el arranque falla con un mensaje que nombra la variable faltante.
- [ ] `pnpm test` ejecuta al menos una prueba y termina en 0.
- [ ] `pnpm build` produce una build de Vercel sin errores.
- [ ] Desplegado en Vercel con las variables de entorno, `/api/health` responde 200 en el dominio público.
- [ ] `README.md` lista todas las variables de entorno y los comandos del proyecto.

## Decisions

- **Yes:** Astro en `output: 'server'` desde el inicio. Better Auth y las rutas privadas necesitan SSR; migrar de `static` después obliga a reescribir páginas.
- **Yes:** Drizzle con driver HTTP de Neon. Menos conexiones que un pool TCP y funciona en funciones serverless.
- **Yes:** `src/lib/env.ts` que falla rápido. Un secreto ausente en producción debe romper el arranque, no una petición del usuario.
- **Yes:** `/api/health` desde el primer spec. Es la única forma de verificar que Neon está conectado antes de escribir datos.
- **No:** Prisma. Bundle más pesado y menos directo con el driver HTTP de Neon.
- **No:** Tailwind o kit de UI. La interfaz es pequeña; CSS por componente basta.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| El adaptador de Vercel cambia entre versiones de Astro | Fijar versión de `@astrojs/vercel` y `astro` en `package.json`; verificar la build en el paso 2. |
| Región de Neon lejana al despliegue | Crear el proyecto de Neon en la región más cercana a la de Vercel. |

## What is not in this spec

- Tablas de Better Auth (SPEC 02).
- Scripts de siembra o datos de ejemplo (fuera de alcance del producto).
- Pruebas de navegador (no hay herramienta elegida).
