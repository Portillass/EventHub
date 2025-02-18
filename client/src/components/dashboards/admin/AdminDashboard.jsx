import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/Dashboard.css';
import AdminEvents from '../events/AdminEvents';
import AnalyticsDashboard from './AnalyticsDashboard';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState({
    totalPending: 0,
    totalStudents: 0,
    totalOfficers: 0
  });
  const [activeTab, setActiveTab] = useState('pending');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [titleFilter, setTitleFilter] = useState('all');
  const [yearLevelFilter, setYearLevelFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuth();
    fetchPendingUsers();
    fetchAllUsers();
    fetchStats();
    if (activeSection === 'attendance') {
      fetchAttendanceRecords();
    }
  }, [activeSection]);

  // Add auto-refresh every 30 seconds for attendance records
  useEffect(() => {
    let interval;
    if (activeSection === 'attendance') {
      interval = setInterval(fetchAttendanceRecords, 30000); // 30 seconds
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeSection]);

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
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Clear any local storage or state if needed
        localStorage.clear();
        // Force navigation to home page
        window.location.href = '/';
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force navigation to home page even if there's an error
      window.location.href = '/';
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

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:2025/api/attendance/all', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data);
      } else {
        throw new Error('Failed to fetch attendance records');
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setError('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not recorded';
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    };
  };

  const calculateDuration = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return 'In Progress';
    const start = new Date(timeIn);
    const end = new Date(timeOut);
    const diff = end - start;
    
    // Calculate hours, minutes and seconds
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Format the duration string
    let duration = '';
    if (hours > 0) duration += `${hours}h `;
    if (minutes > 0) duration += `${minutes}m `;
    if (seconds > 0) duration += `${seconds}s`;
    
    return duration.trim() || '0s';
  };

  const getFilteredAttendanceRecords = () => {
    return attendanceRecords.filter(record => {
      const matchesTitle = titleFilter === 'all' || record.title === titleFilter;
      const matchesYearLevel = yearLevelFilter === 'all' || record.yearLevel === yearLevelFilter;
      const matchesCourse = courseFilter === 'all' || record.course === courseFilter;
      const matchesSearch = !searchTerm || 
        record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.course.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesTitle && matchesYearLevel && matchesCourse && matchesSearch;
    });
  };

  const getUniqueValues = (field) => {
    const values = new Set(attendanceRecords.map(record => record[field]));
    return Array.from(values).filter(Boolean);
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'events':
        return <AdminEvents userRole="admin" />;
      case 'attendance':
        return (
          <div className="attendance-records">
            <div className="section-header">
              <h2>Attendance Records</h2>
              <div className="header-buttons">
                <button 
                  className="view-all-btn" 
                  onClick={fetchAttendanceRecords}
                >
                  <i className="fas fa-sync-alt"></i> Refresh
                </button>
                <button 
                  className="download-btn"
                  onClick={async () => {
                    try {
                      // Build query string with current filters
                      const queryParams = new URLSearchParams({
                        titleFilter,
                        yearLevelFilter,
                        courseFilter
                      }).toString();

                      const response = await fetch(`http://localhost:2025/api/attendance/download-excel?${queryParams}`, {
                        credentials: 'include'
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to download Excel file');
                      }
                      
                      // Create blob from response
                      const blob = await response.blob();
                      
                      // Create download link
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'attendance_records.xlsx';
                      
                      // Trigger download
                      document.body.appendChild(a);
                      a.click();
                      
                      // Cleanup
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (error) {
                      console.error('Error downloading Excel:', error);
                      setError('Failed to download Excel file. Please try again.');
                    }
                  }}
                >
                  <i className="fas fa-file-excel"></i> Download Excel
                </button>
              </div>
            </div>

            <div className="filter-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-group">
                <select
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  className="filter-select"
                >
                  {getUniqueValues('title').map(title => (
                    <option key={title} value={title}>
                      {title === 'all' ? 'All Events' : title}
                    </option>
                  ))}
                </select>

                <select
                  value={yearLevelFilter}
                  onChange={(e) => setYearLevelFilter(e.target.value)}
                  className="filter-select"
                >
                  {getUniqueValues('yearLevel').map(year => (
                    <option key={year} value={year}>
                      {year === 'all' ? 'All Year Levels' : year}
                    </option>
                  ))}
                </select>

                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="filter-select"
                >
                  {getUniqueValues('course').map(course => (
                    <option key={course} value={course}>
                      {course === 'all' ? 'All Courses' : course}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="attendance-table">
              {loading ? (
                <div className="loading-spinner">Loading attendance records...</div>
              ) : getFilteredAttendanceRecords().length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Full Name</th>
                      <th>Year Level</th>
                      <th>Course</th>
                      <th>Event</th>
                      <th>Date & Time In</th>
                      <th>Date & Time Out</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredAttendanceRecords().map((record) => {
                      const timeIn = formatDateTime(record.timeIn);
                      const timeOut = formatDateTime(record.timeOut);
                      const duration = calculateDuration(record.timeIn, record.timeOut);
                      const status = record.timeOut ? 'Completed' : 'Ongoing';

                      return (
                        <tr key={record._id}>
                          <td>{record.studentId}</td>
                          <td>{record.fullName}</td>
                          <td>{record.yearLevel}</td>
                          <td>{record.course}</td>
                          <td>{record.title || 'Daily Attendance'}</td>
                          <td>
                            <div className="datetime-display">
                              <div className="date">{timeIn.date}</div>
                              <div className="time" style={{ color: '#4CAF50' }}>{timeIn.time}</div>
                            </div>
                          </td>
                          <td>
                            {record.timeOut ? (
                              <div className="datetime-display">
                                <div className="date">{timeOut.date}</div>
                                <div className="time" style={{ color: '#f44336' }}>{timeOut.time}</div>
                              </div>
                            ) : (
                              <span style={{ color: '#FFC107' }}>Not checked out</span>
                            )}
                          </td>
                          <td>
                            <span style={{ 
                              color: record.timeOut ? '#4CAF50' : '#FFC107',
                              fontFamily: 'monospace'
                            }}>
                              {duration}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${status.toLowerCase()}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="no-records">
                  No attendance records found
                </div>
              )}
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="user-management">
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
        );
      default:
        return (
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
        );
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
          <i className="fas fa-home brand-logo"></i>
          <h1 className="brand-name">EventHub</h1>
        </div>
        
        <nav className="nav-links">
          <a 
            href="#dashboard" 
            className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('dashboard');
            }}
          >
            <i className="fas fa-home"></i>
            Dashboard
          </a>
          <a 
            href="#analytics" 
            className={`nav-link ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('analytics');
            }}
          >
            <i className="fas fa-chart-line"></i>
            Analytics
          </a>
          <a 
            href="#users" 
            className={`nav-link ${activeSection === 'users' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('users');
            }}
          >
            <i className="fas fa-users"></i>
            Users
            {stats.totalPending > 0 && (
              <span className="badge">{stats.totalPending}</span>
            )}
          </a>
          <a 
            href="#attendance" 
            className={`nav-link ${activeSection === 'attendance' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('attendance');
            }}
          >
            <i className="fas fa-clock"></i>
            Attendance
          </a>
          <a 
            href="#events" 
            className={`nav-link ${activeSection === 'events' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('events');
            }}
          >
            <i className="fas fa-calendar-alt"></i>
            Events
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="main-header">
          <div className="welcome-section">
            <h1>Welcome back Admin, {userData?.fullName}!</h1>
            <p>Manage your organization's users and events.</p>
          </div>
          
          <div className="header-actions">
            <div 
              className="user-profile"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="profile-pic">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-info">
                <span className="user-name">{userData?.fullName}</span>
                <span className="user-role">Admin</span>
              </div>
              <i className="fas fa-chevron-down"></i>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <a href="#profile" className="dropdown-item">
                    <i className="fas fa-user-circle"></i>
                    Profile
                  </a>
                  <a href="#settings" className="dropdown-item">
                    <i className="fas fa-cog"></i>
                    Settings
                  </a>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {renderMainContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
