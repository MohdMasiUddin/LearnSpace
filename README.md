# LearnSpace – Online Course Management System

LearnSpace is a full-stack online course management platform developed as part of the **Cognevance Full Stack Web Developer Assessment – Task 2**.

It provides separate student and administrator dashboards, allowing students to explore courses, enroll in them, and track their learning progress while administrators manage courses and users.

## Live Demo

**Website:** https://learn-space-umber.vercel.app

**GitHub Repository:** https://github.com/MohdMasiUddin/LearnSpace

## Features

### Student Features
- Student registration and login.
- Browse available courses.
- Search and filter courses by category.
- Enroll in courses.
- Track course completion progress.
- Update profile information.

### Admin Features
- Secure administrator login.
- Admin dashboard.
- Create, update, and delete courses.
- Manage course information.
- Role-based access control.

### General Features
- Responsive user interface.
- JWT-based authentication.
- Password hashing.
- RESTful API integration.
- PostgreSQL database.
- Form validation and error handling.
- Dark and light mode.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, bcryptjs |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Database Hosting | Neon |

## Project Structure

```text
LearnSpace/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   └── package.json
│
├── API_DOCUMENTATION.md
├── README.md
└── .gitignore
```

## Local Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MohdMasiUddin/LearnSpace.git
cd LearnSpace
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Configure your backend `.env` file with your local PostgreSQL database connection and JWT secret.

Then run:

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

The backend runs at:

`http://localhost:5001`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Configure `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001/api
```

Start the frontend:

```bash
npm run dev
```

The frontend runs at:

`http://localhost:5173`

## API Documentation

Detailed API endpoints, request formats, and response examples are available in:

[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Database Schema

The application uses PostgreSQL with Prisma ORM.

Main database models:
- **User:** Stores user information, authentication details, and roles.
- **Course:** Stores course details, descriptions, instructors, and categories.
- **Enrollment:** Stores student enrollments and course progress.

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon PostgreSQL |

## Screenshots

### Login Page
![Login](docs/screenshots/login.png)

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

### Course Listing
![Courses](docs/screenshots/courses.png)

### Student Dashboard
![Student Dashboard](docs/screenshots/student-dashboard.png)

### Course Progress
![Course Progress](docs/screenshots/course-progress.png)

## Security

- Passwords are hashed using bcryptjs.
- JWT authentication protects private API routes.
- Role-based authorization restricts administrator operations.
- Environment variables are used for sensitive configuration.
- Database credentials and secrets are excluded from version control.

## Author

**Mohd Masi Uddin**

Full Stack Web Developer – Aspiring

---

Developed as part of the Cognevance Full Stack Web Developer Assessment.
