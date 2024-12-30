import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/Dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalStudents: 0,
    totalOfficers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user stats
        const statsResponse = await fetch('http://localhost:2025/api/users/stats', {
          credentials: 'include'
        });

        if (!statsResponse.ok) {
          if (statsResponse.status === 401) {
            navigate('/');
            return;
          }
          throw new Error('Failed to fetch user statistics');
        }

        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch pending users
        const pendingResponse = await fetch('http://localhost:2025/api/users/pending', {
          credentials: 'include'
        });

        if (!pendingResponse.ok) {
          throw new Error('Failed to fetch pending users');
        }

        const pendingData = await pendingResponse.json();
        setPendingUsers(pendingData);
      } catch (error) {
        console.error('Dashboard error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleApproveUser = async (userId, role) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:2025/api/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        throw new Error('Failed to approve user');
      }

      setPendingUsers(pendingUsers.filter(user => user._id !== userId));
      setStats(prev => ({
        ...prev,
        totalPending: prev.totalPending - 1,
        [role === 'student' ? 'totalStudents' : 'totalOfficers']: 
          prev[role === 'student' ? 'totalStudents' : 'totalOfficers'] + 1
      }));
      setSuccessMessage('User approved successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleArchiveUser = async (userId) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:2025/api/users/${userId}/archive`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to archive user');
      }

      setPendingUsers(pendingUsers.filter(user => user._id !== userId));
      setStats(prev => ({
        ...prev,
        totalPending: prev.totalPending - 1
      }));
      setSuccessMessage('User archived successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`http://localhost:2025/api/users/${userId}/delete`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setPendingUsers(pendingUsers.filter(user => user._id !== userId));
      setStats(prev => ({
        ...prev,
        totalPending: prev.totalPending - 1
      }));
      setSuccessMessage('User deleted successfully');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        navigate('/');
      }
    } catch (error) {
      setError('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <i className="fas fa-user-shield"></i>
          </div>
          <h1 className="brand-name">Admin</h1>
        </div>

        <nav className="nav-links">
          <a href="#dashboard" className="nav-link active">
            <i className="fas fa-home"></i>
            Dashboard
          </a>
          <a href="#users" className="nav-link">
            <i className="fas fa-users"></i>
            Users
          </a>
          <a href="#events" className="nav-link">
            <i className="fas fa-calendar"></i>
            Events
          </a>
          <a href="#reports" className="nav-link">
            <i className="fas fa-chart-bar"></i>
            Reports
          </a>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            {successMessage}
          </div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Pending Users</h3>
              <div className="card-icon warning">
                <i className="fas fa-user-clock"></i>
              </div>
            </div>
            <div className="card-content">
              <div className="stat-number">{stats.totalPending}</div>
              <div className="stat-label">Awaiting Approval</div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Active Students</h3>
              <div className="card-icon success">
                <i className="fas fa-user-graduate"></i>
              </div>
            </div>
            <div className="card-content">
              <div className="stat-number">{stats.totalStudents}</div>
              <div className="stat-label">Registered Students</div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Active Officers</h3>
              <div className="card-icon info">
                <i className="fas fa-user-tie"></i>
              </div>
            </div>
            <div className="card-content">
              <div className="stat-number">{stats.totalOfficers}</div>
              <div className="stat-label">Organization Officers</div>
            </div>
          </div>
        </div>

        <div className="pending-users">
          <h2>Pending User Approvals</h2>
          {pendingUsers.length === 0 ? (
            <div className="no-pending">No pending users to approve</div>
          ) : (
            <div className="users-grid">
              {pendingUsers.map(user => (
                <div key={user._id} className="user-card">
                  <div className="user-info">
                    <h3>{user.fullName}</h3>
                    <p className="email">{user.email}</p>
                    <p className="details">Student ID: {user.studentId}</p>
                    <p className="details">Course: {user.course}</p>
                    <p className="details">Year Level: {user.yearLevel}</p>
                    <p className="registration-date">
                      Registered: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="action-buttons">
                    <div className="role-buttons">
                      <button
                        onClick={() => handleApproveUser(user._id, 'student')}
                        className="approve-student"
                      >
                        Approve as Student
                      </button>
                      <button
                        onClick={() => handleApproveUser(user._id, 'officer')}
                        className="approve-officer"
                      >
                        Approve as Officer
                      </button>
                    </div>
                    <div className="other-actions">
                      <button
                        onClick={() => handleArchiveUser(user._id)}
                        className="archive"
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
