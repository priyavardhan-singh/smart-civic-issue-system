import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL

function OfficerDashboard() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [updatingReportId, setUpdatingReportId] =
    useState(null)

  const [resolvingReportId, setResolvingReportId] =
    useState(null)

  const [resolutionRemarks, setResolutionRemarks] =
    useState({})

  const [resolutionPhotos, setResolutionPhotos] =
    useState({})

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
        localStorage.getItem(
          "access_token"
        )

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

        localStorage.removeItem(
          "user"
        )

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

  const startWork = async (
    reportId
  ) => {
    setErrorMessage("")
    setSuccessMessage("")
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
            status: "in_progress",
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to start work."
        )
      }

      setSuccessMessage(
        "Work started successfully."
      )

      await loadReports()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to start work."
      )
    } finally {
      setUpdatingReportId(null)
    }
  }

  const handlePhotoChange = (
    reportId,
    event
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    setResolutionPhotos(
      (previous) => ({
        ...previous,
        [reportId]: file,
      })
    )
  }

  const resolveReport = async (
    reportId
  ) => {
    setErrorMessage("")
    setSuccessMessage("")

    const remarks =
      resolutionRemarks[reportId] || ""

    const photo =
      resolutionPhotos[reportId]

    if (!remarks.trim()) {
      setErrorMessage(
        "Please enter resolution remarks."
      )
      return
    }

    if (!photo) {
      setErrorMessage(
        "Please upload a resolution photo."
      )
      return
    }

    setResolvingReportId(reportId)

    try {
      const token =
        localStorage.getItem(
          "access_token"
        )

      const formData =
        new FormData()

      formData.append(
        "remarks",
        remarks.trim()
      )

      formData.append(
        "resolution_photo",
        photo
      )

      const response = await fetch(
        `${API_URL}/officer/reports/${reportId}/resolve`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to resolve report."
        )
      }

      setSuccessMessage(
        "Report resolved successfully."
      )

      setResolutionRemarks(
        (previous) => {
          const updated = {
            ...previous,
          }

          delete updated[reportId]

          return updated
        }
      )

      setResolutionPhotos(
        (previous) => {
          const updated = {
            ...previous,
          }

          delete updated[reportId]

          return updated
        }
      )

      await loadReports()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to resolve report."
      )
    } finally {
      setResolvingReportId(null)
    }
  }

  const formatStatus = (
    status
  ) => {
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

  const getStatusClass = (
    status
  ) => {
    if (status === "assigned") {
      return (
        "bg-yellow-100 " +
        "text-yellow-800"
      )
    }

    if (
      status === "in_progress"
    ) {
      return (
        "bg-blue-100 " +
        "text-blue-800"
      )
    }

    if (status === "resolved") {
      return (
        "bg-green-100 " +
        "text-green-800"
      )
    }

    return (
      "bg-gray-100 " +
      "text-gray-800"
    )
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

        {successMessage && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {successMessage}
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

              {reports.map(
                (report) => (
                  <article
                    key={report._id}
                    className="overflow-hidden rounded-xl border bg-white shadow-sm"
                  >

                   {(report.photo_cloudinary_url || report.photo_url) && (
  <div className="bg-gray-100">
    <img
      src={
        report.photo_cloudinary_url
          ? report.photo_cloudinary_url
          : `${API_URL}${report.photo_url}`
      }
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

                      </div>

                      {/* ASSIGNED */}

                      {report.status ===
                        "assigned" && (
                        <button
                          type="button"
                          disabled={
                            updatingReportId ===
                            report._id
                          }
                          onClick={() =>
                            startWork(
                              report._id
                            )
                          }
                          className="mt-6 w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                        >
                          {updatingReportId ===
                          report._id
                            ? "Starting..."
                            : "Start Work"}
                        </button>
                      )}

                      {/* IN PROGRESS */}

                      {report.status ===
                        "in_progress" && (
                        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">

                          <h3 className="font-semibold text-gray-900">
                            Complete Resolution
                          </h3>

                          <p className="mt-1 text-sm text-gray-600">
                            Add work remarks and a
                            photo showing the resolved
                            issue.
                          </p>

                          <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700">
                              Resolution Remarks
                            </label>

                            <textarea
                              rows="4"
                              value={
                                resolutionRemarks[
                                  report._id
                                ] || ""
                              }
                              onChange={(
                                event
                              ) =>
                                setResolutionRemarks(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,

                                    [report._id]:
                                      event.target
                                        .value,
                                  })
                                )
                              }
                              placeholder="Example: Pothole filled and damaged road surface repaired."
                              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                            />
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700">
                              Resolution Photo
                            </label>

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(
                                event
                              ) =>
                                handlePhotoChange(
                                  report._id,
                                  event
                                )
                              }
                              className="mt-2 block w-full text-sm text-gray-700"
                            />

                            {resolutionPhotos[
                              report._id
                            ] && (
                              <p className="mt-2 text-xs text-gray-600">
                                Selected:{" "}
                                {
                                  resolutionPhotos[
                                    report._id
                                  ].name
                                }
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={
                              resolvingReportId ===
                              report._id
                            }
                            onClick={() =>
                              resolveReport(
                                report._id
                              )
                            }
                            className="mt-5 w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                          >
                            {resolvingReportId ===
                            report._id
                              ? "Submitting..."
                              : "Submit Resolution Proof"}
                          </button>

                        </div>
                      )}

                      {/* RESOLVED */}

                      {report.status ===
                        "resolved" && (
                        <div className="mt-6">

                          <div className="rounded-lg bg-green-50 p-4 text-center font-semibold text-green-700">
                            Issue Resolved
                          </div>

                          {(
  report.resolution_photo_cloudinary_url ||
  report.resolution_photo_url
) && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold text-gray-700">
                                Resolution Proof
                              </p>

                              <img
                                src={
  report.resolution_photo_cloudinary_url
    ? report.resolution_photo_cloudinary_url
    : `${API_URL}${report.resolution_photo_url}`
}
                                alt="Resolution proof"
                                className="mt-2 max-h-72 w-full rounded-lg border bg-gray-50 object-contain"
                              />
                            </div>
                          )}

                          {report.resolution_remarks && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold text-gray-700">
                                Resolution Remarks
                              </p>

                              <p className="mt-1 text-gray-600">
                                {
                                  report.resolution_remarks
                                }
                              </p>
                            </div>
                          )}

                          {report.resolved_at && (
                            <p className="mt-4 text-xs text-gray-500">
                              Resolved on:{" "}
                              {new Date(
                                report.resolved_at
                              ).toLocaleString()}
                            </p>
                          )}

                        </div>
                      )}

                    </div>

                  </article>
                )
              )}

            </div>
          )}

        </div>

      </div>
    </main>
  )
}

export default OfficerDashboard