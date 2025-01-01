import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/Dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState({
    totalPending: 0,
    totalStudents: 0,
    totalOfficers: 0
  });
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'

  useEffect(() => {
    checkAuth();
    fetchPendingUsers();
    fetchAllUsers();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/auth/current-user', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();
      if (!data.isAuthenticated || data.user.role !== 'admin') {
        navigate('/');
        return;
      }

      setUserData(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/');
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/users/pending', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch pending users');
      const data = await response.json();
      setPendingUsers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/users/all', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch all users');
      const data = await response.json();
      setAllUsers(data);
    } catch (error) {
      console.error('Failed to fetch all users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/users/stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleUserAction = async (userId, action, role = null) => {
    try {
      setError(null);
      const endpoint = action === 'delete' 
        ? `http://localhost:2025/api/users/${userId}/delete`
        : action === 'archive'
        ? `http://localhost:2025/api/users/${userId}/archive`
        : `http://localhost:2025/api/users/${userId}/approve`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role })
      });

      if (!response.ok) throw new Error('Failed to update user');
      
      const data = await response.json();
      setSuccessMessage(data.message);
      
      // Refresh data
      fetchPendingUsers();
      fetchAllUsers();
      fetchStats();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
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
      console.error('Logout failed:', error);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-badge approved';
      case 'pending':
        return 'status-badge pending';
      case 'archived':
        return 'status-badge rejected';
      default:
        return 'status-badge';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'role-badge admin';
      case 'officer':
        return 'role-badge officer';
      case 'student':
        return 'role-badge student';
      default:
        return 'role-badge';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <i className="fas fa-shield-alt brand-logo"></i>
          <h1 className="brand-name">EventHub</h1>
        </div>
        
        <nav className="nav-links">
          <a href="#dashboard" className="nav-link active">
            <i className="fas fa-home"></i>
            Dashboard
          </a>
          <a href="#users" className="nav-link">
            <i className="fas fa-users"></i>
            Users
            {stats.totalPending > 0 && (
              <span className="badge">{stats.totalPending}</span>
            )}
          </a>
          <a href="#events" className="nav-link">
            <i className="fas fa-calendar-alt"></i>
            Events
          </a>
          <a href="#reports" className="nav-link">
            <i className="fas fa-chart-bar"></i>
            Reports
          </a>
          <a href="#settings" className="nav-link">
            <i className="fas fa-cog"></i>
            Settings
          </a>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="main-header">
          <div className="welcome-section">
            <h1>Admin Dashboard</h1>
            <p>Manage users, events, and system settings</p>
          </div>
          
          <div className="header-actions">
            <div className="user-profile">
              <div className="profile-pic">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-info">
                <span className="user-name">{userData?.fullName}</span>
                <span className="user-role">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

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

        <div className="recent-events">
          <div className="section-header">
            <div className="tab-buttons">
              <button 
                className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending Users
              </button>
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Users
              </button>
            </div>
            <button 
              className="view-all-btn" 
              onClick={activeTab === 'pending' ? fetchPendingUsers : fetchAllUsers}
            >
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>

          <div className="events-table">
            {activeTab === 'pending' ? (
              pendingUsers.length === 0 ? (
                <div className="no-pending">No pending users at the moment.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Registration Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map(user => (
                      <tr key={user._id}>
                        <td>{user.fullName}</td>
                        <td>{user.email}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleUserAction(user._id, 'approve', 'student')}
                              className="action-btn approve-student"
                              title="Approve as Student"
                            >
                              <i className="fas fa-user-graduate"></i>
                            </button>
                            <button
                              onClick={() => handleUserAction(user._id, 'approve', 'officer')}
                              className="action-btn approve-officer"
                              title="Approve as Officer"
                            >
                              <i className="fas fa-user-tie"></i>
                            </button>
                            <button
                              onClick={() => handleUserAction(user._id, 'archive')}
                              className="action-btn archive"
                              title="Archive User"
                            >
                              <i className="fas fa-archive"></i>
                            </button>
                            <button
                              onClick={() => handleUserAction(user._id, 'delete')}
                              className="action-btn delete"
                              title="Delete User"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registration Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.fullName}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={getRoleBadgeClass(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(user.status)}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          {user.role !== 'admin' && (
                            <>
                              {user.status !== 'active' && (
                                <>
                                  <button
                                    onClick={() => handleUserAction(user._id, 'approve', 'student')}
                                    className="action-btn approve-student"
                                    title="Approve as Student"
                                  >
                                    <i className="fas fa-user-graduate"></i>
                                  </button>
                                  <button
                                    onClick={() => handleUserAction(user._id, 'approve', 'officer')}
                                    className="action-btn approve-officer"
                                    title="Approve as Officer"
                                  >
                                    <i className="fas fa-user-tie"></i>
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleUserAction(user._id, 'archive')}
                                className="action-btn archive"
                                title="Archive User"
                              >
                                <i className="fas fa-archive"></i>
                              </button>
                              <button
                                onClick={() => handleUserAction(user._id, 'delete')}
                                className="action-btn delete"
                                title="Delete User"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
