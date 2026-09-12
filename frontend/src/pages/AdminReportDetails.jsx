import { useEffect, useState } from "react"
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom"

const API_URL = "http://127.0.0.1:8000"

function AdminReportDetails() {
  const { reportId } = useParams()

  const [report, setReport] =
    useState(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [isUpdating, setIsUpdating] =
    useState(false)

const [departments, setDepartments] =
  useState([])

const [officers, setOfficers] =
  useState([])

const [
  selectedDepartmentId,
  setSelectedDepartmentId,
] = useState("")

const [
  selectedOfficerId,
  setSelectedOfficerId,
] = useState("")

const [isLoadingOfficers, setIsLoadingOfficers] =
  useState(false)

const [isAssigning, setIsAssigning] =
  useState(false)

const [successMessage, setSuccessMessage] =
  useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const loadReport = async () => {
      const token =
        localStorage.getItem(
          "access_token"
        )

      const user = JSON.parse(
        localStorage.getItem("user") ||
          "null"
      )

      if (!token || !user) {
        navigate("/login")
        return
      }

      if (user.role !== "admin") {
        navigate("/")
        return
      }

      setIsLoading(true)
      setErrorMessage("")

      try {
        const response = await fetch(
          `${API_URL}/reports/${reportId}`,
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
          response.status === 401 ||
          response.status === 403
        ) {
          navigate("/login")
          return
        }

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Unable to load report."
          )
        }

        setReport(data)

      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load report."
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [reportId, navigate])

useEffect(() => {
  const loadDepartments = async () => {
    try {
      const token =
        localStorage.getItem(
          "access_token"
        )

      const response = await fetch(
        `${API_URL}/departments`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load departments."
        )
      }

      setDepartments(data)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load departments."
      )
    }
  }

  loadDepartments()
}, [])

useEffect(() => {
  const loadOfficers = async () => {
    if (!selectedDepartmentId) {
      setOfficers([])
      setSelectedOfficerId("")
      return
    }

    setIsLoadingOfficers(true)
    setSelectedOfficerId("")

    try {
      const token =
        localStorage.getItem(
          "access_token"
        )

      const response = await fetch(
        `${API_URL}/departments/${selectedDepartmentId}/officers`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load officers."
        )
      }

      setOfficers(data)
    } catch (error) {
      setOfficers([])

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load officers."
      )
    } finally {
      setIsLoadingOfficers(false)
    }
  }

  loadOfficers()
}, [selectedDepartmentId])

  const updateStatus = async (
    newStatus
  ) => {
    if (!report) {
      return
    }

    setIsUpdating(true)
    setErrorMessage("")

    try {
      const token =
        localStorage.getItem(
          "access_token"
        )

      const response = await fetch(
        `${API_URL}/reports/${report._id}/status`,
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
            "Unable to update status."
        )
      }

      setReport((current) => ({
        ...current,
        status: newStatus,
      }))
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update status."
      )
    } finally {
      setIsUpdating(false)
    }
  }

