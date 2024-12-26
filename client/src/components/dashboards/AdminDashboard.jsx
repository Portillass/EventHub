import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';
import Loading from '../Loading';
import { FaUsers, FaUserGraduate, FaUserTie, FaSpinner, FaCheck, FaTimes, FaArchive, FaTrash } from 'react-icons/fa';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    pendingApprovals: 0,
    activeOrganizations: 0,
    totalUsers: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState({
    totalPending: 0,
    totalStudents: 0,
    totalOfficers: 0
  });

  useEffect(() => {
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
          navigate('/login');
          return;
        }

        setUserData(data.user);
        // Fetch dashboard stats here
        // This is a placeholder. Replace with actual API calls
        setStats({
          totalEvents: 125,
          pendingApprovals: 8,
          activeOrganizations: 45,
          totalUsers: 1250
        });
        setRecentEvents([
          { id: 1, name: 'Tech Summit 2024', date: '2024-01-15', status: 'Approved', organizer: 'IT Society' },
          { id: 2, name: 'Cultural Night', date: '2024-01-20', status: 'Pending', organizer: 'Cultural Club' },
          { id: 3, name: 'Sports Festival', date: '2024-02-01', status: 'Approved', organizer: 'Sports Committee' }
        ]);
        fetchPendingUsers();
        fetchUserStats();
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/users/stats', {
        credentials: 'include'
      });
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:2025/api/users/pending', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending users');
      }

      const data = await response.json();
      setPendingUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action, role = null) => {
    try {
      const response = await fetch(`http://localhost:2025/api/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      // Refresh the lists after action
      fetchPendingUsers();
      fetchUserStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const StatsCards = () => (
    <div className="stats-cards">
      <div className="stat-card pending">
        <FaUsers className="stat-icon" />
        <div className="stat-info">
          <h3>Pending Users</h3>
          <p>{userStats.totalPending}</p>
        </div>
      </div>
      <div className="stat-card students">
        <FaUserGraduate className="stat-icon" />
        <div className="stat-info">
          <h3>Total Students</h3>
          <p>{userStats.totalStudents}</p>
        </div>
      </div>
      <div className="stat-card officers">
        <FaUserTie className="stat-icon" />
        <div className="stat-info">
          <h3>Total Officers</h3>
          <p>{userStats.totalOfficers}</p>
        </div>
      </div>
    </div>
  );

  const PendingUsersTable = () => {
    if (loading) return <div className="loading"><FaSpinner className="spinner" /> Loading pending users...</div>;
    if (error) return <div className="error">{error}</div>;
    if (pendingUsers.length === 0) return <div className="no-pending">No pending users at the moment</div>;

    return (
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Student ID</th>
              <th>Course</th>
              <th>Year Level</th>
              <th>Registration Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map(user => (
              <tr key={user._id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.studentId}</td>
                <td>{user.course}</td>
                <td>{user.yearLevel}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="action-buttons">
                  <button 
                    className="approve-student"
                    onClick={() => handleUserAction(user._id, 'approve', 'student')}
                    title="Approve as Student"
                  >
                    <FaUserGraduate />
                  </button>
                  <button 
                    className="approve-officer"
                    onClick={() => handleUserAction(user._id, 'approve', 'officer')}
                    title="Approve as Officer"
                  >
                    <FaUserTie />
                  </button>
                  <button 
                    className="archive"
                    onClick={() => handleUserAction(user._id, 'archive')}
                    title="Archive"
                  >
                    <FaArchive />
                  </button>
                  <button 
                    className="delete"
                    onClick={() => handleUserAction(user._id, 'delete')}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading) {
    return <Loading onLoadingComplete={() => setIsLoading(false)} />;
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <h1 className="brand-name">EventHub</h1>
        </div>
        
        <nav className="nav-links">
          <a href="/admin" className="nav-link active">
            <i className="fas fa-home"></i>
            <span>Dashboard</span>
          </a>
          <a href="/admin/events" className="nav-link">
            <i className="fas fa-calendar"></i>
            <span>Events</span>
          </a>
          <a href="/admin/organizations" className="nav-link">
            <i className="fas fa-users"></i>
            <span>Organizations</span>
          </a>
          <a href="/admin/approvals" className="nav-link">
            <i className="fas fa-check-circle"></i>
            <span>Approvals</span>
            {stats.pendingApprovals > 0 && (
              <span className="badge">{stats.pendingApprovals}</span>
            )}
          </a>
          <a href="/admin/users" className="nav-link">
            <i className="fas fa-user-friends"></i>
            <span>Users</span>
          </a>
          <a href="/admin/settings" className="nav-link">
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </a>
          <a href="#" onClick={handleLogout} className="nav-link">
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => navigate('/logout')} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="main-header">
          <div className="welcome-section">
            <h1>Welcome back, {userData.name}!</h1>
            <p>Here's what's happening with your events today</p>
          </div>
          
          <div className="header-actions">
            <button className="notification-btn">
              <i className="fas fa-bell"></i>
              <span className="notification-badge">3</span>
            </button>
            <div className="user-profile">
              <div className="profile-pic">
                <i className="fas fa-user-circle"></i>
              </div>
              <div className="user-info">
                <span className="user-name">{userData.name}</span>
                <span className="user-role">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="dashboard-grid">
          <div className="dashboard-card stat-card">
            <div className="card-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="card-content">
              <h3>Total Events</h3>
              <div className="stat-number">{stats.totalEvents}</div>
              <p className="stat-trend positive">
                <i className="fas fa-arrow-up"></i> 12% from last month
              </p>
            </div>
          </div>

          <div className="dashboard-card stat-card">
            <div className="card-icon warning">
              <i className="fas fa-clock"></i>
            </div>
            <div className="card-content">
              <h3>Pending Approvals</h3>
              <div className="stat-number">{stats.pendingApprovals}</div>
              <p className="stat-trend">Requires attention</p>
            </div>
          </div>

          <div className="dashboard-card stat-card">
            <div className="card-icon success">
              <i className="fas fa-users"></i>
            </div>
            <div className="card-content">
              <h3>Active Organizations</h3>
              <div className="stat-number">{stats.activeOrganizations}</div>
              <p className="stat-trend positive">
                <i className="fas fa-arrow-up"></i> 5 new this month
              </p>
            </div>
          </div>

          <div className="dashboard-card stat-card">
            <div className="card-icon info">
              <i className="fas fa-user-friends"></i>
            </div>
            <div className="card-content">
              <h3>Total Users</h3>
              <div className="stat-number">{stats.totalUsers}</div>
              <p className="stat-trend positive">
                <i className="fas fa-arrow-up"></i> Growing steadily
              </p>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <section className="recent-events">
          <div className="section-header">
            <h2>Recent Events</h2>
            <button className="view-all-btn">
              View All <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          
          <div className="events-table">
            <table>
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Organizer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map(event => (
                  <tr key={event.id}>
                    <td>{event.name}</td>
                    <td>{new Date(event.date).toLocaleDateString()}</td>
                    <td>{event.organizer}</td>
                    <td>
                      <span className={`status-badge ${event.status.toLowerCase()}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn" title="View Details">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="action-btn" title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="action-btn delete" title="Delete">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pending Users */}
        <section className="pending-users">
          <div className="section-header">
            <h2>Pending Users</h2>
            <button 
              className="refresh-button"
              onClick={fetchPendingUsers}
              title="Refresh list"
            >
              <FaSpinner className={loading ? 'spinner' : ''} />
            </button>
          </div>
          <StatsCards />
          <PendingUsersTable />
        </section>

        {/* Pending User Approvals */}
        <section className="dashboard-section">
          <h2>Pending User Approvals</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Student ID</th>
                  <th>Course</th>
                  <th>Year Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.studentId}</td>
                    <td>{user.course}</td>
                    <td>{user.yearLevel}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-success"
                          onClick={() => handleUserAction(user._id, 'approve', 'student')}
                        >
                          Approve as Student
                        </button>
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleUserAction(user._id, 'approve', 'officer')}
                        >
                          Approve as Officer
                        </button>
                        <button 
                          className="btn btn-warning"
                          onClick={() => handleUserAction(user._id, 'archive')}
                        >
                          Archive
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleUserAction(user._id, 'delete')}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
