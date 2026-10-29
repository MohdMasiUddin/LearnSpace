# LearnSpace API Documentation

LearnSpace provides REST APIs for authentication, user profiles, course management, enrollment, and learning progress tracking.

## Base URL

```text
http://localhost:5001/api
```

## Authentication

Protected endpoints require a JWT access token returned by the login or registration endpoint.

Include the token in the request header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 1. Health Check

**GET** `/health`

Checks whether the API server is running.

**Example response**

```json
{
  "status": "ok",
  "message": "LearnSpace API running"
}
```

### 2. Register a Student

**POST** `/auth/register`

Creates a new student account.

**Request body**

```json
{
  "name": "Example Student",
  "email": "student@example.com",
  "password": "StrongPass123"
}
```

The password must contain at least eight characters.

**Success response:** Returns the newly created user and an access token.

**Common errors:** `400` for invalid input, `409` if the email is already registered, and `500` for an unexpected server error.

### 3. Log In

**POST** `/auth/login`

Authenticates an existing user.

**Request body**

```json
{
  "email": "student@example.com",
  "password": "StrongPass123"
}
```

**Success response:** Returns the authenticated user and a JWT access token.

**Common errors:** `400` for invalid input and `401` for invalid credentials.

### 4. Get Current User

**GET** `/auth/me`

Requires authentication.

Returns the profile of the currently authenticated user.

**Success response:** User ID, name, email, role, and account creation date.

### 5. Update Profile

**PUT** `/auth/profile`

Requires authentication.

Updates the name of the currently authenticated user.

**Request body**

```json
{
  "name": "Updated Student Name"
}
```

The name must not be empty and must not exceed 100 characters.

**Success response:** Returns the updated profile.

### 6. List Courses

**GET** `/courses`

Returns the available courses.

No authentication is required.

**Success response:** An array of courses containing fields such as ID, title, description, instructor, category, and creation date.

### 7. Create a Course

**POST** `/courses`

Requires an authenticated administrator.

**Request body**

```json
{
  "title": "Full Stack Web Development",
  "description": "Learn modern web application development.",
  "instructor": "LearnSpace Team",
  "category": "Development"
}
```

**Success response:** Returns the newly created course.

**Common errors:** `400` for invalid input and `403` if the user does not have administrator permissions.

### 8. Update a Course

**PUT** `/courses/:id`

Requires an authenticated administrator.

Replace `:id` with the course ID.

**Request body**

```json
{
  "title": "Advanced Full Stack Development",
  "description": "Build and maintain full-stack applications.",
  "instructor": "LearnSpace Team",
  "category": "Development"
}
```

**Success response:** Returns the updated course.

### 9. Delete a Course

**DELETE** `/courses/:id`

Requires an authenticated administrator.

Replace `:id` with the course ID.

**Success response:** Confirms deletion of the course. Associated enrollment records are deleted through the configured database relationship.

### 10. Enroll in a Course

**POST** `/enrollments`

Requires authentication.

The authenticated user is enrolled in the specified course.

**Request body**

```json
{
  "courseId": 1
}
```

**Success response:** Returns the created enrollment.

**Common errors:** `400` for invalid input, `404` if the course does not exist, and `409` if the user is already enrolled.

### 11. Get User Enrollments

**GET** `/users/:userId/enrollments`

Requires authentication.

Returns enrollments for the specified user, including related course information.

Students can access their own enrollments; administrators can access enrollments for other users.

Replace `:userId` with the relevant user ID.

### 12. Update Course Progress

**PATCH** `/enrollments/:courseId/progress`

Requires authentication.

Updates the progress of the authenticated user's enrollment in the specified course.

**Request body**

```json
{
  "progress": 50
}
```

The progress value must be an integer between `0` and `100`, inclusive.

**Success response:** Returns the updated enrollment.

## Authorization Summary

| Endpoint group | Access |
|---|---|
| Health check | Public |
| Register and login | Public |
| List courses | Public |
| Current user and profile | Authenticated users |
| Enrollment and progress | Authenticated users |
| Create, update, and delete courses | Administrators only |

## Notes

- The development API runs on port `5001` by default.
- JWT tokens expire after one hour.
- Passwords are hashed before being stored.
- Protected endpoints require a valid access token.
- This documentation describes the development API. Update the base URL after deployment.
