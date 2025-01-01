import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Users.css';
import '../../styles/StudentTable.css';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalPending: 0,
    totalStudents: 0,
    totalOfficers: 0
  });

  useEffect(() => {
    checkAuth();
    fetchUsers();
    fetchStats();
  }, []);

  // ... keep existing auth and fetch functions ...

  const filteredUsers = users.filter(user => {
    const searchString = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>User Management</h2>
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon pending">
            <i className="fas fa-user-clock"></i>
          </div>
          <div className="stat-info">
            <h3>Pending Users</h3>
            <p>{stats.totalPending}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon student">
            <i className="fas fa-user-graduate"></i>
          </div>
          <div className="stat-info">
            <h3>Students</h3>
            <p>{stats.totalStudents}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon officer">
            <i className="fas fa-user-tie"></i>
          </div>
          <div className="stat-info">
            <h3>Officers</h3>
            <p>{stats.totalOfficers}</p>
          </div>
        </div>
      </div>

      <div className="student-table-container">
        <table className="student-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td>
                  <span className="student-name">{user.firstName} {user.lastName}</span>
                </td>
                <td>
                  <span className="student-email">{user.email}</span>
                </td>
                <td>
                  <span className="student-year">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td>
                  <span className={`student-status ${user.status}`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td>
                  {user.status === 'pending' && (
                    <div className="student-actions">
                      <button
                        className="student-action-btn edit"
                        onClick={() => handleApproveUser(user._id)}
                        title="Approve as Student"
                      >
                        <i className="fas fa-user-graduate"></i>
                      </button>
                      <button
                        className="student-action-btn edit"
                        onClick={() => handleApproveAsOfficer(user._id)}
                        title="Approve as Officer"
                      >
                        <i className="fas fa-user-tie"></i>
                      </button>
                      <button
                        className="student-action-btn delete"
                        onClick={() => handleArchiveUser(user._id)}
                        title="Archive User"
                      >
                        <i className="fas fa-archive"></i>
                      </button>
                      <button
                        className="student-action-btn delete"
                        onClick={() => handleDeleteUser(user._id)}
                        title="Delete User"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users; 