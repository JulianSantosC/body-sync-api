# Body Sync API

Backend de Body Sync (NestJS), desplegado en Render.

## Stack
- NestJS (Node.js)
- PostgreSQL vía Neon
- Docker / Docker Compose

## Requisitos previos

Antes de levantar el proyecto necesitas un proyecto creado en [Neon](https://neon.tech)
con su connection string a mano (o usar el perfil `local-db`, ver abajo).

## Desarrollo local

1. Copiar `.env.example` a `.env` y completar `DATABASE_URL` con tu connection string de Neon.
2. Levantar solo el API (contra Neon): `docker compose up --build`
3. Levantar API + Postgres local (sin depender de Neon): `docker compose --profile local-db up --build`
   - En este caso, usa la línea comentada de `DATABASE_URL` en `.env.example` (`@db:5432`).

## Repo relacionado
Frontend: [body-sync-client](https://github.com/<tu-usuario>/body-sync-client) — no está
dockerizado, corre directo con `npm run dev` (ver su propio README).

Ver `AGENTS.md` para convenciones del proyecto.
