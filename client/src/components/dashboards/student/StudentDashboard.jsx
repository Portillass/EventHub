import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa';
import StudentEvents from '../events/StudentEvents';
import '../../../styles/Dashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    registeredEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0
  });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [attendanceId, setAttendanceId] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    fullName: '',
    yearLevel: '',
    course: ''
  });
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [attendanceType, setAttendanceType] = useState('in');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (userData && activeSection === 'attendance') {
      checkActiveAttendance();
    }
  }, [userData, activeSection]);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/auth/current-user', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();
      if (!data.isAuthenticated || data.user.role !== 'student') {
        navigate('/');
        return;
      }

      setUserData(data.user);
      // Fetch dashboard stats
      const eventsResponse = await fetch('http://localhost:2025/api/events', {
        credentials: 'include'
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        const approvedEvents = eventsData.filter(event => event.status === 'approved');
        const now = new Date();
        const upcomingEvents = approvedEvents.filter(event => new Date(event.date) >= now);
        const pastEvents = approvedEvents.filter(event => new Date(event.date) < now);
        
        setStats({
          registeredEvents: approvedEvents.length,
          upcomingEvents: upcomingEvents.length,
          completedEvents: pastEvents.length
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/');
    } finally {
      setLoading(false);
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

  const checkActiveAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const response = await fetch(`http://localhost:2025/api/attendance/student/${userData.studentId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const records = await response.json();
        const activeRecord = records.find(record => !record.timeOut);
        if (activeRecord) {
          setAttendanceId(activeRecord._id);
        }
      }
    } catch (error) {
      console.error('Error checking active attendance:', error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/events', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // Filter only approved and upcoming events
        const approvedEvents = data.filter(event => 
          event.status === 'approved' && new Date(event.date) >= new Date()
        );
        setEvents(approvedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setAttendanceLoading(true);

      if (!formData.studentId) {
        setError('Please enter your Student ID');
        return;
      }

      if (attendanceType === 'in') {
        // Validate all fields are filled
        if (!formData.studentId || !formData.fullName || !formData.yearLevel || !formData.course || !selectedEvent) {
          setError('Please fill in all fields and select an event');
          return;
        }

        // Mark attendance in
        const checkinResponse = await fetch('http://localhost:2025/api/attendance/checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            studentId: formData.studentId,
            fullName: formData.fullName,
            yearLevel: formData.yearLevel,
            course: formData.course,
            event: selectedEvent === 'daily' ? null : selectedEvent,
            title: selectedEvent === 'daily' ? 'Daily Attendance' : events.find(e => e._id === selectedEvent)?.title || 'Daily Attendance'
          })
        });

        if (!checkinResponse.ok) {
          const errorData = await checkinResponse.json();
          throw new Error(errorData.message || 'Failed to mark attendance in');
        }

        setSuccessMessage('Attendance In marked successfully!');
      } else {
        // First check if there's an active attendance record
        const response = await fetch(`http://localhost:2025/api/attendance/student/${formData.studentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch attendance records');
        }

        const records = await response.json();
        const activeRecord = records.find(record => !record.timeOut);

        if (!activeRecord) {
          throw new Error('No active attendance session found for this student ID');
        }

        // Mark attendance out
        const checkoutResponse = await fetch(`http://localhost:2025/api/attendance/checkout/${activeRecord._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            timeOut: new Date().toISOString()
          })
        });

        if (!checkoutResponse.ok) {
          const errorData = await checkoutResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to mark attendance out');
        }

        setSuccessMessage('Attendance Out marked successfully!');
      }

      // Show success modal
      setShowSuccessModal(true);
      // Auto-hide success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        setSuccessMessage('');
      }, 3000);

      // Clear form and refresh attendance status
      setFormData({
        studentId: '',
        fullName: '',
        yearLevel: '',
        course: ''
      });
      setSelectedEvent('');
      setAttendanceType('in');
      checkActiveAttendance();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to process attendance. Please try again.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'events':
        return <StudentEvents />;
      case 'attendance':
        return (
          <div className="attendance-section">
            <h2>Attendance Form</h2>
            {attendanceLoading ? (
              <div className="loading-spinner">Loading...</div>
            ) : (
              <div className="attendance-form">
                <div className="attendance-type-selector">
                  <button 
                    className={`type-btn ${attendanceType === 'in' ? 'active' : ''}`}
                    onClick={() => setAttendanceType('in')}
                  >
                    Attendance In
                  </button>
                  <button 
                    className={`type-btn ${attendanceType === 'out' ? 'active' : ''}`}
                    onClick={() => setAttendanceType('out')}
                  >
                    Attendance Out
                  </button>
                </div>

                {attendanceType === 'in' && (
                  <div className="form-group">
                    <label>Event:</label>
                    <select
                      name="event"
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      className="form-control"
                      required
                    >
                      <option value="">Select Event</option>
                      <option value="daily">Daily Attendance</option>
                      {events.map(event => (
                        <option key={event._id} value={event._id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Student ID:</label>
                  <input 
                    type="text" 
                    name="studentId"
                    value={formData.studentId} 
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter your Student ID"
                    required
                  />
                </div>

                {attendanceType === 'in' && (
                  <>
                    <div className="form-group">
                      <label>Full Name:</label>
                      <input 
                        type="text" 
                        name="fullName"
                        value={formData.fullName} 
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="Enter your Full Name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Year Level:</label>
                      <select
                        name="yearLevel"
                        value={formData.yearLevel}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      >
                        <option value="">Select Year Level</option>
                        <option value="First Year">First Year</option>
                        <option value="Second Year">Second Year</option>
                        <option value="Third Year">Third Year</option>
                        <option value="Fourth Year">Fourth Year</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Course:</label>
                      <input 
                        type="text" 
                        name="course"
                        value={formData.course} 
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="Enter your Course"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Current Date & Time:</label>
                  <input 
                    type="text" 
                    value={new Date().toLocaleString()} 
                    disabled 
                    className="form-control"
                  />
                </div>

                <div className="attendance-buttons">
                  <button 
                    onClick={handleAttendanceSubmit}
                    className={`btn-attendance-${attendanceType}`}
                    disabled={attendanceLoading || 
                      (attendanceType === 'in' && (!selectedEvent || !formData.studentId || !formData.fullName || !formData.yearLevel || !formData.course)) ||
                      (attendanceType === 'out' && !formData.studentId)}
                  >
                    {attendanceType === 'in' ? 'Mark Attendance In' : 'Mark Attendance Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="dashboard-content">
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Registered Events</h3>
                  <div className="card-icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                </div>
                <div className="card-content">
                  <div className="stat-number">{stats.registeredEvents}</div>
                  <div className="stat-label">Total events registered</div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Upcoming Events</h3>
                  <div className="card-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                </div>
                <div className="card-content">
                  <div className="stat-number">{stats.upcomingEvents}</div>
                  <div className="stat-label">Events this month</div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Completed Events</h3>
                  <div className="card-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                </div>
                <div className="card-content">
                  <div className="stat-number">{stats.completedEvents}</div>
                  <div className="stat-label">Events attended</div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!userData) {
    return null;
  }

  return (
    <div className="dashboard">
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

      <main className="dashboard-main">
        <header className="main-header">
          <div className="welcome-section">
            <h1>Welcome back, {userData?.fullName}!</h1>
            <p>Track your attendance and manage your events.</p>
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
                <span className="user-role">Student</span>
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

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {renderMainContent()}
      </main>

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-content">
              <div className="success-icon">
                <FaCheck />
              </div>
              <h2>Congratulations!</h2>
              <p>{successMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
