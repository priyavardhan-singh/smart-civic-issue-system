import { useEffect, useState } from "react"
import {
  Link,
  useNavigate,
} from "react-router-dom"

const API_URL = "http://127.0.0.1:8000"

function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [updatingReportId, setUpdatingReportId] =
    useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    )

    const token =
      localStorage.getItem("access_token")

    if (!token || !user) {
      navigate("/login")
      return
    }

    if (user.role !== "admin") {
      navigate("/")
      return
    }

    fetchReports()
  }, [])

  const fetchReports = async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const token =
        localStorage.getItem("access_token")

      const response = await fetch(
        `${API_URL}/reports`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        )

        localStorage.removeItem("user")

        navigate("/login")
        return
      }

      if (response.status === 403) {
        navigate("/")
        return
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load reports."
        )
      }

      setReports(data)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load reports."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (
    reportId,
    newStatus
  ) => {
    setUpdatingReportId(reportId)
    setErrorMessage("")

    try {
      const token =
        localStorage.getItem("access_token")

      const response = await fetch(
        `${API_URL}/reports/${reportId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to update report status."
        )
      }

      setReports((currentReports) =>
        currentReports.map((report) =>
          report._id === reportId
            ? {
                ...report,
                status: newStatus,
              }
            : report
        )
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update status."
      )
    } finally {
      setUpdatingReportId(null)
    }
  }

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
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-600">
            Loading admin dashboard...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Manage civic reports submitted by citizens.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Reports
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {reports.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Reported
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {
                reports.filter(
                  (report) =>
                    report.status === "reported"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              In Progress
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-600">
              {
                reports.filter(
                  (report) =>
                    report.status ===
                    "in_progress"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {
                reports.filter(
                  (report) =>
                    report.status ===
                    "resolved"
                ).length
              }
            </p>
          </div>

        </div>

        {reports.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              No reports available
            </h2>

            <p className="mt-2 text-gray-600">
              Citizen reports will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">

            {reports.map((report) => (
              <div
                key={report._id}
                className="overflow-hidden rounded-xl border bg-white shadow-sm"
              >

                {report.photo_url && (
                  <div className="flex h-64 w-full items-center justify-center bg-gray-100">
                      <img
                         src={`${API_URL}${report.photo_url}`}
                        alt="Reported civic issue"
                        className="h-full w-full object-contain"
                    />
                </div>
                )}

                <div className="p-6">

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {formatCategory(
                          report.category
                        )}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Report ID: {report._id}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                      {formatStatus(
                        report.status
                      )}
                    </span>

                  </div>

                  <p className="mt-4 leading-6 text-gray-700">
                    {report.description}
                  </p>

                  <div className="mt-4 rounded-lg bg-gray-50 p-4">

                    <p className="text-sm font-medium text-gray-700">
                      Location
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      {report.address ||
                        "Address unavailable"}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {report.latitude},{" "}
                      {report.longitude}
                    </p>

                  </div>

                  {report.created_at && (
  <p className="mt-4 text-sm text-gray-500">
    Reported:{" "}
    {new Date(
      report.created_at
    ).toLocaleString()}
  </p>
)}

<Link
  to={`/admin/reports/${report._id}`}
  className="mt-5 block w-full rounded-lg bg-blue-700 px-4 py-3 text-center font-semibold text-white hover:bg-blue-800"
>
  View Full Report
</Link>

<div className="mt-5">
  <label className="block text-sm font-semibold text-gray-700">
    Update Status
  </label>
                    <select
                      value={report.status}
                      disabled={
                        updatingReportId ===
                        report._id
                      }
                      onChange={(event) =>
                        updateStatus(
                          report._id,
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="reported">
                        Reported
                      </option>

                      <option value="assigned">
                        Assigned
                      </option>

                      <option value="in_progress">
                        In Progress
                      </option>

                      <option value="resolved">
                        Resolved
                      </option>
                    </select>

                    {updatingReportId ===
                      report._id && (
                      <p className="mt-2 text-sm text-gray-500">
                        Updating...
                      </p>
                    )}

                  </div>

                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </main>
  )
}

export default AdminDashboard