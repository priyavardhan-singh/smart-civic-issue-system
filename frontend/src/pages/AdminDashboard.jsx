import { useEffect, useMemo, useState } from "react"
import {
  Link,
  useNavigate,
} from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL

function AdminDashboard() {
  const [reports, setReports] =
    useState([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")

  const [
    updatingReportId,
    setUpdatingReportId,
  ] = useState(null)

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("")

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all")

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all")

  const [
    departmentFilter,
    setDepartmentFilter,
  ] = useState("all")

  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(
      localStorage.getItem("user") ||
        "null"
    )

    const token =
      localStorage.getItem(
        "access_token"
      )

    if (!token || !user) {
      navigate("/login")
      return
    }

    if (user.role !== "admin") {
      navigate("/")
      return
    }

    fetchReports()
  }, [navigate])

  const fetchReports = async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const token =
        localStorage.getItem(
          "access_token"
        )

      const response = await fetch(
        `${API_URL}/reports`,
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

      if (
        response.status === 403
      ) {
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
        localStorage.getItem(
          "access_token"
        )

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

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to update report status."
        )
      }

      setReports(
        (currentReports) =>
          currentReports.map(
            (report) =>
              report._id ===
              reportId
                ? {
                    ...report,
                    status:
                      newStatus,
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

  const departments =
    useMemo(() => {
      const departmentNames =
        reports
          .map(
            (report) =>
              report.department
          )
          .filter(Boolean)

      return [
        ...new Set(
          departmentNames
        ),
      ].sort((a, b) =>
        a.localeCompare(b)
      )
    }, [reports])

  const filteredReports =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase()

      return reports.filter(
        (report) => {
          const matchesSearch =
            !query ||
            String(
              report._id || ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              report.description || ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              report.address || ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              report.assigned_to || ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              report.department || ""
            )
              .toLowerCase()
              .includes(query)

          const matchesStatus =
            statusFilter === "all" ||
            report.status ===
              statusFilter

          const matchesCategory =
            categoryFilter === "all" ||
            report.category ===
              categoryFilter

          const matchesDepartment =
            departmentFilter === "all" ||
            report.department ===
              departmentFilter

          return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory &&
            matchesDepartment
          )
        }
      )
    }, [
      reports,
      searchQuery,
      statusFilter,
      categoryFilter,
      departmentFilter,
    ])

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setCategoryFilter("all")
    setDepartmentFilter("all")
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    departmentFilter !== "all"

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
            Manage, search and filter
            civic reports submitted by
            citizens.
          </p>

        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {/* SUMMARY CARDS */}

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
                    report.status ===
                    "reported"
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

        {/* SEARCH AND FILTERS */}

        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Search & Filter Reports
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Search by report ID,
                description, address,
                department or assigned
                officer.
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="self-start rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}

          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">

            <div className="lg:col-span-2">

              <label className="block text-sm font-semibold text-gray-700">
                Search
              </label>

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search report ID, address, officer..."
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
              />

            </div>

            <div>

              <label className="block text-sm font-semibold text-gray-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">
                  All Statuses
                </option>

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

            </div>

            <div>

              <label className="block text-sm font-semibold text-gray-700">
                Category
              </label>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">
                  All Categories
                </option>

                <option value="road">
                  Road Damage / Pothole
                </option>

                <option value="streetlight">
                  Streetlight Problem
                </option>

                <option value="garbage">
                  Garbage / Waste
                </option>

                <option value="water">
                  Water / Drainage
                </option>

                <option value="sewage">
                  Sewage Problem
                </option>

                <option value="other">
                  Other
                </option>
              </select>

            </div>

          </div>

          {departments.length > 0 && (

            <div className="mt-4 max-w-md">

              <label className="block text-sm font-semibold text-gray-700">
                Department
              </label>

              <select
                value={
                  departmentFilter
                }
                onChange={(event) =>
                  setDepartmentFilter(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">
                  All Departments
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>
                  )
                )}

              </select>

            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {
                filteredReports.length
              }
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {reports.length}
            </span>{" "}
            reports
          </div>

        </section>

        {reports.length === 0 ? (

          <div className="rounded-xl bg-white p-8 text-center shadow-sm">

            <h2 className="text-xl font-semibold text-gray-900">
              No reports available
            </h2>

            <p className="mt-2 text-gray-600">
              Citizen reports will
              appear here.
            </p>

          </div>

        ) : filteredReports.length ===
          0 ? (

          <div className="rounded-xl border bg-white p-8 text-center shadow-sm">

            <h2 className="text-xl font-semibold text-gray-900">
              No matching reports
            </h2>

            <p className="mt-2 text-gray-600">
              Try changing your search
              or filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Clear Filters
            </button>

          </div>

        ) : (

          <div className="grid gap-6 lg:grid-cols-2">

            {filteredReports.map(
              (report) => (

              <div
                key={report._id}
                className="overflow-hidden rounded-xl border bg-white shadow-sm"
              >

                {(report.photo_cloudinary_url || report.photo_url) && (

  <div className="flex h-64 w-full items-center justify-center bg-gray-100">

    <img
      src={
        report.photo_cloudinary_url
          ? report.photo_cloudinary_url
          : `${API_URL}${report.photo_url}`
      }
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

                      <p className="mt-1 break-all text-sm text-gray-500">
                        Report ID:{" "}
                        {report._id}
                      </p>

                    </div>

                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                      {formatStatus(
                        report.status
                      )}
                    </span>

                  </div>

                  <p className="mt-4 leading-6 text-gray-700">
                    {
                      report.description
                    }
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

                  {(report.department ||
                    report.assigned_to) && (

                    <div className="mt-4 rounded-lg border border-gray-200 p-4">

                      {report.department && (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">
                            Department:
                          </span>{" "}
                          {
                            report.department
                          }
                        </p>
                      )}

                      {report.assigned_to && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">
                            Assigned Officer:
                          </span>{" "}
                          {
                            report.assigned_to
                          }
                        </p>
                      )}

                    </div>

                  )}

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

                    {report.status ===
                    "resolved" ? (

                      <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
                        Resolved reports are
                        final. Resolution is
                        completed by the
                        assigned officer with
                        proof.
                      </div>

                    ) : (

                      <>
                        <select
                          value={
                            report.status
                          }
                          disabled={
                            updatingReportId ===
                            report._id
                          }
                          onChange={(
                            event
                          ) =>
                            updateStatus(
                              report._id,
                              event.target
                                .value
                            )
                          }
                          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-600 focus:outline-none disabled:opacity-60"
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

                        </select>

                        {updatingReportId ===
                          report._id && (

                          <p className="mt-2 text-sm text-gray-500">
                            Updating...
                          </p>

                        )}
                      </>

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
