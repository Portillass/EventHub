import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/Dashboard.css';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    memberCount: 0
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
        if (!data.isAuthenticated || data.user.role !== 'officer') {
          navigate('/');
          return;
        }

        setUserData(data.user);
        // Fetch dashboard stats here
        // This is a placeholder. Replace with actual API calls
        setStats({
          totalEvents: 15,
          upcomingEvents: 5,
          memberCount: 150
        });

        // Fetch events
        // This is a placeholder. Replace with actual API calls
        setEvents([
          {
            id: 1,
            title: 'Annual General Meeting',
            date: '2024-01-15',
            description: 'Annual meeting to discuss organization goals and achievements',
            status: 'approved'
          },
          {
            id: 2,
            title: 'Leadership Workshop',
            date: '2024-01-20',
            description: 'Workshop focused on developing leadership skills',
            status: 'pending'
          },
          {
            id: 3,
            title: 'Community Outreach',
            date: '2024-01-25',
            description: 'Community service event at local shelter',
            status: 'approved'
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
          <i className="fas fa-home brand-logo"></i>
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
          <a href="#members" className="nav-link">
            <i className="fas fa-users"></i>
            Members
          </a>
          <a href="#reports" className="nav-link">
            <i className="fas fa-chart-bar"></i>
            Reports
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
            <h1>Welcome back Officer, {userData.name}!</h1>
            <p>Manage your organization's events and members.</p>
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
              <h3>Total Events</h3>
              <div className="card-icon">
                <i className="fas fa-calendar"></i>
              </div>
            </div>
            <div className="card-content">
              <div className="stat-number">{stats.totalEvents}</div>
              <div className="stat-label">Events organized</div>
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
              <h3>Total Members</h3>
              <div className="card-icon">
                <i className="fas fa-users"></i>
              </div>
            </div>
            <div className="card-content">
              <div className="stat-number">{stats.memberCount}</div>
              <div className="stat-label">Active members</div>
            </div>
          </div>
        </div>

        <div className="event-list">
          <h2>Recent Events</h2>
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

export default OfficerDashboard;
