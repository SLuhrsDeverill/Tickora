IT HelpDesk — Software Architecture Document
=============================================

1. HIGH-LEVEL OVERVIEW
   ┌──────────────────────────────────────────────┐
   │                  CLIENTE                      │
   │         React SPA (port 5173 dev)             │
   └───────────────────┬──────────────────────────┘
                       │ HTTP/REST + JSON
   ┌───────────────────▼──────────────────────────┐
   │              API GATEWAY                      │
   │         Express.js (port 3000)                │
   │    Auth Middleware → Rate Limiting → CORS      │
   └────┬───────────────┬───────────────┬──────────┘
        │               │               │
   ┌────▼────┐    ┌──────▼──────┐  ┌───▼──────┐
   │Tickets  │    │  Usuarios   │  │  Activos │
   │Service  │    │  Service    │  │  Service │
   └────┬────┘    └──────┬──────┘  └───┬──────┘
        │               │               │
   ┌────▼───────────────▼───────────────▼──────────┐
   │                 PRISMA ORM                     │
   └────────────────────┬───────────────────────────┘
                        │
   ┌────────────────────▼───────────────────────────┐
   │              PostgreSQL Database               │
   └────────────────────────────────────────────────┘
                        
   ┌────────────────────────────────────────────────┐
   │         Redis (sesiones + cache métricas)      │
   └────────────────────────────────────────────────┘

2. MÓDULOS DEL SISTEMA
   - Auth Module: login, roles, JWT refresh tokens
   - Tickets Module: CRUD completo, estados, comentarios, adjuntos
   - Users Module: empleados, perfil, departamentos
   - Assets Module: activos IT, asignaciones, mantenimiento
   - Metrics Module: dashboard, KPIs, reportes
   - Notifications Module: email alerts (nodemailer)

3. ROLES Y PERMISOS
   - ADMIN: acceso total, gestión de usuarios, configuración
   - IT_AGENT: recibe y gestiona tickets, ve activos
   - EMPLOYEE: crea tickets, ve sus propios tickets, ve sus activos

4. FLUJO DE UN TICKET
   OPEN → IN_PROGRESS → RESOLVED → CLOSED
                    ↘ ON_HOLD ↗
