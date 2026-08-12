import { useState } from 'react'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
          <a href="#" className="text-gray-700 hover:text-blue-700">
            Home
          </a>

          <a href="#" className="text-gray-700 hover:text-blue-700">
            Report Issue
          </a>

          <a href="#" className="text-gray-700 hover:text-blue-700">
            My Reports
          </a>
        </div>

        {/* Login button */}
        <div className="hidden md:block">
          <button className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition">
            Login
          </button>
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

          <a href="#" className="text-gray-700 hover:text-blue-700">
            Home
          </a>

          <a href="#" className="text-gray-700 hover:text-blue-700">
            Report Issue
          </a>

          <a href="#" className="text-gray-700 hover:text-blue-700">
            My Reports
          </a>

        </div>
      )}

    </nav>
  )
}

export default Navbar