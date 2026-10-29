
import { useEffect, useMemo, useState } from 'react'

type Course = {
  id: number
  title: string
  description: string
  instructor: string
  category: string
  createdAt: string
}

type Enrollment = {
  id: number
  userId: number
  courseId: number
  progress: number
  enrolledAt: string
  course: Course
}

type User = {
  id: number
  name: string
  email: string
  role: 'STUDENT' | 'ADMIN'
  createdAt?: string
}

type AuthResponse = {
  message?: string
  token?: string
  user?: User
  error?: string
}

const API_URL = 'http://localhost:5001/api'
const TOKEN_KEY = 'learnspace_token'

const categoryColors: Record<string, string> = {
  Development: 'bg-blue-100',
  Design: 'bg-pink-100',
  Data: 'bg-amber-100',
}

function App() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [user, setUser] = useState<User | null>(null)
const [token, setToken] = useState<string | null>(
  () => localStorage.getItem(TOKEN_KEY),
)
const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
const [authName, setAuthName] = useState('')
const [authEmail, setAuthEmail] = useState('')
const [authPassword, setAuthPassword] = useState('')
const [authLoading, setAuthLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolled, setEnrolled] = useState<number[]>([])
  const [progressByCourse, setProgressByCourse] = useState<Record<number, number>>({})
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrollingId, setEnrollingId] = useState<number | null>(null)
  const [success, setSuccess] = useState('')

  // Automatically dismiss success notifications after a short delay.
  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => setSuccess(''), 4000)
    return () => window.clearTimeout(timer)
  }, [success])
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null)
const [courseActionLoading, setCourseActionLoading] = useState(false)
const [profileName, setProfileName] = useState('')
const [profileLoading, setProfileLoading] = useState(false)
const [darkMode, setDarkMode] = useState<boolean>(
  () => localStorage.getItem('learnspace_theme') === 'dark',
)

useEffect(() => {
  localStorage.setItem('learnspace_theme', darkMode ? 'dark' : 'light')
}, [darkMode])

useEffect(() => {
  setProfileName(user?.name ?? '')
}, [user?.name])


useEffect(() => {
  let cancelled = false

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const coursesResponse = await fetch(`${API_URL}/courses`)

      if (!coursesResponse.ok) {
        throw new Error('Could not load courses.')
      }

      const courseData: Course[] = await coursesResponse.json()

      if (cancelled) return
      setCourses(courseData)

      if (!token) {
        setUser(null)
        setUserId(null)
        setEnrolled([])
        setProgressByCourse({})
        return
      }

      const userResponse = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!userResponse.ok) {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
        setUserId(null)
        setEnrolled([])
        setProgressByCourse({})
        return
      }

      const userResult: { user: User } = await userResponse.json()

      if (cancelled) return

      setUser(userResult.user)
      setUserId(userResult.user.id)

      const enrollmentResponse = await fetch(
        `${API_URL}/users/${userResult.user.id}/enrollments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!enrollmentResponse.ok) {
        throw new Error('Could not load your saved enrollments.')
      }

      const enrollmentData: Enrollment[] =
        await enrollmentResponse.json()

      if (cancelled) return
      setEnrolled(enrollmentData.map((item) => item.courseId))
      setProgressByCourse(
        Object.fromEntries(enrollmentData.map((item) => [item.courseId, item.progress ?? 0])),
      )
    } catch (err) {
      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load LearnSpace data.',
        )
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  void loadData()

  return () => {
    cancelled = true
  }
}, [token])




async function handleAuthentication(
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault()
  setAuthLoading(true)
  setError('')
  setSuccess('')

  try {
    const endpoint =
      authMode === 'register' ? 'register' : 'login'

    const body =
      authMode === 'register'
        ? { name: authName, email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword }

    const response = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const result: AuthResponse = await response.json()

    if (!response.ok || !result.token || !result.user) {
      throw new Error(result.error || 'Authentication failed.')
    }

    localStorage.setItem(TOKEN_KEY, result.token)
    setUser(result.user)
    setToken(result.token)
    setUserId(result.user.id)
    setAuthPassword('')
    setSuccess(
      authMode === 'register'
        ? 'Account created successfully!'
        : 'Login successful!',
    )
  } catch (err) {
    setError(
      err instanceof Error ? err.message : 'Authentication failed.',
    )
  } finally {
    setAuthLoading(false)
  }
}

function handleLogout() {
  localStorage.removeItem(TOKEN_KEY)
  setToken(null)
  setUser(null)
  setUserId(null)
  setEnrolled([])
  setProgressByCourse({})
  setActiveTab('Overview')
  setSuccess('')
  setError('')
}


  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const searchTerm = search.toLowerCase()

        const matchesSearch =
          course.title.toLowerCase().includes(searchTerm) ||
          course.instructor.toLowerCase().includes(searchTerm)

        const matchesCategory =
          category === 'All' || course.category === category

        return matchesSearch && matchesCategory
      }),
    [courses, search, category],
  )

  const myCourses = courses.filter((course) =>
    enrolled.includes(course.id),
  )

  const visibleCourses =
    activeTab === 'My Courses'
      ? filteredCourses.filter((course) => enrolled.includes(course.id))
      : filteredCourses


async function enrollInCourse(courseId: number) {
  if (!token || userId === null || enrollingId !== null) {
    return
  }

  setEnrollingId(courseId)
  setError('')
  setSuccess('')

  try {
    const response = await fetch(`${API_URL}/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ courseId }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Could not enroll in this course.')
    }

    setEnrolled((current) =>
      current.includes(courseId) ? current : [...current, courseId],
    )
    setProgressByCourse((current) => ({ ...current, [courseId]: 0 }))
    setSuccess('Successfully enrolled! Your enrollment is saved.')
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Unable to save your enrollment.',
    )
  } finally {
    setEnrollingId(null)
  }
}



