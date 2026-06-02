# Team Task Manager

A full-stack team task management web app built with React, Node.js/Express, PostgreSQL, and PassportJS session authentication.

## Features

- **Authentication** — Register/login with bcrypt passwords, PassportJS local strategy, HTTP-only session cookies
- **Teams** — Create teams, add/remove members by email, role-based access (only creators can delete teams/manage members)
- **Tasks** — Create, assign, update, delete tasks within teams; filter by team, status, assignee; full-text search
- **Security** — All non-auth routes protected by auth middleware; input validated with express-validator; no plaintext passwords; sessions stored in PostgreSQL (production)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Auth | PassportJS (local), express-session |
| Database | PostgreSQL |
| Validation | express-validator |
| Session Store | connect-pg-simple (prod) / memory (dev) |

## Project Structure

```
/
├── backend/
│   ├── config/passport.js     # Passport local strategy
│   ├── db/
│   │   ├── pool.js            # PostgreSQL connection pool
│   │   └── schema.sql         # DB init script
│   ├── middleware/auth.js     # isAuthenticated guard
│   ├── routes/
│   │   ├── auth.js            # POST /auth/register, /auth/login, /auth/logout, GET /auth/me
│   │   ├── teams.js           # CRUD /teams + /teams/:id/members
│   │   └── tasks.js           # CRUD /tasks with filtering
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── context/AuthContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   └── TeamDetailPage.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── TaskCard.jsx
    │   │   ├── TaskModal.jsx
    │   │   └── TeamModal.jsx
    │   ├── api.js
    │   └── main.jsx
    └── package.json
```

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/Secure-Task-Management-System.git
cd Secure-Task-Management-System
```

### 2. Set up the database
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE teamtaskdb;"

# Run schema
psql -U postgres -d teamtaskdb -f backend/db/schema.sql
```

### 3. Configure backend environment
```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials and a strong SESSION_SECRET
```

`.env` values:
```
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/teamtaskdb
SESSION_SECRET=change_this_to_a_long_random_string
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 4. Install and run backend
```bash
cd backend
npm install
npm run dev
# Server starts on http://localhost:5000
```

### 5. Install and run frontend
```bash
cd frontend
npm install
npm run dev
# App starts on http://localhost:5173
```

## API Endpoints

### Auth (`/auth`)
| Method | Path | Description |
|---|---|---|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| POST | /auth/logout | Logout |
| GET | /auth/me | Get current user |

### Teams (`/teams`) — all protected
| Method | Path | Description |
|---|---|---|
| GET | /teams | List my teams |
| POST | /teams | Create team |
| GET | /teams/:id | Team + members |
| PUT | /teams/:id | Update team (creator only) |
| DELETE | /teams/:id | Delete team (creator only) |
| POST | /teams/:id/members | Add member by email (creator only) |
| DELETE | /teams/:id/members/:userId | Remove member (creator only) |

### Tasks (`/tasks`) — all protected
| Method | Path | Description |
|---|---|---|
| GET | /tasks | List tasks (supports `?team_id`, `?assigned_to`, `?status`, `?search`) |
| POST | /tasks | Create task |
| GET | /tasks/:id | Single task |
| PUT | /tasks/:id | Update task |
| DELETE | /tasks/:id | Delete task (creator or team creator) |

## Deployment (Free — Railway + Vercel)

### Backend + PostgreSQL on Railway (Free tier)

1. Go to [railway.app](https://railway.app) → sign up with GitHub
2. **New Project** → **Deploy from GitHub repo** → select this repo
3. Add a **PostgreSQL** service to the project (Railway provides free PostgreSQL)
4. Go to your web service **Variables** and add:
   ```
   DATABASE_URL=<copy from Railway PostgreSQL → Connect → DATABASE_URL>
   SESSION_SECRET=your_long_random_secret_here
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-app.vercel.app
   PORT=5000
   ```
5. Set **Root Directory** to `backend` and **Start Command** to `npm start`
6. After deploy, run the schema: Railway → PostgreSQL → **Query** tab → paste contents of `backend/db/schema.sql` and run

### Frontend on Vercel (Free tier)

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub
2. **New Project** → Import this repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app
   ```
5. Deploy — Vercel auto-detects Vite

### After deploying:
- Update Railway backend `FRONTEND_URL` with your Vercel URL
- Update Vercel `VITE_API_URL` with your Railway URL

## Security Practices

- Passwords hashed with **bcrypt** (cost factor 12) — never stored in plaintext
- Sessions stored server-side with **HTTP-only cookies** (not accessible via JavaScript)
- **Secure** cookie flag enabled in production
- All non-auth routes protected by `isAuthenticated` middleware
- Input validated and sanitized with **express-validator** on every route
- SQL injection prevented via **parameterized queries** (no string interpolation)
- Role-based access: only team **creators** can delete teams or manage members
- CORS configured to only allow the frontend origin

## Bonus Features Implemented

- **Task due date reminders** — overdue tasks highlighted in red on dashboard
- **Role-based access** — only team creators can delete teams and manage members
- **Invite by email** — add members by entering their registered email address
