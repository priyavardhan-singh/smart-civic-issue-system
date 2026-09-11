import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = "http://127.0.0.1:8000"

function AdminManagement() {
  const [departments, setDepartments] =
    useState([])

  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState("")

  const [officers, setOfficers] =
    useState([])

  const [departmentName, setDepartmentName] =
    useState("")

  const [officerName, setOfficerName] =
    useState("")

  const [officerEmail, setOfficerEmail] =
    useState("")

  const [isLoading, setIsLoading] =
    useState(true)

  const [isAddingDepartment, setIsAddingDepartment] =
    useState(false)

  const [isAddingOfficer, setIsAddingOfficer] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [successMessage, setSuccessMessage] =
    useState("")

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

    loadDepartments()
  }, [navigate])

  useEffect(() => {
    if (!selectedDepartmentId) {
      setOfficers([])
      return
    }

    loadOfficers(selectedDepartmentId)
  }, [selectedDepartmentId])

  const loadDepartments = async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const token =
        localStorage.getItem("access_token")

      const response = await fetch(
        `${API_URL}/departments`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
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
    } finally {
      setIsLoading(false)
    }
  }

  const loadOfficers = async (
    departmentId
  ) => {
    setErrorMessage("")

    try {
      const token =
        localStorage.getItem(
          "access_token"
        )

      const response = await fetch(
        `${API_URL}/departments/${departmentId}/officers`,
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
    }
  }

  const handleAddDepartment = async (
    event
  ) => {
    event.preventDefault()

    setErrorMessage("")
    setSuccessMessage("")

    if (!departmentName.trim()) {
      setErrorMessage(
        "Please enter a department name."
      )
      return
    }

    setIsAddingDepartment(true)

    try {
      const token =
        localStorage.getItem(
          "access_token"
        )

      const response = await fetch(
        `${API_URL}/departments`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: departmentName.trim(),
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to create department."
        )
      }

      setDepartmentName("")

      setSuccessMessage(
        "Department created successfully."
      )

      await loadDepartments()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create department."
      )
    } finally {
      setIsAddingDepartment(false)
    }
  }

  const handleAddOfficer = async (
    event
  ) => {
    event.preventDefault()

    setErrorMessage("")
    setSuccessMessage("")

    if (!selectedDepartmentId) {
      setErrorMessage(
        "Please select a department."
      )
      return
    }

    if (!officerName.trim()) {
      setErrorMessage(
        "Please enter officer name."
      )
      return
    }

    if (!officerEmail.trim()) {
      setErrorMessage(
        "Please enter officer email."
      )
      return
    }

    setIsAddingOfficer(true)

    try {
      const token =
        localStorage.getItem(
          "access_token"
        )

      const response = await fetch(
        `${API_URL}/officers`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: officerName.trim(),

            email:
              officerEmail
                .trim()
                .toLowerCase(),

            department_id:
              selectedDepartmentId,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to create officer."
        )
      }

      setOfficerName("")
      setOfficerEmail("")

      setSuccessMessage(
        "Officer created successfully."
      )

      await loadOfficers(
        selectedDepartmentId
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create officer."
      )
    } finally {
      setIsAddingOfficer(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-600">
            Loading management page...
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
            Department & Officer Management
          </h1>

          <p className="mt-2 text-gray-600">
            Manage departments and officers used
            for assigning civic reports.
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

        <div className="mt-8 grid gap-8 lg:grid-cols-2">

          {/* DEPARTMENTS */}

          <section className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="text-2xl font-bold text-gray-900">
              Departments
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Create departments responsible for
              civic issues.
            </p>

            <form
              onSubmit={
                handleAddDepartment
              }
              className="mt-6"
            >
              <label className="block text-sm font-semibold text-gray-700">
                Department Name
              </label>

              <input
                type="text"
                value={departmentName}
                onChange={(event) =>
                  setDepartmentName(
                    event.target.value
                  )
                }
                placeholder="Example: Water Department"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
              />

              <button
                type="submit"
                disabled={
                  isAddingDepartment
                }
                className="mt-4 w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {isAddingDepartment
                  ? "Adding..."
                  : "Add Department"}
              </button>
            </form>

            <div className="mt-8">

              <h3 className="font-semibold text-gray-900">
                Existing Departments
              </h3>

              {departments.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">
                  No departments available.
                </p>
              ) : (
                <div className="mt-3 space-y-3">

                  {departments.map(
                    (department) => (
                      <button
                        key={
                          department.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedDepartmentId(
                            department.id
                          )
                        }
                        className={`w-full rounded-lg border p-4 text-left transition ${
                          selectedDepartmentId ===
                          department.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 bg-gray-50 hover:border-blue-300"
                        }`}
                      >
                        <p className="font-semibold text-gray-900">
                          {
                            department.name
                          }
                        </p>

                        <p className="mt-1 break-all text-xs text-gray-500">
                          ID:{" "}
                          {department.id}
                        </p>
                      </button>
                    )
                  )}

                </div>
              )}

            </div>

          </section>

          {/* OFFICERS */}

          <section className="rounded-xl border bg-white p-6 shadow-sm">

            <h2 className="text-2xl font-bold text-gray-900">
              Officers
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Add officers and connect them with a
              department.
            </p>

            <form
              onSubmit={handleAddOfficer}
              className="mt-6 space-y-4"
            >

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Department
                </label>

                <select
                  value={
                    selectedDepartmentId
                  }
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
                        key={
                          department.id
                        }
                        value={
                          department.id
                        }
                      >
                        {
                          department.name
                        }
                      </option>
                    )
                  )}

                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Officer Name
                </label>

                <input
                  type="text"
                  value={officerName}
                  onChange={(event) =>
                    setOfficerName(
                      event.target.value
                    )
                  }
                  placeholder="Enter officer name"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Officer Email
                </label>

                <input
                  type="email"
                  value={officerEmail}
                  onChange={(event) =>
                    setOfficerEmail(
                      event.target.value
                    )
                  }
                  placeholder="officer@example.com"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={
                  isAddingOfficer
                }
                className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
              >
                {isAddingOfficer
                  ? "Adding..."
                  : "Add Officer"}
              </button>

            </form>

            <div className="mt-8">

              <h3 className="font-semibold text-gray-900">
                Officers in Selected Department
              </h3>

              {!selectedDepartmentId ? (
                <p className="mt-3 text-sm text-gray-500">
                  Select a department to view its
                  officers.
                </p>
              ) : officers.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">
                  No officers in this department.
                </p>
              ) : (
                <div className="mt-3 space-y-3">

                  {officers.map(
                    (officer) => (
                      <div
                        key={officer.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                      >
                        <p className="font-semibold text-gray-900">
                          {officer.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          {officer.email}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          {
                            officer.department_name
                          }
                        </p>
                      </div>
                    )
                  )}

                </div>
              )}

            </div>

          </section>

        </div>

      </div>
    </main>
  )
}

export default AdminManagement