# Body Sync API

Backend de la aplicación **Body Sync**, desplegado en **Render**.

## 🛠️ Stack Tecnológico

* **Framework:** NestJS (Node.js)
* **Base de Datos:** PostgreSQL (vía Neon / Local)
* **Contenedores:** Docker & Docker Compose

---

## 📋 Requisitos Previos

Antes de levantar el proyecto en tu entorno local, necesitas:
1. Tener instalado [Docker](https://docker.com) y Docker Compose.
2. Un proyecto creado en [Neon](https://neon.tech) con su *connection string* a mano (o usar el perfil `local-db`, ver abajo).

---

## 🚀 Desarrollo Local

### 1. Configurar Variables de Entorno
Copia el archivo de plantilla y completa los datos requeridos:
```bash
cp .env.example .env
```
* **Opción Cloud:** Completa `DATABASE_URL` con tu string de conexión de Neon.
* **Opción Local:** Usa la línea comentada de `DATABASE_URL` apuntando a `@db:5432` en el `.env.example`.

### 2. Levantar el Proyecto

Dependiendo de cómo quieras gestionar la base de datos, ejecuta uno de los siguientes comandos en tu terminal:

* **Levantar solo la API (Conectada a Neon Cloud):**
  ```bash
  docker compose up --build
  ```

* **Levantar API + PostgreSQL Local (Sin depender de Neon):**
  ```bash
  docker compose --profile local-db up --build
  ```

---

## 🔗 Repositorios Relacionados

* **Frontend:** [body-sync-client](https://github.com/JulianSantosC/body-sync-client) *(Nota: No está dockerizado, se ejecuta directamente en local con `npm run dev`, para más información puedes ver su propio README)*.

---

## 📐 Convenciones del Proyecto

Para conocer los lineamientos de arquitectura, estilos, buenas prácticas y convenciones adoptadas en este proyecto, por favor revisa el archivo [AGENTS.md](./AGENTS.md).
