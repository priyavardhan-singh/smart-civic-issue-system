import { Link } from 'react-router-dom'

function Home() {
  return (
    <main>

      {/* Hero Section */}
      <section className="bg-blue-50 px-6 py-20 text-center">

        <h1 className="text-4xl font-bold text-gray-900">
          Report Civic Issues Easily
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          Help improve your city by reporting local problems quickly and easily.
        </p>

        <Link to="/report" className="inline-block mt-8 bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition">
        Report an Issue
        </Link>

      </section>
      {/* How It Works Section */}
<section className="px-6 py-16">

  <h2 className="text-3xl font-bold text-center text-gray-900">
    How It Works
  </h2>

  <p className="mt-3 text-center text-gray-600">
    Report and track civic issues in three simple steps.
  </p>

  <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

    
    <div className="border rounded-xl p-6 text-center">
      <h3 className="text-xl font-semibold text-blue-700">
        1. Report
      </h3>

      <p className="mt-3 text-gray-600">
        Report a civic issue with details, location, and supporting evidence.
      </p>
    </div>

    
    <div className="border rounded-xl p-6 text-center">
      <h3 className="text-xl font-semibold text-blue-700">
        2. Track
      </h3>

      <p className="mt-3 text-gray-600">
        Track the progress of your reported issue through the system.
      </p>
    </div>

    
    <div className="border rounded-xl p-6 text-center">
      <h3 className="text-xl font-semibold text-blue-700">
        3. Resolve
      </h3>

      <p className="mt-3 text-gray-600">
        Authorities review the issue and take appropriate action.
      </p>
    </div>

  </div>

</section>

{/* Why Smart Civic Section */}
<section className="bg-gray-50 px-6 py-16">

  <h2 className="text-3xl font-bold text-center text-gray-900">
    Why Smart Civic?
  </h2>

  <p className="mt-3 text-center text-gray-600">
    Making civic issue reporting easier, faster, and more transparent.
  </p>

  <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

    {/* Feature 1 */}
    <div className="bg-white border rounded-xl p-6 text-center">
      <div className="text-4xl">
        📍
      </div>

      <h3 className="mt-4 text-xl font-semibold text-gray-900">
        Location-Based Reporting
      </h3>

      <p className="mt-3 text-gray-600">
        Report civic problems with their location so authorities can
        identify where action is needed.
      </p>
    </div>

    {/* Feature 2 */}
    <div className="bg-white border rounded-xl p-6 text-center">
      <div className="text-4xl">
        📷
      </div>

      <h3 className="mt-4 text-xl font-semibold text-gray-900">
        Photo Evidence
      </h3>

      <p className="mt-3 text-gray-600">
        Upload images to provide clear evidence of the reported civic issue.
      </p>
    </div>

    {/* Feature 3 */}
    <div className="bg-white border rounded-xl p-6 text-center">
      <div className="text-4xl">
        📊
      </div>

      <h3 className="mt-4 text-xl font-semibold text-gray-900">
        Track Progress
      </h3>

      <p className="mt-3 text-gray-600">
        Keep track of your reported issues and see their progress toward
        resolution.
      </p>
    </div>

  </div>

</section>
    </main>
  )
}

export default Home