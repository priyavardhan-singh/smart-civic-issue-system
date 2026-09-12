import AdminReportDetails from './pages/AdminReportDetails'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ReportIssue from './pages/ReportIssue'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Navbar from './components/navbar'
import Home from './pages/Home'
import MyReports from './pages/MyReports'
import Profile from './pages/Profile'
import AdminManagement from './pages/AdminManagement'
import OfficerDashboard from './pages/OfficerDashboard'


function RoleRoute({
  allowedRoles,
  children,
}) {
  const token =
    localStorage.getItem('access_token')

  const storedUser =
    localStorage.getItem('user')

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />
  }

  const user =
    JSON.parse(storedUser)

  if (
    !allowedRoles.includes(user.role)
  ) {
    if (user.role === 'admin') {
      return (
        <Navigate
          to="/admin"
          replace
        />
      )
    }

    if (user.role === 'officer') {
      return (
        <Navigate
          to="/officer"
          replace
        />
      )
    }

    return (
      <Navigate
        to="/my-reports"
        replace
      />
    )
  }

  return children
}


function HomeRedirect() {
  const storedUser =
    localStorage.getItem('user')

  if (!storedUser) {
    return <Home />
  }

  const user =
    JSON.parse(storedUser)

  if (user.role === 'admin') {
    return (
      <Navigate
        to="/admin"
        replace
      />
    )
  }

  if (user.role === 'officer') {
    return (
      <Navigate
        to="/officer"
        replace
      />
    )
  }

  return <Home />
}


function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        {/* PUBLIC / CITIZEN HOME */}

        <Route
          path="/"
          element={<HomeRedirect />}
        />

        {/* CITIZEN */}

        <Route
          path="/report"
          element={
            <RoleRoute
              allowedRoles={[
                'citizen',
              ]}
            >
              <ReportIssue />
            </RoleRoute>
          }
        />

        <Route
          path="/my-reports"
          element={
            <RoleRoute
              allowedRoles={[
                'citizen',
              ]}
            >
              <MyReports />
            </RoleRoute>
          }
        />

        {/* SHARED PROFILE */}

        <Route
          path="/profile"
          element={
            <RoleRoute
              allowedRoles={[
                'citizen',
                'admin',
                'officer',
              ]}
            >
              <Profile />
            </RoleRoute>
          }
        />

        {/* AUTH */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* ADMIN */}

        <Route
          path="/admin"
          element={
            <RoleRoute
              allowedRoles={[
                'admin',
              ]}
            >
              <AdminDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/reports/:reportId"
          element={
            <RoleRoute
              allowedRoles={[
                'admin',
              ]}
            >
              <AdminReportDetails />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/manage"
          element={
            <RoleRoute
              allowedRoles={[
                'admin',
              ]}
            >
              <AdminManagement />
            </RoleRoute>
          }
        />

        {/* OFFICER */}

        <Route
          path="/officer"
          element={
            <RoleRoute
              allowedRoles={[
                'officer',
              ]}
            >
              <OfficerDashboard />
            </RoleRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App