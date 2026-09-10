import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://127.0.0.1:8000'

function Profile() {
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('access_token')

    if (!token || !storedUser) {
      navigate('/login')
      return
    }

    const parsedUser = JSON.parse(storedUser)

    setUser(parsedUser)
    setName(parsedUser.name)
    setEmail(parsedUser.email)
  }, [navigate])

  const handleEdit = () => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsEditing(false)
  }

  const handleSave = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!name.trim()) {
      setErrorMessage('Please enter your name.')
      return
    }

    if (!email.trim()) {
      setErrorMessage('Please enter your email.')
      return
    }

    const token = localStorage.getItem('access_token')

    if (!token) {
      navigate('/login')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`${API_URL}/me`, {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        navigate('/login')
        return
      }

      if (!response.ok) {
        throw new Error(
          data.detail || 'Unable to update profile.'
        )
      }

      setUser(data.user)
      setName(data.user.name)
      setEmail(data.user.email)

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      )

      setIsEditing(false)
      setSuccessMessage(
        'Profile updated successfully.'
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update profile.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-xl">
          <p className="text-gray-600">
            Loading profile...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl">

        <h1 className="text-3xl font-bold text-gray-900">
          Profile
        </h1>

        <p className="mt-2 text-gray-600">
          Manage your Smart Civic account.
        </p>

        {successMessage && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">

          {!isEditing ? (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Name
                </p>

                <p className="mt-1 text-lg text-gray-900">
                  {user.name}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-gray-500">
                  Email
                </p>

                <p className="mt-1 text-lg text-gray-900">
                  {user.email}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-gray-500">
                  Account Type
                </p>

                <p className="mt-1 text-lg text-gray-900">
                  {user.role === 'citizen'
                    ? 'Citizen'
                    : user.role}
                </p>
              </div>

              <button
                type="button"
                onClick={handleEdit}
                className="mt-8 w-full rounded-lg border border-blue-700 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-50"
              >
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-gray-500">
                  Account Type
                </p>

                <p className="mt-1 text-lg text-gray-900">
                  {user.role === 'citizen'
                    ? 'Citizen'
                    : user.role}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="mt-8 w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
              >
                {isSaving
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="mt-3 w-full rounded-lg border border-gray-400 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </>
          )}

        </div>

      </div>
    </main>
  )
}

export default Profile