# Team Task Manager

A full-stack web application for managing teams and tasks with role-based access control.

## Features

- **Authentication** — Secure register/login with bcrypt password hashing and session-based auth (HTTP-only cookies)
- **Teams** — Create teams, invite members by email, manage roles
- **Tasks** — Create and assign tasks to one or multiple team members, track status and priority
- **Role-based access** — Only team creators can create/edit/delete tasks; assignees can update their task status
- **Due date reminders** — Dashboard alerts for overdue tasks, tasks due today, and tasks due within 2 days
- **Responsive UI** — Works on desktop and mobile

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Auth:** Passport.js (local strategy), express-session
- **Validation:** express-validator
- **Deployment:** Railway (backend + database), Vercel (frontend)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repository
```bash
git clone https://github.com/codewithsyedabdullah/Secure-Task-Management-System.git
cd Secure-Task-Management-System
```

### 2. Set up the database
```bash
psql -U postgres -c "CREATE DATABASE teamtaskdb;"
psql -U postgres -d teamtaskdb -f backend/db/schema.sql
```

### 3. Configure the backend
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/teamtaskdb
SESSION_SECRET=your_long_random_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 4. Run the backend
```bash
cd backend
npm install
npm run dev
```

### 5. Run the frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register a new user |
| POST | /auth/login | Login |
| POST | /auth/logout | Logout |
| GET | /auth/me | Get current user |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /teams | List my teams |
| POST | /teams | Create a team |
| GET | /teams/:id | Get team with members |
| PUT | /teams/:id | Update team (creator only) |
| DELETE | /teams/:id | Delete team (creator only) |
| POST | /teams/:id/members | Add member by email |
| DELETE | /teams/:id/members/:userId | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tasks | List tasks (supports ?team_id, ?assigned_to, ?status, ?search) |
| POST | /tasks | Create task (creator only) |
| GET | /tasks/:id | Get task |
| PUT | /tasks/:id | Update task (creator only) |
| PUT | /tasks/:id/status | Update status (assignee or creator) |
| DELETE | /tasks/:id | Delete task (creator only) |

## Deployment

### Backend — Railway
1. Connect your GitHub repo on [railway.app](https://railway.app)
2. Add a PostgreSQL service
3. Set environment variables (DATABASE_URL, SESSION_SECRET, NODE_ENV=production, FRONTEND_URL)
4. Set root directory to `backend`, start command to `npm start`
5. Run the schema SQL in Railway's PostgreSQL query tab

### Frontend — Vercel
1. Import the repo on [vercel.com](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL` (leave empty — proxy handles it)
4. Deploy

## Security
- Passwords hashed with bcrypt (cost factor 12)
- Sessions stored server-side with HTTP-only, Secure cookies
- All routes protected by authentication middleware
- Input validation and sanitization on all endpoints
- Parameterized SQL queries (no SQL injection)
- Role-based access control on all team and task operations
