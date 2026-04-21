# Tickora

Plataforma de soporte IT para la gestión de tickets, activos y comunicación interna.

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: PostgreSQL + Redis
- **ORM**: Prisma
- **Autenticación**: JWT + bcrypt
- **Contenedores**: Docker + Docker Compose
- **Tiempo real**: Socket.IO
- **IA**: Anthropic SDK (asistente Tika)

## Instalación rápida (Docker)

```bash
# Clonar el repositorio
git clone <repo-url>
cd it-helpdesk

# Copiar variables de entorno
cp .env.example backend/.env
# Editar backend/.env con tus valores (ANTHROPIC_API_KEY, SMTP, etc.)

# Levantar BD y Redis
docker compose -f docker-compose.dev.yml up -d

# Aplicar migraciones
docker run --rm --network it-helpdesk_default \
  -v $(pwd)/backend:/app -w /app node:20-bullseye \
  bash -c "npm install && npx prisma migrate deploy"

# Seed de producción (imprime la contraseña del admin)
docker run --rm --network it-helpdesk_default \
  -v $(pwd)/backend:/app node:20-bullseye \
  bash -c "mkdir /tmp/app && cd /app && tar --exclude=node_modules -cf - . | tar -xf - -C /tmp/app && cd /tmp/app && npm install && ADMIN_EMAIL=admin@tuempresa.com npx ts-node --transpile-only prisma/seed.ts"
```

## Desarrollo local

```bash
# Levantar BD y Redis
docker compose -f docker-compose.dev.yml up -d

# Backend (puerto 4000)
cd backend
npm install
npm run dev

# Frontend (puerto 5174, en otra terminal)
cd frontend
npm install
npm run dev -- --port 5174
```

## Variables de entorno requeridas

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Clave secreta para JWT |
| `ANTHROPIC_API_KEY` | API key de Anthropic (para la asistente Tika) |
| `ADMIN_EMAIL` | Email del administrador inicial |

## Estructura del proyecto

```
tickora/
├── backend/         # API Express + TypeScript
├── frontend/        # React SPA
├── docker-compose.yml
├── docker-compose.dev.yml
├── ARCHITECTURE.md
└── README.md
```

---

© 2026 Tickora. Todos los derechos reservados.
