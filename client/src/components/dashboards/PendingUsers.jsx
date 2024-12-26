import React, { useState, useEffect } from 'react';
import '../../styles/PendingUsers.css';

const PendingUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
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
      setIsLoading(false);
    }
  };

  const handleAction = async (userId, action, role = null) => {
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

      // Refresh the list after action
      fetchPendingUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) return <div className="loading">Loading pending users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="pending-users">
      <h2>Pending Users</h2>
      {pendingUsers.length === 0 ? (
        <p className="no-pending">No pending users at the moment</p>
      ) : (
        <div className="users-grid">
          {pendingUsers.map(user => (
            <div key={user._id} className="user-card">
              <div className="user-info">
                <h3>{user.name}</h3>
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
                    className="approve-student"
                    onClick={() => handleAction(user._id, 'approve', 'student')}
                  >
                    Approve as Student
                  </button>
                  <button 
                    className="approve-officer"
                    onClick={() => handleAction(user._id, 'approve', 'officer')}
                  >
                    Approve as Officer
                  </button>
                </div>
                <div className="other-actions">
                  <button 
                    className="archive"
                    onClick={() => handleAction(user._id, 'archive')}
                  >
                    Archive
                  </button>
                  <button 
                    className="delete"
                    onClick={() => handleAction(user._id, 'delete')}
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
  );
};

export default PendingUsers;