const assignReport = async () => {
  setErrorMessage("")
  setSuccessMessage("")

  if (!selectedDepartmentId) {
    setErrorMessage(
      "Please select a department."
    )
    return
  }

  if (!selectedOfficerId) {
    setErrorMessage(
      "Please select an officer."
    )
    return
  }

  setIsAssigning(true)

  try {
    const token =
      localStorage.getItem(
        "access_token"
      )

    const response = await fetch(
      `${API_URL}/reports/${report._id}/assign`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          department_id:
            selectedDepartmentId,

          officer_id:
            selectedOfficerId,
        }),
      }
    )

    const data =
      await response.json()

    if (!response.ok) {
      let message =
        "Unable to assign report."

      if (typeof data.detail === "string") {
        message = data.detail
      }

      if (Array.isArray(data.detail)) {
        message = data.detail
          .map(
            (error) =>
              error.msg ||
              "Invalid assignment data"
          )
          .join(", ")
      }

      throw new Error(message)
    }

    setReport(data.report)

    setSuccessMessage(
      "Report assigned successfully."
    )
  } catch (error) {
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Unable to assign report."
    )
  } finally {
    setIsAssigning(false)
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

  const formatStatus = (status) => {
    return status
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      )
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-gray-600">
            Loading report...
          </p>
        </div>
      </main>
    )
  }

  if (errorMessage && !report) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-red-700">
            {errorMessage}
          </p>
        </div>
      </main>
    )
  }

  if (!report) {
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">

      <div className="mx-auto max-w-5xl">

        <Link
          to="/admin"
          className="font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-5">
          <h1 className="text-3xl font-bold text-gray-900">
            Report Details
          </h1>

          <p className="mt-2 text-gray-600">
            Review the complete citizen report.
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

        <div className="mt-8 overflow-hidden rounded-xl border bg-white shadow-sm">

          {report.photo_url && (
            <div className="flex min-h-80 w-full items-center justify-center bg-gray-100 p-4">

              <img
                src={`${API_URL}${report.photo_url}`}
                alt="Citizen reported issue"
                className="max-h-[600px] w-full object-contain"
              />

            </div>
          )}

          <div className="p-6">

            <div className="flex flex-col justify-between gap-4 sm:flex-row">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Issue Category
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCategory(
                    report.category
                  )}
                </h2>
              </div>

              <div>
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  {formatStatus(
                    report.status
                  )}
                </span>
              </div>

            </div>

            <div className="mt-8">
              <p className="text-sm font-semibold text-gray-500">
                Description
              </p>

              <p className="mt-2 whitespace-pre-wrap leading-7 text-gray-800">
                {report.description}
              </p>
            </div>

            <div className="mt-8 rounded-xl bg-gray-50 p-5">

              <h3 className="font-semibold text-gray-900">
                Location Information
              </h3>

              <p className="mt-3 text-gray-700">
                {report.address ||
                  "Address unavailable"}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-sm text-gray-500">
                    Latitude
                  </p>

                  <p className="font-medium text-gray-900">
                    {report.latitude}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Longitude
                  </p>

                  <p className="font-medium text-gray-900">
                    {report.longitude}
                  </p>
                </div>

              </div>

            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">

              <div>
                <p className="text-sm text-gray-500">
                  Report ID
                </p>

                <p className="mt-1 break-all font-medium text-gray-900">
                  {report._id}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Citizen User ID
                </p>

                <p className="mt-1 break-all font-medium text-gray-900">
                  {report.user_id ||
                    "Unavailable"}
                </p>
              </div>

            </div>

            {report.created_at && (
              <div className="mt-5">
                <p className="text-sm text-gray-500">
                  Reported On
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {new Date(
                    report.created_at
                  ).toLocaleString()}
                </p>
              </div>
            )}

          {report.status === "resolved" && (
  <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5">

    <h3 className="text-xl font-bold text-green-900">
      Resolution Proof
    </h3>

    <p className="mt-1 text-sm text-green-800">
      Evidence submitted by the assigned officer
      after completing the civic issue.
    </p>

    {report.resolution_photo_url && (
      <div className="mt-5">

        <p className="text-sm font-semibold text-gray-700">
          Resolution Photo
        </p>

        <div className="mt-2 flex items-center justify-center rounded-lg border bg-white p-3">

          <img
            src={`${API_URL}${report.resolution_photo_url}`}
            alt="Officer resolution proof"
            className="max-h-[500px] w-full object-contain"
          />

        </div>

      </div>
    )}

    {report.resolution_remarks && (
      <div className="mt-5">

        <p className="text-sm font-semibold text-gray-700">
          Officer Remarks
        </p>

        <p className="mt-2 whitespace-pre-wrap leading-7 text-gray-800">
          {report.resolution_remarks}
        </p>

      </div>
    )}

    {report.resolved_at && (
      <div className="mt-5">

        <p className="text-sm font-semibold text-gray-700">
          Resolved On
        </p>

        <p className="mt-1 text-gray-800">
          {new Date(
            report.resolved_at
          ).toLocaleString()}
        </p>

      </div>
    )}

    {report.work_started_at && (
      <div className="mt-5">

        <p className="text-sm font-semibold text-gray-700">
          Work Started On
        </p>

        <p className="mt-1 text-gray-800">
          {new Date(
            report.work_started_at
          ).toLocaleString()}
        </p>

      </div>
    )}

  </div>
)}

            <div className="mt-8 border-t pt-6">

  <h3 className="text-xl font-bold text-gray-900">
    Assign Report
  </h3>

  <p className="mt-1 text-sm text-gray-600">
    Assign this civic issue to the responsible
    department and officer.
  </p>

  <div className="mt-5 grid gap-5 sm:grid-cols-2">

    <div>
  <label className="block text-sm font-semibold text-gray-700">
    Department
  </label>

  <select
    value={selectedDepartmentId}
    onChange={(event) =>
      setSelectedDepartmentId(
        event.target.value
      )
    }
    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-600 focus:outline-none"
  >
    <option value="">
      Select Department
    </option>

    {departments.map(
      (department) => (
        <option
          key={department.id}
          value={department.id}
        >
          {department.name}
        </option>
      )
    )}
  </select>
</div>

    <div>
  <label className="block text-sm font-semibold text-gray-700">
    Officer / Staff
  </label>

  <select
    value={selectedOfficerId}
    onChange={(event) =>
      setSelectedOfficerId(
        event.target.value
      )
    }
    disabled={
      !selectedDepartmentId ||
      isLoadingOfficers
    }
    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-600 focus:outline-none disabled:bg-gray-100"
  >
    <option value="">
      {isLoadingOfficers
        ? "Loading officers..."
        : "Select Officer"}
    </option>

    {officers.map((officer) => (
      <option
        key={officer.id}
        value={officer.id}
      >
        {officer.name} - {officer.email}
      </option>
    ))}
  </select>
</div>

  </div>

  <button
    type="button"
    onClick={assignReport}
    disabled={isAssigning}
    className="mt-5 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
  >
    {isAssigning
      ? "Assigning..."
      : "Assign Report"}
  </button>

  {report.department && (
    <div className="mt-5 rounded-lg bg-blue-50 p-4">

      <p className="font-semibold text-blue-900">
        Current Assignment
      </p>

      <p className="mt-2 text-sm text-blue-800">
        Department: {report.department}
      </p>

      <p className="mt-1 text-sm text-blue-800">
        Assigned To:{" "}
        {report.assigned_to}
      </p>

    </div>
  )}

</div>

           <div className="mt-8 border-t pt-6">

  <label className="block text-sm font-semibold text-gray-700">
    Update Report Status
  </label>

  {report.status === "resolved" ? (
    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-4">
      <p className="font-semibold text-green-800">
        This report has been resolved with officer proof.
      </p>

      <p className="mt-1 text-sm text-green-700">
        Resolved reports cannot be manually changed by the admin.
      </p>
    </div>
  ) : (
    <>
      <select
        value={report.status}
        disabled={isUpdating}
        onChange={(event) =>
          updateStatus(event.target.value)
        }
        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-600 focus:outline-none sm:max-w-md"
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

      {isUpdating && (
        <p className="mt-2 text-sm text-gray-500">
          Updating status...
        </p>
      )}
    </>
  )}

            </div>

          </div>

        </div>

      </div>

    </main>
  )
}

export default AdminReportDetails