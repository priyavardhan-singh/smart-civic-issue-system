import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

function MyReports() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const navigate = useNavigate()

  useEffect(() => {
    const fetchMyReports = async () => {
      const token = localStorage.getItem("access_token")

      if (!token) {
        navigate("/login")
        return
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/my-reports",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (response.status === 401) {
          localStorage.removeItem("access_token")
          localStorage.removeItem("user")
          navigate("/login")
          return
        }

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load your reports."
          )
        }

        setReports(data)
      } catch (error) {
        console.error("My reports error:", error)

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your reports."
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyReports()
  }, [navigate])

  const formatCategory = (category) => {
    const categories = {
      road: "Road Damage / Pothole",
      streetlight: "Streetlight Problem",
      garbage: "Garbage / Waste",
      water: "Water / Drainage",
      sewage: "Sewage Problem",
      other: "Other",
    }

    return categories[category] || category
  }

  const formatStatus = (status) => {
    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-gray-600">
            Loading your reports...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">

        <h1 className="text-3xl font-bold text-gray-900">
          My Reports
        </h1>

        <p className="mt-2 text-gray-600">
          Track the civic issues you have reported.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {!errorMessage && reports.length === 0 && (
          <div className="mt-8 rounded-xl border bg-white p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              No reports yet
            </h2>

            <p className="mt-2 text-gray-600">
              You have not submitted any civic issues yet.
            </p>

            <Link
              to="/report"
              className="mt-5 inline-block rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800"
            >
              Report an Issue
            </Link>
          </div>
        )}

        {reports.length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {reports.map((report) => (
              <article
                key={report._id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                {report.photo_url && (
                  <img
                    src={`http://127.0.0.1:8000${report.photo_url}`}
                    alt="Reported civic issue"
                    className="h-56 w-full object-contain bg-gray-100"
                  />
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">

                    <h2 className="text-lg font-bold text-gray-900">
                      {formatCategory(report.category)}
                    </h2>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {formatStatus(report.status)}
                    </span>

                  </div>

                  <p className="mt-3 text-gray-700">
                    {report.description}
                  </p>

                  <div className="mt-4 space-y-2 text-sm text-gray-600">

                    <p>
                      <span className="font-medium text-gray-700">
                        Address:
                      </span>{" "}
                      {report.address || "Address unavailable"}
                    </p>

                    <p>
                      <span className="font-medium text-gray-700">
                        Report ID:
                      </span>{" "}
                      {report._id}
                    </p>

                    {report.created_at && (
                      <p>
                        <span className="font-medium text-gray-700">
                          Reported:
                        </span>{" "}
                        {new Date(
                          report.created_at
                        ).toLocaleString()}
                      </p>
                    )}

                    {report.status === "resolved" && (
  <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">

    <h3 className="font-semibold text-green-800">
      Resolution Details
    </h3>

    {report.resolution_photo_url && (
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700">
          Resolution Proof:
        </p>

        <img
          src={`http://127.0.0.1:8000${report.resolution_photo_url}`}
          alt="Resolution proof"
          className="mt-2 max-h-72 w-full rounded-lg border bg-white object-contain"
        />
      </div>
    )}

    {report.resolution_remarks && (
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700">
          Officer Remarks:
        </p>

        <p className="mt-1 text-gray-700">
          {report.resolution_remarks}
        </p>
      </div>
    )}

    {report.resolved_at && (
      <p className="mt-4 text-sm text-gray-600">
        <span className="font-medium text-gray-700">
          Resolved:
        </span>{" "}
        {new Date(
          report.resolved_at
        ).toLocaleString()}
      </p>
    )}

  </div>
)}

                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}

export default MyReports