# Task Manager

A full-stack task management web app built for teams. Supports role-based access, multi-assignee tasks, due date reminders, and real-time collaboration across teams.

## Features

- **Authentication** — Secure register/login with bcrypt-hashed passwords and session-based auth
- **Teams** — Create teams, add/remove members by email, edit team details
- **Tasks** — Create, assign (to multiple members), update status, filter, and delete tasks
- **Role-based access** — Only team creators can create/delete tasks and manage members
- **Due date reminders** — Dashboard shows overdue, due-today, and upcoming task alerts (per user)
- **Multi-assignee** — Tasks can be assigned to one or more team members
- **Responsive** — Works on mobile, tablet, and desktop

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Auth | PassportJS (local strategy), express-session |
| Database | PostgreSQL |
| Validation | express-validator |
| Session Store | connect-pg-simple (prod) / memory (dev) |

## Project Structure

```
/
├── backend/
│   ├── config/passport.js
│   ├── db/
│   │   ├── pool.js
│   │   ├── schema.sql
│   │   └── migrate_multi_assignee.sql
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── teams.js
│   │   └── tasks.js
│   └── server.js
└── frontend/
    └── src/
        ├── context/AuthContext.jsx
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   └── TeamDetailPage.jsx
        └── components/
            ├── TaskCard.jsx
            ├── TaskModal.jsx
            ├── TeamModal.jsx
            └── ReminderBanner.jsx
```

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone
```bash
git clone https://github.com/YOUR_USERNAME/Secure-Task-Management-System.git
cd Secure-Task-Management-System
```

### 2. Database
```bash
psql -U postgres -c "CREATE DATABASE teamtaskdb;"
psql -U postgres -d teamtaskdb -f backend/db/schema.sql
psql -U postgres -d teamtaskdb -f backend/db/migrate_multi_assignee.sql
```

### 3. Backend environment
```bash
cd backend && cp .env.example .env
```
```
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/teamtaskdb
SESSION_SECRET=change_this_to_a_long_random_string
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 4. Run backend
```bash
cd backend && npm install && npm run dev
```

### 5. Run frontend
```bash
cd frontend && npm install && npm run dev
```

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | /auth/register | Register |
| POST | /auth/login | Login |
| POST | /auth/logout | Logout |
| GET | /auth/me | Current user |

### Teams (protected)
| Method | Path | Description |
|---|---|---|
| GET | /teams | My teams |
| POST | /teams | Create team |
| GET | /teams/:id | Team + members |
| PUT | /teams/:id | Update team (creator only) |
| DELETE | /teams/:id | Delete team (creator only) |
| POST | /teams/:id/members | Add member by email |
| DELETE | /teams/:id/members/:userId | Remove member |

### Tasks (protected)
| Method | Path | Description |
|---|---|---|
| GET | /tasks | List tasks (`?team_id`, `?assigned_to`, `?status`, `?search`) |
| GET | /tasks/reminders | My overdue/due-today tasks |
| POST | /tasks | Create task (creator only) |
| GET | /tasks/:id | Single task |
| PUT | /tasks/:id | Update task (creator only) |
| PUT | /tasks/:id/status | Update status (assignee or creator) |
| DELETE | /tasks/:id | Delete task (creator only) |

## Deployment

### Backend on Railway
1. New Project → Deploy from GitHub → select repo
2. Add PostgreSQL service
3. Set Variables: `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`
4. Root Directory: `backend`, Start Command: `npm start`
5. Run `schema.sql` then `migrate_multi_assignee.sql` in Railway's Console tab

### Frontend on Vercel
1. New Project → Import repo
2. Root Directory: `frontend`
3. Add env var: `VITE_API_URL=https://your-railway-url.railway.app`
4. Deploy

## Security

- Passwords hashed with **bcrypt** (cost factor 12)
- HTTP-only session cookies (not accessible via JS)
- Secure cookie flag in production
- All routes protected by `isAuthenticated` middleware
- Input validated with **express-validator** on every route
- SQL injection prevented via **parameterized queries**
- CORS restricted to frontend origin only
