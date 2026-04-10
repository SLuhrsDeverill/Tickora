# IT HelpDesk

Sistema completo de gestión de tickets para el sector IT de una empresa.

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: PostgreSQL + Redis
- **ORM**: Prisma
- **Autenticación**: JWT + bcrypt
- **Contenedores**: Docker + Docker Compose

## Instalación rápida (Docker)

```bash
# Clonar el repositorio
git clone <repo-url>
cd it-helpdesk

# Copiar variables de entorno
cp .env.example backend/.env

# Levantar todo el sistema
docker compose up -d

# Aplicar migraciones y seed
docker compose exec backend npm run db:deploy
docker compose exec backend npm run db:seed
```

El sistema estará disponible en:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs

## Desarrollo local

```bash
# Levantar solo BD y Redis
docker compose -f docker-compose.dev.yml up -d

# Backend
cd backend
cp ../.env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

## Usuarios de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@empresa.com | Admin1234! |
| IT Agent | it.agent@empresa.com | Agent1234! |
| Employee | empleado@empresa.com | Empleado1234! |

## Estructura del proyecto

```
it-helpdesk/
├── backend/         # API Express + TypeScript
├── frontend/        # React SPA
├── docker-compose.yml
├── docker-compose.dev.yml
├── ARCHITECTURE.md
└── README.md
```
