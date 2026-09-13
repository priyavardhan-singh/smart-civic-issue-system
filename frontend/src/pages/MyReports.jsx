import { useEffect, useState } from "react"
import {
  Link,
  useNavigate,
} from "react-router-dom"

const API_URL =
  "http://127.0.0.1:8000"

function MyReports() {
  const [reports, setReports] =
    useState([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")

  const navigate = useNavigate()

  useEffect(() => {
    const fetchMyReports =
      async () => {
        const token =
          localStorage.getItem(
            "access_token"
          )

        if (!token) {
          navigate("/login")
          return
        }

        try {
          const response =
            await fetch(
              `${API_URL}/my-reports`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            )

          const data =
            await response.json()

          if (
            response.status === 401
          ) {
            localStorage.removeItem(
              "access_token"
            )

            localStorage.removeItem(
              "user"
            )

            navigate("/login")
            return
          }

          if (!response.ok) {
            throw new Error(
              data.detail ||
                "Unable to load your reports."
            )
          }

          setReports(data)
        } catch (error) {
          console.error(
            "My reports error:",
            error
          )

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

  const formatCategory = (
    category
  ) => {
    const categories = {
      road:
        "Road Damage / Pothole",

      streetlight:
        "Streetlight Problem",

      garbage:
        "Garbage / Waste",

      water:
        "Water / Drainage",

      sewage:
        "Sewage Problem",

      other:
        "Other",
    }

    return (
      categories[category] ||
      category
    )
  }

  const formatStatus = (
    status
  ) => {
    if (!status) {
      return "Unknown"
    }

    return status
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      )
  }

  const formatDate = (
    date
  ) => {
    if (!date) {
      return ""
    }

    return new Date(
      date
    ).toLocaleString()
  }

  const getActivityIcon = (
    type
  ) => {
    if (type === "reported") {
      return "✓"
    }

    if (type === "assigned") {
      return "✓"
    }

    if (
      type === "in_progress"
    ) {
      return "✓"
    }

    if (type === "resolved") {
      return "✓"
    }

    return "•"
  }

  const getActivityStyles = (
    type
  ) => {
    if (type === "resolved") {
      return {
        circle:
          "bg-green-600 text-white",

        line:
          "bg-green-200",
      }
    }

    if (
      type === "in_progress"
    ) {
      return {
        circle:
          "bg-blue-600 text-white",

        line:
          "bg-blue-200",
      }
    }

    if (type === "assigned") {
      return {
        circle:
          "bg-yellow-500 text-white",

        line:
          "bg-yellow-200",
      }
    }

    return {
      circle:
        "bg-gray-700 text-white",

      line:
        "bg-gray-200",
    }
  }

  const getActivityHistory = (
    report
  ) => {
    if (
      Array.isArray(
        report.activity_history
      ) &&
      report.activity_history
        .length > 0
    ) {
      return [
        ...report.activity_history,
      ].sort(
        (a, b) =>
          new Date(
            a.created_at
          ).getTime() -
          new Date(
            b.created_at
          ).getTime()
      )
    }

    // Older reports created
    // before activity history
    // was added.
    const fallback = []

    if (report.created_at) {
      fallback.push({
        type: "reported",

        message:
          "Report submitted successfully",

        created_at:
          report.created_at,
      })
    }

    if (
      report.assigned_at &&
      report.assigned_to
    ) {
      fallback.push({
        type: "assigned",

        message:
          `Report assigned to ${report.assigned_to}`,

        created_at:
          report.assigned_at,
      })
    }

    if (
      report.work_started_at
    ) {
      fallback.push({
        type:
          "in_progress",

        message:
          "Officer started working on the report",

        created_at:
          report.work_started_at,
      })
    }

    if (report.resolved_at) {
      fallback.push({
        type: "resolved",

        message:
          "Issue resolved with officer proof",

        created_at:
          report.resolved_at,
      })
    }

    return fallback
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
          Track the civic issues you
          have reported.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {!errorMessage &&
          reports.length === 0 && (

          <div className="mt-8 rounded-xl border bg-white p-8 text-center">

            <h2 className="text-xl font-semibold text-gray-900">
              No reports yet
            </h2>

            <p className="mt-2 text-gray-600">
              You have not submitted
              any civic issues yet.
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

            {reports.map(
              (report) => {
                const activityHistory =
                  getActivityHistory(
                    report
                  )

                return (
                  <article
                    key={
                      report._id
                    }
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                  >

                    {report.photo_url && (

                      <img
                        src={`${API_URL}${report.photo_url}`}
                        alt="Reported civic issue"
                        className="h-56 w-full bg-gray-100 object-contain"
                      />

                    )}

                    <div className="p-5">

                      <div className="flex items-start justify-between gap-3">

                        <h2 className="text-lg font-bold text-gray-900">
                          {formatCategory(
                            report.category
                          )}
                        </h2>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {formatStatus(
                            report.status
                          )}
                        </span>

                      </div>

                      <p className="mt-3 text-gray-700">
                        {
                          report.description
                        }
                      </p>

                      <div className="mt-4 space-y-2 text-sm text-gray-600">

                        <p>
                          <span className="font-medium text-gray-700">
                            Address:
                          </span>{" "}

                          {report.address ||
                            "Address unavailable"}
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

                            {formatDate(
                              report.created_at
                            )}
                          </p>

                        )}

                      </div>

                      {/* ACTIVITY TIMELINE */}

                      {activityHistory.length >
                        0 && (

                        <div className="mt-6 border-t border-gray-200 pt-5">

                          <h3 className="text-base font-bold text-gray-900">
                            Activity Timeline
                          </h3>

                          <div className="mt-4">

                            {activityHistory.map(
                              (
                                activity,
                                index
                              ) => {
                                const styles =
                                  getActivityStyles(
                                    activity.type
                                  )

                                const isLast =
                                  index ===
                                  activityHistory.length -
                                    1

                                return (
                                  <div
                                    key={`${activity.type}-${activity.created_at}-${index}`}
                                    className="relative flex gap-4"
                                  >

                                    <div className="flex flex-col items-center">

                                      <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${styles.circle}`}
                                      >
                                        {getActivityIcon(
                                          activity.type
                                        )}
                                      </div>

                                      {!isLast && (

                                        <div
                                          className={`min-h-12 w-0.5 flex-1 ${styles.line}`}
                                        />

                                      )}

                                    </div>

                                    <div
                                      className={`pb-${
                                        isLast
                                          ? "0"
                                          : "6"
                                      }`}
                                    >

                                      <p className="font-medium text-gray-800">
                                        {activity.message ||
                                          formatStatus(
                                            activity.type
                                          )}
                                      </p>

                                      {activity.created_at && (

                                        <p className="mt-1 text-xs text-gray-500">
                                          {formatDate(
                                            activity.created_at
                                          )}
                                        </p>

                                      )}

                                    </div>

                                  </div>
                                )
                              }
                            )}

                          </div>

                        </div>
                      )}

                      {/* RESOLUTION */}

                      {report.status ===
                        "resolved" && (

                        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">

                          <h3 className="font-semibold text-green-800">
                            Resolution Details
                          </h3>

                          {report.resolution_photo_url && (

                            <div className="mt-4">

                              <p className="text-sm font-medium text-gray-700">
                                Resolution Proof:
                              </p>

                              <img
                                src={`${API_URL}${report.resolution_photo_url}`}
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
                                {
                                  report.resolution_remarks
                                }
                              </p>

                            </div>
                          )}

                          {report.resolved_at && (

                            <p className="mt-4 text-sm text-gray-600">

                              <span className="font-medium text-gray-700">
                                Resolved:
                              </span>{" "}

                              {formatDate(
                                report.resolved_at
                              )}

                            </p>

                          )}

                        </div>
                      )}

                    </div>

                  </article>
                )
              }
            )}

          </div>
        )}

      </div>

    </main>
  )
}

export default MyReports