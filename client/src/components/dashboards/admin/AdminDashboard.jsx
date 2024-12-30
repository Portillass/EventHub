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
    fetchPendingUsers();
    fetchUserStats();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/users/pending', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setPendingUsers(data);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/users/stats', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const handleApproveUser = async (userId, role) => {
    try {
      const response = await fetch(`http://localhost:2025/api/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role })
      });

      const data = await response.json();
      if (response.ok) {
        setPendingUsers(pendingUsers.filter(user => user._id !== userId));
        setSuccessMessage('User approved successfully');
        fetchUserStats();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to approve user');
    }
  };

  const handleArchiveUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:2025/api/users/${userId}/archive`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        setPendingUsers(pendingUsers.filter(user => user._id !== userId));
        setSuccessMessage('User archived successfully');
        fetchUserStats();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to archive user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`http://localhost:2025/api/users/${userId}/delete`, {
          method: 'POST',
          credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
          setPendingUsers(pendingUsers.filter(user => user._id !== userId));
          setSuccessMessage('User deleted successfully');
          fetchUserStats();
        } else {
          setError(data.message);
        }
      } catch (error) {
        setError('Failed to delete user');
      }
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
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header>
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="stats-container">
        <div className="stat-card">
          <h3>Pending Users</h3>
          <p>{stats.totalPending}</p>
        </div>
        <div className="stat-card">
          <h3>Active Students</h3>
          <p>{stats.totalStudents}</p>
        </div>
        <div className="stat-card">
          <h3>Active Officers</h3>
          <p>{stats.totalOfficers}</p>
        </div>
      </div>

      <div className="pending-users-container">
        <h2>Pending Users</h2>
        {pendingUsers.length === 0 ? (
          <p>No pending users</p>
        ) : (
          <div className="users-grid">
            {pendingUsers.map(user => (
              <div key={user._id} className="user-card">
                <h3>{user.fullName}</h3>
                <p>Email: {user.email}</p>
                <p>Student ID: {user.studentId}</p>
                <p>Course: {user.course}</p>
                <p>Year Level: {user.yearLevel}</p>
                <div className="action-buttons">
                  <button onClick={() => handleApproveUser(user._id, 'student')}>
                    Approve as Student
                  </button>
                  <button onClick={() => handleApproveUser(user._id, 'officer')}>
                    Approve as Officer
                  </button>
                  <button onClick={() => handleArchiveUser(user._id)}>
                    Archive
                  </button>
                  <button onClick={() => handleDeleteUser(user._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