async function updateCourseProgress(courseId: number, progress: number) {
  if (!token) {
    setError('Please log in to update your progress.')
    return
  }

  setError('')
  setSuccess('')

  try {
    const response = await fetch(
      `${API_URL}/enrollments/${courseId}/progress`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ progress }),
      },
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Could not update course progress.')
    }

    setSuccess('Course progress updated successfully.')
    
    // Refresh saved enrollment data from the backend.
    const enrollmentResponse = await fetch(
      `${API_URL}/users/${userId}/enrollments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!enrollmentResponse.ok) {
      throw new Error('Progress was saved, but enrollment data could not be refreshed.')
    }

    const enrollmentData: Enrollment[] = await enrollmentResponse.json()
    setEnrolled(enrollmentData.map((item) => item.courseId))
    setProgressByCourse(
      Object.fromEntries(enrollmentData.map((item) => [item.courseId, item.progress ?? 0])),
    )
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Unable to update course progress.',
    )
  }
}

const editCourse = async (course: Course) => {
  const title = window.prompt('Course title:', course.title)
  if (title === null) return

  const description = window.prompt(
    'Course description:',
    course.description,
  )
  if (description === null) return

  const instructor = window.prompt(
    'Instructor name:',
    course.instructor,
  )
  if (instructor === null) return

  const category = window.prompt('Course category:', course.category)
  if (category === null) return

  if (![title, description, instructor, category].every((value) => value.trim())) {
    setError('All course fields are required.')
    return
  }

  setError('')
  setSuccess('')
  setEditingCourseId(course.id)
  setCourseActionLoading(true)

  try {
    const response = await fetch(`${API_URL}/courses/${course.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      },
      body: JSON.stringify({ title, description, instructor, category }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Could not update course.')
    }

    const coursesResponse = await fetch(`${API_URL}/courses`)
    if (!coursesResponse.ok) {
      throw new Error('Course updated, but refreshing the list failed.')
    }

    const updatedCourses: Course[] = await coursesResponse.json()
    setCourses(updatedCourses)
    setSuccess('Course updated successfully!')
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Could not update course.')
  } finally {
    setEditingCourseId(null)
    setCourseActionLoading(false)
  }
}

