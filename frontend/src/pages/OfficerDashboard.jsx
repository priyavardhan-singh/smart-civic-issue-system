import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = "http://127.0.0.1:8000"

function OfficerDashboard() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [updatingReportId, setUpdatingReportId] =
    useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const token =
      localStorage.getItem("access_token")

    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    )

    if (!token || !user) {
      navigate("/login")
      return
    }

    if (user.role !== "officer") {
      navigate("/")
      return
    }

    loadReports()
  }, [navigate])

  const loadReports = async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const token =
        localStorage.getItem("access_token")

      const response = await fetch(
        `${API_URL}/officer/reports`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      )

      const data =
        await response.json()

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        )
        localStorage.removeItem("user")

        navigate("/login")
        return
      }

      if (response.status === 403) {
        throw new Error(
          "Officer access required."
        )
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load assigned reports."
        )
      }

      setReports(data)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load assigned reports."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (
    reportId,
    newStatus
  ) => {
    setErrorMessage("")
    setUpdatingReportId(reportId)

    try {
      const token =
        localStorage.getItem(
          "access_token"
        )

      const response = await fetch(
        `${API_URL}/officer/reports/${reportId}/status`,
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

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to update report status."
        )
      }

      await loadReports()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update report status."
      )
    } finally {
      setUpdatingReportId(null)
    }
  }

  const getNextAction = (status) => {
    if (status === "assigned") {
      return {
        label: "Start Work",
        nextStatus: "in_progress",
      }
    }

    if (status === "in_progress") {
      return {
        label: "Mark as Resolved",
        nextStatus: "resolved",
      }
    }

    return null
  }

  const formatStatus = (status) => {
    if (status === "in_progress") {
      return "In Progress"
    }

    if (status === "assigned") {
      return "Assigned"
    }

    if (status === "resolved") {
      return "Resolved"
    }

    return status
  }

  const getStatusClass = (status) => {
    if (status === "assigned") {
      return "bg-yellow-100 text-yellow-800"
    }

    if (status === "in_progress") {
      return "bg-blue-100 text-blue-800"
    }

    if (status === "resolved") {
      return "bg-green-100 text-green-800"
    }

    return "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-600">
            Loading assigned reports...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Officer Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            View and manage civic issues assigned
            to you.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-8">

          {reports.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                No assigned reports
              </h2>

              <p className="mt-2 text-gray-600">
                You currently have no civic issues
                assigned to you.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">

              {reports.map((report) => {
                const action =
                  getNextAction(report.status)

                return (
                  <article
                    key={report._id}
                    className="overflow-hidden rounded-xl border bg-white shadow-sm"
                  >

                    {report.photo_url && (
                      <div className="bg-gray-100">
                        <img
                          src={`${API_URL}${report.photo_url}`}
                          alt="Reported civic issue"
                          className="h-64 w-full object-contain"
                        />
                      </div>
                    )}

                    <div className="p-6">

                      <div className="flex flex-wrap items-start justify-between gap-3">

                        <h2 className="text-xl font-bold capitalize text-gray-900">
                          {report.category}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClass(
                            report.status
                          )}`}
                        >
                          {formatStatus(
                            report.status
                          )}
                        </span>

                      </div>

                      <div className="mt-5 space-y-4">

                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Description
                          </p>

                          <p className="mt-1 text-gray-600">
                            {report.description}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Location
                          </p>

                          <p className="mt-1 text-gray-600">
                            {report.address ||
                              "Address unavailable"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {report.latitude},{" "}
                            {report.longitude}
                          </p>
                        </div>

                        {report.department && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              Department
                            </p>

                            <p className="mt-1 text-gray-600">
                              {
                                report.department
                              }
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Report ID
                          </p>

                          <p className="mt-1 break-all text-xs text-gray-500">
                            {report._id}
                          </p>
                        </div>

                        {report.created_at && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              Reported On
                            </p>

                            <p className="mt-1 text-gray-600">
                              {new Date(
                                report.created_at
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}

                      </div>

                      {action && (
                        <button
                          type="button"
                          disabled={
                            updatingReportId ===
                            report._id
                          }
                          onClick={() =>
                            updateStatus(
                              report._id,
                              action.nextStatus
                            )
                          }
                          className="mt-6 w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingReportId ===
                          report._id
                            ? "Updating..."
                            : action.label}
                        </button>
                      )}

                      {report.status ===
                        "resolved" && (
                        <div className="mt-6 rounded-lg bg-green-50 p-4 text-center font-semibold text-green-700">
                          Issue Resolved
                        </div>
                      )}

                    </div>

                  </article>
                )
              })}

            </div>
          )}

        </div>

      </div>
    </main>
  )
}

export default OfficerDashboard