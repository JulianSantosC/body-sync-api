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
- **Commits:** conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`, `test:`, etc.).

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

## Fases del proyecto
- Fase 0 — Infraestructura base (donde estás ahora)
  - Verificar que Docker levanta correctamente la API conectada a Neon.
  - Confirmar que el Dockerfile multi-stage funciona igual que funcionará en Render.
  - Crear develop desde main y acostumbrarte al flujo de ramas.
- Fase 1 — Persistencia y migraciones
  - Configurar node-pg-migrate (o el driver pg puro con scripts de migración manuales).
  - Escribir y correr la primera migración: tabla users.
  - Migraciones de profiles y weight_entries (respetando el patrón id interno + public_id UUID v7).
- Fase 2 — Auth (NestJS)
  - Módulo de auth manual: hashing con argon2, JWT access + refresh, estrategias de Passport, guards.
  - Endpoints de registro/login, protección de rutas.
- Fase 3 — Primer CRUD real: weight_entries
  - Capas Controller → Service → Repository (SQL crudo con pg).
  - Validaciones (DTOs con class-validator).
  - Jest desde este módulo en adelante (arrange-act-assert, repos mockeados).
  - Endpoints protegidos por public_id, verificando que un usuario no pueda acceder a datos de otro (IDOR).
- Fase 4 — CI/CD y despliegue real
  - GitHub Actions corriendo lint + tests en cada PR contra develop/main.
  - Deploy del backend en Render (Docker) apuntando a Neon de producción.
  - Confirmar que el flujo completo funciona en la nube, no solo local.
- Fase 5 — Frontend (React)
  - Scaffold de body-sync-client, consumo de la API desplegada.
  - Login/registro, formulario de peso, listado/gráfica de progreso.
  - Deploy en Vercel.
- Fase 6 — Refinamiento y aprendizaje profundo
  - Refactor de un módulo (probablemente weight_entries) hacia Clean/Hexagonal Architecture.
  - Módulo de comidas (meals) — diferido hasta ahora a propósito.
  - Body fat tracking (Jackson & Pollock) — backlog.
  - TDEE (Mifflin-St Jeor) calculado en runtime desde el perfil.

## A tener en cuenta
- Este proyecto es de aprendizaje, por lo tanto es necesario añadir comentarios que sean útiles para el autor y otros desarrolladores que puedan leer el código. No se trata de escribir código "mágico" o demasiado abstracto, sino de priorizar la claridad y la comprensión.
- Se utilizan lenguajes y herramientas nuevas para el desarrollador, como TypeScript, Node.js, React, PostgreSQL, JWT y se busca que el código sea idiomático, que siga buenas prácticas, y que sea fácil de entender para otros desarrolladores. Debido a esto surge la importancia de comentarios clave con los que estudiar, aprender y entender el código.
- Con este proyecto se busca aprender y mejorar en el desarrollo full-stack, teniendo en cuenta todas sus etapas, desde planteamiento, seguridad, despliegue y mantenimiento, hasta la implementación de nuevas funcionalidades y mejoras en el código existente.