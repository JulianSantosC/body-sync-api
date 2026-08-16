# AGENTS.md — body-sync-api

Backend (NestJS) de Body Sync, plataforma personal de seguimiento de peso y comidas.
Proyecto de aprendizaje full-stack: prioriza código idiomático y explicado sobre
soluciones abstraídas o "mágicas". Roadmap del autor: JavaScript → TypeScript →
React → Node.js/NestJS → PostgreSQL.

## Repo relacionado
El frontend vive en un repo separado: `body-sync-client` (React, desplegado en Vercel,
sin Docker). Este repo (`body-sync-api`) es solo el backend.

## Stack
- NestJS (Node.js) → Render (deploy vía Docker, usando el `Dockerfile` de este repo)
- PostgreSQL vía Neon (requiere connection string configurada antes de levantar el proyecto)
- Docker / Docker Compose (con Postgres local opcional vía profile `local-db`, para
  trabajar offline o sin arriesgar datos de Neon)
- GitHub Actions (lint + test en push/PR a `main`)
- Entorno de desarrollo: WSL2 + Ubuntu

## Convenciones
- **public_id / UUIDs expuestos por la API:** generar como **UUID v7** en código
  de aplicación (librería `uuid` npm). NO usar `gen_random_uuid()` de Postgres (es v4).
- **Migraciones:** manuales y explícitas, no ORMs que las abstraigan por completo.
- **Esquema de datos:** ver `docs/schema.dbml` (fuente de verdad del modelo relacional).
- **Variables de entorno:** nunca hardcodear secretos; usar `.env` basado en `.env.example`.
- **Commits:** conventional commits (`feat:`, `fix:`, `chore:`, etc.).

## Docker: solo este repo
El frontend (`body-sync-client`) deliberadamente NO está dockerizado porque se
despliega en Vercel, que tiene su propio pipeline de build y no usa un Dockerfile.
Docker aquí en el backend sí es el mecanismo real de deploy (Render lo construye
directamente), no es solo para desarrollo.

## Qué NO hacer
- No sugerir Railway ni Fly.io (sin free tier viable).
- No reemplazar Neon por Supabase u otro proveedor que abstraiga conexión/migraciones.
- No generar código para etapas del roadmap aún no iniciadas sin confirmar primero.
- No commitear `.env` ni secretos.
- No agregar Docker al repo del frontend sin que el usuario lo pida explícitamente.
