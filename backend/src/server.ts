
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { prisma } from './lib/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  authenticateToken,
  requireAdmin,
} from './middleware/auth.js'

dotenv.config()

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured in the .env file')
}

const app = express()
const PORT = Number(process.env.PORT) || 5001
const JWT_SECRET = process.env.JWT_SECRET!

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      ['http://localhost:5173', 'http://localhost:5174'],
  }),
)
app.use(express.json())

// Register a new student
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      res.status(400).json({
        error:
          'Name, valid email, and a password of at least 8 characters are required',
      })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'STUDENT',
      },
    })

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' },
    )

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      res.status(409).json({
        error: 'An account with this email already exists',
      })
      return
    }

    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login an existing student
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      res.status(400).json({
        error: 'Email and password are required',
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password,
    )

    if (!passwordMatches) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' },
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'LearnSpace API is running',
  })
})

// Get the currently authenticated user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ user })
  } catch (error) {
    console.error('Current-user error:', error)
    res.status(500).json({
      error: 'Failed to fetch current user',
    })
  }
})


/* Update the logged-in user's profile */
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const name =
      typeof req.body.name === 'string' ? req.body.name.trim() : ''

    if (!name) {
      res.status(400).json({ error: 'Name is required.' })
      return
    }

    if (name.length > 100) {
      res.status(400).json({
        error: 'Name must be 100 characters or fewer.',
      })
      return
    }
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' })
      return
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    res.json({
      message: 'Profile updated successfully.',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ error: 'Could not update profile.' })
  }
})


// Get a user's enrollments
app.get(
  '/api/users/:userId/enrollments',
  authenticateToken,
  async (req, res) => {
    try {
      const requestedUserId = Number(req.params.userId)

      if (!Number.isInteger(requestedUserId) || requestedUserId < 1) {
        res.status(400).json({ error: 'Invalid user ID' })
        return
      }

      // Students can only view their own enrollments.
      // Admins can view enrollments for any user.
      if (
        req.user!.role !== 'ADMIN' &&
        req.user!.userId !== requestedUserId
      ) {
        res.status(403).json({
          error: 'You can only view your own enrollments',
        })
        return
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { userId: requestedUserId },
        include: { course: true },
        orderBy: { enrolledAt: 'desc' },
      })

      res.json(enrollments)
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      res.status(500).json({
        error: 'Failed to fetch enrollments',
      })
    }
  },
)

// Enroll the authenticated user in a course
app.post('/api/enrollments', authenticateToken, async (req, res) => {
  try {
    // Use the authenticated user's ID, never a client-supplied userId.
    const userId = req.user!.userId
    const courseId = Number(req.body.courseId)

    if (!Number.isInteger(courseId) || courseId < 1) {
      res.status(400).json({
        error: 'A valid courseId is required',
      })
      return
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId },
      include: { course: true },
    })

    res.status(201).json(enrollment)
  } catch (error) {
    console.error('Error creating enrollment:', error)

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      res.status(409).json({
        error: 'You are already enrolled in this course',
      })
      return
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2003'
    ) {
      res.status(404).json({
        error: 'Course or user not found',
      })
      return
    }

    res.status(500).json({
      error: 'Failed to enroll in course',
    })
  }
})


 // Update progress for the authenticated student's enrollment
app.patch(
  '/api/enrollments/:courseId/progress',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user!.userId
      const courseId = Number(req.params.courseId)
      const progress = req.body.progress

      if (!Number.isInteger(courseId) || courseId < 1) {
        res.status(400).json({ error: 'Invalid course ID' })
        return
      }

      if (
        typeof progress !== 'number' ||
        !Number.isInteger(progress) ||
        progress < 0 ||
        progress > 100
      ) {
        res.status(400).json({
          error: 'Progress must be a whole number from 0 to 100',
        })
        return
      }

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      })

      if (!enrollment) {
        res.status(404).json({
          error: 'You are not enrolled in this course',
        })
        return
      }

      const updatedEnrollment = await prisma.enrollment.update({
        where: {
          userId_courseId: { userId, courseId },
        },
        data: { progress },
        include: { course: true },
      })

      res.json({
        message: 'Course progress updated successfully',
        enrollment: updatedEnrollment,
      })
    } catch (error) {
      console.error('Error updating course progress:', error)
      res.status(500).json({
        error: 'Failed to update course progress',
      })
    }
  },
)




// Get all courses (public)
app.get('/api/courses', async (_req, res) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
    })

    res.json(courses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    res.status(500).json({
      error: 'Failed to fetch courses',
    })
  }
})

// Create a course (admins only)
app.post(
  '/api/courses',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { title, description, instructor, category } = req.body

      if (
        typeof title !== 'string' ||
        !title.trim() ||
        typeof description !== 'string' ||
        !description.trim() ||
        typeof instructor !== 'string' ||
        !instructor.trim() ||
        typeof category !== 'string' ||
        !category.trim()
      ) {
        res.status(400).json({
          error:
            'Title, description, instructor, and category are required',
        })
        return
      }

      const course = await prisma.course.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          instructor: instructor.trim(),
          category: category.trim(),
        },
      })

      res.status(201).json(course)
    } catch (error) {
      console.error('Error creating course:', error)
      res.status(500).json({
        error: 'Failed to create course',
      })
    }
  },
)


/* Update a course (admins only) */
app.put(
  '/api/courses/:id',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const courseId = Number(req.params.id)
      const { title, description, instructor, category } = req.body

      if (!Number.isInteger(courseId) || courseId < 1) {
        res.status(400).json({ error: 'Invalid course ID' })
        return
      }

      if (
        typeof title !== 'string' || !title.trim() ||
        typeof description !== 'string' || !description.trim() ||
        typeof instructor !== 'string' || !instructor.trim() ||
        typeof category !== 'string' || !category.trim()
      ) {
        res.status(400).json({
          error: 'Title, description, instructor, and category are required',
        })
        return
      }

      const course = await prisma.course.update({
        where: { id: courseId },
        data: {
          title: title.trim(),
          description: description.trim(),
          instructor: instructor.trim(),
          category: category.trim(),
        },
      })

      res.json({
        message: 'Course updated successfully',
        course,
      })
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        res.status(404).json({ error: 'Course not found' })
        return
      }

      console.error('Error updating course:', error)
      res.status(500).json({ error: 'Failed to update course' })
    }
  },
)

/* Delete a course (admins only) */
app.delete(
  '/api/courses/:id',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const courseId = Number(req.params.id)

      if (!Number.isInteger(courseId) || courseId < 1) {
        res.status(400).json({ error: 'Invalid course ID' })
        return
      }

      await prisma.course.delete({
        where: { id: courseId },
      })

      res.json({ message: 'Course deleted successfully' })
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        res.status(404).json({ error: 'Course not found' })
        return
      }

      console.error('Error deleting course:', error)
      res.status(500).json({ error: 'Failed to delete course' })
    }
  },
)


app.listen(PORT, () => {
  console.log(`LearnSpace API running on port ${PORT}`)
})
