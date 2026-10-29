# LearnSpace – Online Course Management System

LearnSpace is a full-stack online course management system built as part of the **Cognevance Full Stack Development – Task 2**. It provides a platform where students can explore courses, enroll in them, track their learning progress, and manage their profiles. Administrators can manage courses through a dedicated dashboard.

## Features

- **User Authentication:** Student registration and login using JWT authentication and bcrypt password hashing.
- **Role-Based Access Control:** Separate permissions for students and administrators.
- **Course Management:** Administrators can create, update, and delete courses.
- **Course Discovery:** Browse, search, and filter available courses.
- **Course Enrollment:** Students can enroll in courses and view their enrolled courses.
- **Progress Tracking:** Track course completion progress from 0% to 100%.
- **User Profile:** View and update profile information.
- **Student Dashboard:** View enrolled courses, completed courses, and learning progress.
- **Admin Dashboard:** Manage courses and course information.
- **Responsive UI:** User-friendly interface with dark and light themes.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- Node.js
- Express.js
- TypeScript
- JWT
- bcryptjs

### Database
- PostgreSQL
- Prisma ORM

## Project Structure

```text
LearnSpace/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── lib/
│   │   ├── middleware/
│   │   └── server.ts
│   ├── package.json
│   └── prisma7.config.ts
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.css
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/MohdMasiUddin/LearnSpace.git
cd LearnSpace
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/learnspace"
JWT_SECRET="YOUR_LONG_RANDOM_SECRET"
PORT=5001
```

Replace the database username and password with your local PostgreSQL credentials. Use a strong, randomly generated JWT secret.

Create the `learnspace` database in PostgreSQL if it does not already exist.

Apply the database migrations and generate the Prisma Client:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start the backend development server:

```bash
npm run dev
```

The backend API will run at `http://localhost:5001`.

Health check endpoint:

`http://localhost:5001/api/health`

### 3. Set Up the Frontend

Open a new terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed in the terminal, usually `http://localhost:5173`.

## API Endpoints

The backend exposes the following REST API endpoints.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check API status |
| POST | `/api/auth/register` | Register a student |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the authenticated user |
| PUT | `/api/auth/profile` | Update profile information |
| GET | `/api/courses` | Get available courses |
| POST | `/api/courses` | Create a course (admin only) |
| PUT | `/api/courses/:id` | Update a course (admin only) |
| DELETE | `/api/courses/:id` | Delete a course (admin only) |
| POST | `/api/enrollments` | Enroll in a course |
| GET | `/api/users/:userId/enrollments` | Get a user's enrollments |
| PATCH | `/api/enrollments/:courseId/progress` | Update course progress |

Protected endpoints require a valid JWT access token. Administrative endpoints require an authenticated administrator.

## Database Schema

LearnSpace uses PostgreSQL with Prisma ORM and includes three primary models:

- **User:** Stores user details, password hash, role, and account creation date.
- **Course:** Stores course title, description, instructor, category, and creation date.
- **Enrollment:** Connects users with courses and stores enrollment date and progress.

The schema defines relationships between users, courses, and enrollments, with a unique constraint preventing duplicate enrollments for the same user and course.

## Build and Validation

Build the backend:

```bash
cd backend
npm run build
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Project Links

- **GitHub Repository:** https://github.com/MohdMasiUddin/LearnSpace
- **Live Demo:** To be added after deployment.
- **Screenshots:** To be added.

## Security Notes

- Never commit `.env` files or