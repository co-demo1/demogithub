# 🚀 TodoApp - Full-Stack Todo Management Application

A beautiful, modern todo management application built with **Next.js**, **Express.js**, **PostgreSQL**, and **Prisma**. Features a stunning UI with dark mode support, responsive design, and user authentication.

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with Turbopack
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Shadcn** - Accessible UI components

### Backend

- **Express.js** - Node.js web framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Robust relational database
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/nafisnihal/postgres-express-nextjs-nodejs.git
cd postgres-express-nextjs-nodejs
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies (frontend + backend)
npm run install:all
```

### 3. Database Setup

#### Option A: Local PostgreSQL

1. Create a PostgreSQL database named `todoapp`
2. Copy the backend environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Update `backend/.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/todoapp"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=5000
   ```

#### Option B: Cloud Database (Recommended)

Use services like [Supabase](https://supabase.com/), [PlanetScale](https://planetscale.com/), or [Neon](https://neon.tech/) for easy setup.

### 4. Database Migration

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Development Servers

From the root directory:

```bash
npm run start:dev
```

## 📝 Available Scripts

### Root Directory Scripts

```bash
# Start both frontend and backend in development mode
npm run start:dev

# Install dependencies for all projects
npm run install:all

# Build the frontend for production
npm run build

# Start production servers
npm run start
```

### Frontend Scripts (from /frontend directory)

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Backend Scripts (from /backend directory)

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 🏗️ Project Structure

```
fullstack-todo-app/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # Next.js 13+ app directory
│   │   ├── login/           # Login page
│   │   ├── layout.js        # Root layout with header
│   │   ├── page.js          # Home page
│   │   └── globals.css      # Global styles
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── layout/          # Layout components
│   │   └── TodoApp.jsx      # Main todo component
│   └── lib/                 # Utility functions
├── backend/                 # Express.js backend application
│   ├── routes/              # API routes
│   │   ├── todos.js         # Todo CRUD operations
│   │   └── users.js         # User authentication
│   ├── middleware/          # Custom middleware
│   ├── prisma/              # Database schema and migrations
│   ├── utils/               # Utility functions
│   └── index.js             # Main server file
└── package.json             # Root package.json for scripts
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
DATABASE_URL="postgresql://username:password@localhost:5432/todoapp"
JWT_SECRET="your-super-secret-jwt-key-make-it-long-and-random"
PORT=5000
```

## 🚦 API Endpoints

### Authentication

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user

### Todos

- `GET /api/todos` - Get user's todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

### Todo due dates

Todos include `dueDate`: a calendar date string (`YYYY-MM-DD`) or `null`.
Dates have no time or timezone. Past dates are allowed.

- `POST /api/todos`: send `{ "title": "Pay rent", "dueDate": "2026-12-01" }`.
  Omit `dueDate` or send `null` for no due date.
- `PUT /api/todos/:id`: send `{ "dueDate": "2026-12-02" }` to set or change it.
  Send `{ "dueDate": null }` to clear it. Omit the field to keep its current value.
- Create, list, and update responses include `dueDate` in the same format.
- Invalid dates, timestamps, empty strings, and non-string values return HTTP 400
  with `{ "error": "dueDate must be a valid YYYY-MM-DD date or null" }`.
  The supported year range is 0001–9999.
- All todo routes require a bearer token. Updating another user's todo returns 404.

Deploy the backend migration before the web app:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

The migration adds a nullable column. Existing todos keep `dueDate: null`.
In the web app, use the date picker beside a todo and select **Save date**.
Use **Clear date** to remove it.

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Issues

1. Verify PostgreSQL is running
2. Check database credentials in `.env`
3. Ensure database exists
4. Run migrations: `npx prisma migrate dev`

#### Prisma Issues

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (⚠️ This will delete all data)
npx prisma migrate reset
```
