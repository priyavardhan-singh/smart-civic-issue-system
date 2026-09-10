import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [user, setUser] = useState(null)

  const location = useLocation()
  const navigate = useNavigate()
    useEffect(() => {
    const storedUser = localStorage.getItem("user")

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      setUser(null)
    }
  }, [location])

    const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")

    setUser(null)
    setIsMenuOpen(false)

    navigate("/login")
  }

  return (
    <nav className="bg-white border-b px-6 py-4">

      {/* Top row */}
      <div className="flex items-center justify-between max-w-7xl mx-auto">

        {/* Logo */}
        <div>
          <h1 className="text-2xl font-bold text-blue-700">
            Smart Civic
          </h1>
        </div>

        {/* Desktop navigation links */}
        <div className="hidden md:flex gap-6">
          <Link to="/" className="text-gray-700 hover:text-blue-700">
            Home
          </Link>

          <Link to="/report" className="text-gray-700 hover:text-blue-700">
            Report Issue
          </Link>

          <Link to="/my-reports" className="text-gray-700 hover:text-blue-700">
            My Reports
          </Link>

        </div>

         {/* Authentication */}
<div className="hidden md:flex items-center gap-3">
  {user ? (
    <>
      <span className="text-sm font-medium text-gray-700">
        {user.name}
      </span>

      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition"
      >
        Logout
      </button>
    </>
  ) : (
    <>
      <Link
        to="/login"
        className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition"
      >
        Login
      </Link>

      <Link
        to="/register"
        className="border border-blue-700 text-blue-700 px-5 py-2 rounded-lg hover:bg-blue-50 transition"
      >
        Register
      </Link>
    </>
  )}
</div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>

      </div>

      {/* Mobile navigation menu */}
      {isMenuOpen && (
  <div className="md:hidden flex flex-col gap-4 mt-4 pt-4 border-t">

    <Link
      to="/"
      onClick={() => setIsMenuOpen(false)}
      className="text-gray-700 hover:text-blue-700"
    >
      Home
    </Link>

    <Link
      to="/report"
      onClick={() => setIsMenuOpen(false)}
      className="text-gray-700 hover:text-blue-700"
    >
      Report Issue
    </Link>

    <Link to="/my-reports" onClick={() => setIsMenuOpen(false)}
       className="text-gray-700 hover:text-blue-700" >
       My Reports
    </Link>

   {user ? (
  <>
    <span className="font-medium text-gray-700">
      {user.name}
    </span>

    <button
      type="button"
      onClick={handleLogout}
      className="text-left font-medium text-red-600 hover:text-red-700"
    >
      Logout
    </button>
  </>
) : (
  <>
    <Link
      to="/login"
      onClick={() => setIsMenuOpen(false)}
      className="text-gray-700 hover:text-blue-700"
    >
      Login
    </Link>

    <Link
      to="/register"
      onClick={() => setIsMenuOpen(false)}
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