const deleteCourse = async (course: Course) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${course.title}"? This also removes its enrollments and progress records.`,
  )

  if (!confirmed) return

  setError('')
  setSuccess('')
  setEditingCourseId(course.id)
  setCourseActionLoading(true)

  try {
    const response = await fetch(`${API_URL}/courses/${course.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      },
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Could not delete course.')
    }

    setCourses((previous) =>
      previous.filter((item) => item.id !== course.id),
    )
    setEnrolled((previous) =>
      previous.filter((id) => id !== course.id),
    )
    setSuccess('Course deleted successfully!')
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Could not delete course.')
  } finally {
    setEditingCourseId(null)
    setCourseActionLoading(false)
  }
}


async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const trimmedName = profileName.trim()

  if (!trimmedName) {
    setError('Name is required.')
    setSuccess('')
    return
  }

  if (trimmedName.length > 100) {
    setError('Name must be 100 characters or fewer.')
    setSuccess('')
    return
  }

  if (!token) {
    setError('Please log in again to update your profile.')
    setSuccess('')
    return
  }

  setProfileLoading(true)
  setError('')
  setSuccess('')

  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: trimmedName }),
    })

    const result: { message?: string; user?: User; error?: string } =
      await response.json()

    if (!response.ok || !result.user) {
      throw new Error(result.error || 'Could not update profile.')
    }

    setUser(result.user)
    setProfileName(result.user.name)
    setSuccess(result.message || 'Profile updated successfully.')
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Could not update profile.')
  } finally {
    setProfileLoading(false)
  }
}

  return (
  !token || !user ? (
    <div data-theme={darkMode ? 'dark' : 'light'} className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <style>{`
        [data-theme="dark"] { background-color: #0f172a !important; color: #f1f5f9 !important; color-scheme: dark; }
        [data-theme="dark"] .bg-slate-50, [data-theme="dark"] .bg-white { background-color: #111827 !important; }
        [data-theme="dark"] .bg-slate-100, [data-theme="dark"] .bg-slate-200 { background-color: #1e293b !important; }
        [data-theme="dark"] .border-slate-200, [data-theme="dark"] .border-slate-300 { border-color: #475569 !important; }
        [data-theme="dark"] .text-slate-900, [data-theme="dark"] .text-slate-800, [data-theme="dark"] .text-slate-700 { color: #f1f5f9 !important; }
        [data-theme="dark"] .text-slate-600, [data-theme="dark"] .text-slate-500, [data-theme="dark"] .text-slate-400 { color: #cbd5e1 !important; }
        [data-theme="dark"] input, [data-theme="dark"] textarea, [data-theme="dark"] select { background-color: #1e293b !important; color: #f8fafc !important; border-color: #64748b !important; }
        [data-theme="dark"] input::placeholder, [data-theme="dark"] textarea::placeholder { color: #cbd5e1 !important; }
        [data-theme="dark"] .bg-indigo-50 { background-color: #312e81 !important; }
        [data-theme="dark"] .text-indigo-700 { color: #c7d2fe !important; }
        [data-theme="dark"] .bg-green-100 { background-color: #14532d !important; }
        [data-theme="dark"] .text-green-800 { color: #dcfce7 !important; }
        [data-theme="dark"] .bg-red-50 { background-color: #450a0a !important; }
        [data-theme="dark"] .text-red-700 { color: #fecaca !important; }
        [data-theme="dark"] .bg-indigo-100 { background-color: #312e81 !important; }
        [data-theme="dark"] .text-indigo-600, [data-theme="dark"] .text-indigo-700 { color: #c7d2fe !important; }
      `}</style>
      <button type="button" onClick={() => setDarkMode((current) => !current)} className="fixed right-5 top-5 z-10 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100">
        {darkMode ? '☀️ Light mode' : '🌙 Dark mode'}
      </button>
      <form
        onSubmit={handleAuthentication}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-3xl font-bold text-indigo-600">LearnSpace</h1>
        <p className="mt-2 text-slate-500">
          Your online learning platform
        </p>

        <h2 className="mt-8 text-xl font-semibold">
          {authMode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>

        {authMode === 'register' && (
          <label className="mt-5 block text-sm font-medium">
            Full name
            <input
              required
              value={authName}
              onChange={(event) => setAuthName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="Your full name"
            />
          </label>
        )}

        <label className="mt-5 block text-sm font-medium">
          Email
          <input
            required
            type="email"
            value={authEmail}
            onChange={(event) => setAuthEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="you@example.com"
          />
        </label>

        <label className="mt-5 block text-sm font-medium">
          Password
          <input
            required
            type="password"
            minLength={authMode === 'register' ? 8 : 1}
            value={authPassword}
            onChange={(event) => setAuthPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder={
              authMode === 'register'
                ? 'At least 8 characters'
                : 'Your password'
            }
          />
        </label>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={authLoading}
          className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {authLoading
            ? 'Please wait...'
            : authMode === 'login'
              ? 'Log In'
              : 'Create Account'}
        </button>

        <p className="mt-5 text-center text-sm text-slate-600">
          {authMode === 'login'
            ? "Don't have an account?"
            : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login')
              setError('')
              setSuccess('')
            }}
            className="font-semibold text-indigo-600 hover:underline"
          >
            {authMode === 'login' ? 'Register' : 'Log in'}
          </button>
        </p>
      </form>
    </div>
  ) : (
    <div data-theme={darkMode ? 'dark' : 'light'} className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        [data-theme="dark"] { background-color: #0f172a !important; color: #f1f5f9 !important; color-scheme: dark; }
        [data-theme="dark"] .bg-slate-50, [data-theme="dark"] .bg-white { background-color: #111827 !important; }
        [data-theme="dark"] .bg-slate-100, [data-theme="dark"] .bg-slate-200 { background-color: #1e293b !important; }
        [data-theme="dark"] .border-slate-200, [data-theme="dark"] .border-slate-300 { border-color: #475569 !important; }
        [data-theme="dark"] .text-slate-900, [data-theme="dark"] .text-slate-800, [data-theme="dark"] .text-slate-700 { color: #f1f5f9 !important; }
        [data-theme="dark"] .text-slate-600, [data-theme="dark"] .text-slate-500, [data-theme="dark"] .text-slate-400 { color: #cbd5e1 !important; }
        [data-theme="dark"] input, [data-theme="dark"] textarea, [data-theme="dark"] select { background-color: #1e293b !important; color: #f8fafc !important; border-color: #64748b !important; }
        [data-theme="dark"] input::placeholder, [data-theme="dark"] textarea::placeholder { color: #cbd5e1 !important; }
        [data-theme="dark"] .bg-indigo-50 { background-color: #312e81 !important; }
        [data-theme="dark"] .text-indigo-700 { color: #c7d2fe !important; }
        [data-theme="dark"] .bg-green-100 { background-color: #14532d !important; }
        [data-theme="dark"] .text-green-800 { color: #dcfce7 !important; }
        [data-theme="dark"] .bg-red-50 { background-color: #450a0a !important; }
        [data-theme="dark"] .text-red-700 { color: #fecaca !important; }
        [data-theme="dark"] .bg-indigo-100 { background-color: #312e81 !important; }
        [data-theme="dark"] .text-indigo-600, [data-theme="dark"] .text-indigo-700 { color: #c7d2fe !important; }
        [data-theme="dark"] .bg-blue-100 { background-color: #1e3a8a !important; }
        [data-theme="dark"] .bg-pink-100 { background-color: #831843 !important; }
        [data-theme="dark"] .bg-amber-100 { background-color: #78350f !important; }
      `}</style>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-6 md:block">
        <h1 className="text-2xl font-bold text-indigo-600">LearnSpace</h1>
        <p className="mt-2 text-sm text-slate-500">
          Online Learning Platform
        </p>

        <nav className="mt-10 space-y-2">
          {['Overview', ...(user.role === 'ADMIN' ? ['Manage Courses'] : ['My Courses']), 'Explore Courses', 'Profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full rounded-xl px-4 py-3 text-left transition ${
                activeTab === tab
                  ? 'bg-indigo-50 font-semibold text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <p className="absolute bottom-6 text-sm text-slate-400">
          Task 2 · Course Management
        </p>
      </aside>

      <main className="p-6 md:ml-64 md:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Welcome back</p>
            <h2 className="mt-1 text-3xl font-bold">
              {activeTab === 'Overview'
                ? user.role === 'ADMIN'
                  ? 'Admin Dashboard'
                  : 'Student Dashboard'
                : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              Hi, {user.name}
            </span>

            <span className="rounded-full bg-indigo-100 px-4 py-2 font-medium text-indigo-700">
              {user.role}
            </span>

            <button
              type="button"
              onClick={() => setDarkMode((current) => !current)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </header>
      
{activeTab === 'Profile' && (
  <section className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-6 flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
        {(user.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || '?')}
      </div>
      <div>
        <h3 className="text-xl font-bold">Your Profile</h3>
        <p className="mt-1 text-sm text-slate-500">View and update your account details.</p>
      </div>
    </div>

    <form className="grid gap-5" onSubmit={saveProfile}>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Full name
        <input
          type="text"
          value={profileName}
          onChange={(event) => setProfileName(event.target.value)}
          maxLength={100}
          required
          autoComplete="name"
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
          placeholder="Enter your name"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Email address
        <input
          type="email"
          value={user.email}
          readOnly
          className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3"
        />
        <span className="text-xs font-normal text-slate-500">Email cannot be changed here.</span>
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Account role
        <input
          type="text"
          value={user.role}
          readOnly
          className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3"
        />
        <span className="text-xs font-normal text-slate-500">Your role is managed securely by the application.</span>
      </label>

      <div className="grid gap-2 text-sm font-medium text-slate-700">
        Account created
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal">
          {user.createdAt
            ? new Date(user.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Creation date unavailable'}
        </div>
      </div>

      <button
        type="submit"
        disabled={profileLoading || profileName.trim() === user.name}
        className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {profileLoading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  </section>
)}

{activeTab === 'Manage Courses' && user.role === 'ADMIN' && (
  <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-xl font-bold">Add a New Course</h3>
    <p className="mt-2 text-slate-600">
      Enter the details below to publish a course on LearnSpace.
    </p>

    <form
      className="mt-6 grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault()
        setError('')
        setSuccess('')

        const form = event.currentTarget
        const formData = new FormData(form)

        try {
          const response = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: formData.get('title'),
              description: formData.get('description'),
              instructor: formData.get('instructor'),
              category: formData.get('category'),
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Could not create course.')
          }

          const coursesResponse = await fetch(`${API_URL}/courses`)
          if (!coursesResponse.ok) {
            throw new Error('Course created, but refreshing the list failed.')
          }

          const updatedCourses: Course[] = await coursesResponse.json()
          setCourses(updatedCourses)
          setSuccess('Course created successfully!')
          form.reset()
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Something went wrong.',
          )
        }
      }}
    >
      <input
        name="title"
        required
        placeholder="Course title"
        className="rounded-xl border border-slate-200 px-4 py-3"
      />

      <textarea
        name="description"
        required
        placeholder="Course description"
        rows={4}
        className="rounded-xl border border-slate-200 px-4 py-3"
      />

      <input
        name="instructor"
        required
        placeholder="Instructor name"
        className="rounded-xl border border-slate-200 px-4 py-3"
      />

      <select
        name="category"
        required
        defaultValue=""
        className="rounded-xl border border-slate-200 px-4 py-3"
      >
        <option value="" disabled>Select category</option>
        <option value="Development">Development</option>
        <option value="Design">Design</option>
        <option value="Data">Data</option>
      </select>

      <button
        type="submit"
        className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
      >
        Add Course
      </button>
    </form>
  </section>
)}

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-6 rounded-xl bg-green-50 p-4 text-green-700">
            {success}
          </p>
        )}

        {activeTab === 'Overview' && (
          <section className="mt-8">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Available Courses',
                  value: courses.length,
                  icon: '📚',
                  description: 'Courses available to explore',
                },
                {
                  label: 'My Enrollments',
                  value: myCourses.length,
                  icon: '🎓',
                  description: 'Courses you have joined',
                },
                {
                  label: 'Completed Courses',
                  value: myCourses.filter(
                    (course) => (progressByCourse[course.id] ?? 0) === 100,
                  ).length,
                  icon: '✅',
                  description: 'Courses completed',
                },
                {
                  label: 'Overall Progress',
                  value: myCourses.length
                    ? `${Math.round(
                        myCourses.reduce(
                          (total, course) =>
                            total + (progressByCourse[course.id] ?? 0),
                          0,
                        ) / myCourses.length,
                      )}%`
                    : '0%',
                  icon: '📈',
                  description: 'Average across your courses',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {stat.label}
                      </p>
                      <p className="mt-3 text-3xl font-bold text-slate-900">
                        {stat.value}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl" aria-hidden="true">
                      {stat.icon}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab !== 'Overview' && (
          <section className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses or instructors..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
              />

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <option value="All">All</option>
                {[...new Set(courses.map((course) => course.category))].map(
                  (item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ),
                )}
              </select>
            </div>

            {loading && (
              <p className="mt-6 text-slate-500">
                Loading courses and enrollments...
              </p>
            )}

            {!loading && !error && visibleCourses.length === 0 && (
              <p className="mt-6 text-slate-500">
                {activeTab === 'My Courses'
                  ? 'You have not enrolled in any courses yet.'
                  : 'No courses found.'}
              </p>
            )}

            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((course) => {
                const isEnrolled = enrolled.includes(course.id)

                return (
                  <article
                    key={course.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div
                      className={`${
                        categoryColors[course.category] ?? 'bg-indigo-100'
                      } flex h-28 items-center justify-center`}
                    >
                      <span className="text-lg font-bold text-slate-700">
                        {course.category}
                      </span>
                    </div>

                    <div className="p-5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        Course
                      </span>

                      <h3 className="mt-2 text-lg font-bold">
                        {course.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        By {course.instructor}
                      </p>

                      <p className="mt-3 text-sm text-slate-600">
                        {course.description}
                      </p>

                      {isEnrolled && (
                        <div className="mt-5">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">Course progress</span>
                            <span className="font-semibold text-indigo-700">
                              {progressByCourse[course.id] ?? 0}%
                            </span>
                          </div>
                          <div
                            className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                            role="progressbar"
                            aria-label={`${course.title} progress`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progressByCourse[course.id] ?? 0}
                          >
                            <div
                              className="h-full rounded-full bg-indigo-600 transition-all"
                              style={{ width: `${progressByCourse[course.id] ?? 0}%` }}
                            />
                          </div>
                          <label className="mt-3 block text-sm text-slate-600">
                            Update progress
                            <select
                              value={progressByCourse[course.id] ?? 0}
                              onChange={(event) =>
                                void updateCourseProgress(course.id, Number(event.target.value))
                              }
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                            >
                              <option value={0}>Not started (0%)</option>
                              <option value={25}>25% complete</option>
                              <option value={50}>50% complete</option>
                              <option value={75}>75% complete</option>
                              <option value={100}>Completed (100%)</option>
                            </select>
                          </label>
                        </div>
                      )}

                      {user.role === 'ADMIN' && (
                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            onClick={() => void editCourse(course)}
                            disabled={courseActionLoading}
                            className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                          >
                            {editingCourseId === course.id ? 'Saving...' : 'Edit'}
                          </button>

                          <button
                            type="button"
                            onClick={() => void deleteCourse(course)}
                            disabled={courseActionLoading}
                            className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {editingCourseId === course.id ? 'Processing...' : 'Delete'}
                          </button>
                        </div>
                      )}

                      <button
                        disabled={
                          isEnrolled || enrollingId !== null || loading
                        }
                        onClick={() => enrollInCourse(course.id)}
                        className={`mt-5 w-full rounded-xl px-4 py-3 font-semibold transition disabled:cursor-not-allowed ${
                          isEnrolled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60'
                        }`}
                      >
                        {isEnrolled
                          ? '✓ Enrolled'
                          : enrollingId === course.id
                            ? 'Enrolling...'
                            : 'Enroll Now'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {activeTab === 'Overview' && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">Welcome to LearnSpace</h3>
            <p className="mt-2 text-slate-600">
              Explore courses, manage your enrollments, and continue
              building your skills.
            </p>
            <button
              onClick={() => setActiveTab('Explore Courses')}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Explore Courses
            </button>
          </section>
        )}
      </main>
    </div>
  )
)
}

export default App
