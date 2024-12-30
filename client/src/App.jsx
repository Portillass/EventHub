import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import LandingPage from './components/LandingPage'
import AdminDashboard from './components/dashboards/admin/AdminDashboard'
import OfficerDashboard from './components/dashboards/officer/OfficerDashboard'
import StudentDashboard from './components/dashboards/student/StudentDashboard'
import PendingUsers from './components/dashboards/pending/PendingUsers'
import Loading from './components/Loading'

// Silence React Router future warnings
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [userStatus, setUserStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:2025/api/auth/current-user', {
          credentials: 'include'
        })
        
        const data = await response.json()
        
        if (data.isAuthenticated && data.user) {
          setIsAuthenticated(true)
          setUserRole(data.user.role)
          setUserStatus(data.user.status)
        } else {
          setIsAuthenticated(false)
          setUserRole(null)
          setUserStatus(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
        setUserRole(null)
        setUserStatus(null)
      }
    }

    checkAuth()
  }, [])

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  if (isLoading) {
    return <Loading onLoadingComplete={handleLoadingComplete} />
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            userStatus === 'pending' ? (
              <Navigate to="/pending" replace />
            ) : (
              userRole === 'admin' ? (
                <AdminDashboard />
              ) : userRole === 'officer' ? (
                <OfficerDashboard />
              ) : (
                <StudentDashboard />
              )
            )
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      
      <Route
        path="/pending" 
        element={
          isAuthenticated && userStatus === 'pending' ? (
            <PendingUsers />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
