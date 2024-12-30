import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/Dashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    registeredEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0
  });
  const [events, setEvents] = useState([]);

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
        if (!data.isAuthenticated || data.user.role !== 'student') {
          navigate('/');
          return;
        }

        setUserData(data.user);
        // Fetch dashboard stats here
        // This is a placeholder. Replace with actual API calls
        setStats({
          registeredEvents: 8,
          upcomingEvents: 3,
          completedEvents: 5
        });

        // Fetch events
        // This is a placeholder. Replace with actual API calls
        setEvents([
          {
            id: 1,
            title: 'Career Fair 2024',
            date: '2024-01-15',
            description: 'Annual career fair with top companies',
            status: 'upcoming'
          },
          {
            id: 2,
            title: 'Tech Workshop',
            date: '2024-01-20',
            description: 'Learn the latest web development technologies',
            status: 'registered'
          },
          {
            id: 3,
            title: 'Sports Festival',
            date: '2024-01-25',
            description: 'Annual inter-university sports competition',
            status: 'completed'
          }
        ]);
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/');
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
        navigate('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!userData) {
    return null;
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <i className="fas fa-building brand-logo"></i>
          <h1 className="brand-name">EventHub</h1>
        </div>
        
        <nav className="nav-links">
          <a href="#dashboard" className="nav-link active">
            <i className="fas fa-home"></i>
            Dashboard
          </a>
          <a href="#events" className="nav-link">
            <i className="fas fa-calendar-alt"></i>
            Events
          </a>
          <a href="#certificates" className="nav-link">
            <i className="fas fa-certificate"></i>
            Certificates
          </a>
          <a href="#profile" className="nav-link">
            <i className="fas fa-user"></i>
            Profile
          </a>
          <a href="#settings" className="nav-link">
            <i className="fas fa-cog"></i>
            Settings
          </a>
          <a href="#" onClick={handleLogout} className="nav-link">
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="main-header">
          <div className="welcome-section">
            <h1>Welcome back, {userData.name}!</h1>
            <p>Stay updated with your registered events and activities.</p>
          </div>
          
          <div className="header-actions">
            <div className="user-profile">
              <i className="fas fa-user-circle profile-pic"></i>
              <div className="user-info">
                <span>{userData.name}</span>
              </div>
            </div>
          </div>
        </header>

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

        <div className="event-list">
          <h2>Your Events</h2>
          {events.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-header">
                <h3 className="event-title">{event.title}</h3>
                <span className="event-date">{event.date}</span>
              </div>
              <p className="event-details">{event.description}</p>
              <div className="event-footer">
                <span className={`event-status status-${event.status}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
