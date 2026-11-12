# Ruleta

App web para sortear un elemento de una categoría con penalización de los últimos resultados. Cada usuario crea sus categorías, elementos y variantes, y gira una ruleta que decide el resultado y lo registra en un historial interno.

## Requisitos

- Node.js 22.23.4 o superior
- pnpm
- Una base de datos PostgreSQL en [Neon](https://neon.tech)

## Instalación

```bash
pnpm install
cp .env.example .env
```

Rellena `.env` con tus valores y aplica las migraciones:

```bash
pnpm db:migrate
```

## Scripts

| Comando | Qué hace |
| ------- | -------- |
| `pnpm dev` | Servidor de desarrollo en `http://localhost:4321` |
| `pnpm build` | Build de producción para Vercel |
| `pnpm preview` | Sirve la build localmente |
| `pnpm test` | Ejecuta las pruebas con Vitest |
| `pnpm test:watch` | Vitest en modo watch |
| `pnpm db:generate` | Genera una migración a partir de `src/db/schema` |
| `pnpm db:migrate` | Aplica las migraciones pendientes |

## Variables de entorno

| Variable | Uso |
| -------- | --- |
| `DATABASE_URL` | Cadena de conexión de Neon (con `sslmode=require`) |
| `BETTER_AUTH_SECRET` | Secreto de Better Auth; genera uno con `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | URL base de la app: `http://localhost:4321` en local, el dominio de Vercel en producción |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth |
| `RESEND_API_KEY` | API key de Resend |
| `EMAIL_FROM` | Remitente de los correos, con dominio verificado en Resend |

Para probar sin dominio propio, Resend permite `EMAIL_FROM=onboarding@resend.dev`, que solo entrega al correo dueño de la cuenta.

Los secretos nunca se commitean: `.env` está en `.gitignore` y en el repo solo vive `.env.example`.

## Comprobar la conexión

Con `pnpm dev` en marcha, abre `GET /api/health`. Responde `{ "ok": true }` si la base de datos responde y `503` si no.

## Pruebas

```bash
pnpm test
```

Las pruebas de lógica viven en `tests/` y junto al código que prueban. Vitest corre en entorno `node`.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Añade las variables de entorno del apartado anterior; `BETTER_AUTH_URL` debe ser el dominio de Vercel.
3. Despliega. El adaptador `@astrojs/vercel` genera las funciones del servidor automáticamente.
4. Verifica `https://tu-dominio.vercel.app/api/health`.

## Estructura

```
src/
├── pages/        # Rutas y endpoints
├── components/   # Componentes de interfaz
├── layouts/      # Diseños base
├── lib/          # Lógica de dominio
├── db/           # Esquema y acceso a datos
└── styles/       # Estilos globales
tests/            # Pruebas con Vitest
specs/            # Especificaciones del producto
```
