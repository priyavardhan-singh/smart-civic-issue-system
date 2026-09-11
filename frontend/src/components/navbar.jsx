import { useEffect, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false)

  const [user, setUser] =
    useState(null)

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser =
      localStorage.getItem('user')

    if (storedUser) {
      setUser(
        JSON.parse(storedUser)
      )
    } else {
      setUser(null)
    }
  }, [location])

  const handleLogout = () => {
    localStorage.removeItem(
      'access_token'
    )

    localStorage.removeItem(
      'user'
    )

    setUser(null)
    setIsMenuOpen(false)

    navigate('/login')
  }

  const isAdmin =
    user?.role === 'admin'

  return (
    <nav className="border-b bg-white px-6 py-4">

      <div className="mx-auto flex max-w-7xl items-center justify-between">

        {/* LOGO */}

        <Link
          to={isAdmin ? '/admin' : '/'}
          className="text-2xl font-bold text-blue-700"
        >
          {isAdmin
            ? 'Smart Civic Admin'
            : 'Smart Civic'}
        </Link>

        {/* DESKTOP NAVIGATION */}

        <div className="hidden items-center gap-6 md:flex">

          {isAdmin ? (
            <>
              <Link
  to="/admin"
  className="text-gray-700 hover:text-blue-700"
>
  Dashboard
</Link>

<Link
  to="/admin/manage"
  className="text-gray-700 hover:text-blue-700"
>
  Departments & Officers
</Link>

<Link
  to="/profile"
  className="text-gray-700 hover:text-blue-700"
>
  Profile
</Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-700"
              >
                Home
              </Link>

              <Link
                to="/report"
                className="text-gray-700 hover:text-blue-700"
              >
                Report Issue
              </Link>

              <Link
                to="/my-reports"
                className="text-gray-700 hover:text-blue-700"
              >
                My Reports
              </Link>

              {user && (
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-blue-700"
                >
                  Profile
                </Link>
              )}
            </>
          )}

        </div>

        {/* AUTHENTICATION */}

        <div className="hidden items-center gap-3 md:flex">

          {user ? (
            <>
              <span className="text-sm font-medium text-gray-700">
                {user.name}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-5 py-2 text-white transition hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg bg-blue-700 px-5 py-2 text-white transition hover:bg-blue-800"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg border border-blue-700 px-5 py-2 text-blue-700 transition hover:bg-blue-50"
              >
                Register
              </Link>
            </>
          )}

        </div>

        {/* MOBILE BUTTON */}

        <button
          type="button"
          className="text-2xl md:hidden"
          onClick={() =>
            setIsMenuOpen(
              !isMenuOpen
            )
          }
        >
          ☰
        </button>

      </div>

      {/* MOBILE NAVIGATION */}

      {isMenuOpen && (
        <div className="mt-4 flex flex-col gap-4 border-t pt-4 md:hidden">

          {isAdmin ? (
            <>
              <Link
                to="/admin"
                onClick={() =>
                  setIsMenuOpen(false)
                }
                className="text-gray-700 hover:text-blue-700"
              >
                Dashboard
              </Link>

              <Link
                to="/profile"
                onClick={() =>
                  setIsMenuOpen(false)
                }
                className="text-gray-700 hover:text-blue-700"
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                onClick={() =>
                  setIsMenuOpen(false)
                }
                className="text-gray-700 hover:text-blue-700"
              >
                Home
              </Link>

              <Link
                to="/report"
                onClick={() =>
                  setIsMenuOpen(false)
                }
                className="text-gray-700 hover:text-blue-700"
              >
                Report Issue
              </Link>

              <Link
                to="/my-reports"
                onClick={() =>
                  setIsMenuOpen(false)
                }
                className="text-gray-700 hover:text-blue-700"
              >
                My Reports
              </Link>

              {user && (
                <Link
                  to="/profile"
                  onClick={() =>
                    setIsMenuOpen(false)
                  }
                  className="text-gray-700 hover:text-blue-700"
                >
                  Profile
                </Link>
              )}
            </>
          )}

          {user ? (
            <>
              <span className="font-medium text-gray-700">
                {user.name}
              </span>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="text-left font-medium text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() =>
                  setIsMenuOpen(false)
                }
                className="text-gray-700 hover:text-blue-700"
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={() =>
                  setIsMenuOpen(false)
                }
                className="text-gray-700 hover:text-blue-700"
              >
                Register
              </Link>
            </>
          )}

        </div>
      )}

    </nav>
  )
}

export default Navbar