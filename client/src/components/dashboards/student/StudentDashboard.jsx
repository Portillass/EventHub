import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    checkAuth();
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
        credentials: 'include'
      });

      if (response.ok) {
        navigate('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'events':
        return <StudentEvents />;
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
          <i className="fas fa-building brand-logo"></i>
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
          <a href="#profile" className="nav-link">
            <i className="fas fa-user"></i>
            Profile
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

      <main className="dashboard-main">
        <header className="main-header">
          <div className="welcome-section">
            <h1>Welcome back, {userData.firstName}!</h1>
            <p>Stay updated with your registered events and activities.</p>
          </div>
          
          <div className="header-actions">
            <div className="user-profile">
              <i className="fas fa-user-circle profile-pic"></i>
              <div className="user-info">
                <span>{userData.firstName} {userData.lastName}</span>
              </div>
            </div>
          </div>
        </header>

        {renderMainContent()}
      </main>
    </div>
  );
};

export default StudentDashboard;
