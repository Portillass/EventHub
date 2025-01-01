import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaSearch, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../../styles/Events.css';

export default function StudentEvents() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchEvents();
  }, []);

  const checkAuthAndFetchEvents = async () => {
    try {
      // Check authentication first
      const authResponse = await axios.get('http://localhost:2025/api/auth/current-user', {
        withCredentials: true
      });

      if (!authResponse.data.isAuthenticated || authResponse.data.user.role !== 'student') {
        console.log('Not authenticated or not a student');
        navigate('/');
        return;
      }

      // If authenticated, fetch events
      await fetchEvents();
    } catch (error) {
      console.error('Authentication check failed:', error);
      navigate('/');
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:2025/api/events', {
        withCredentials: true
      });

      // Server already filters for approved events, but let's double-check
      const approvedEvents = response.data.filter(event => event.status === 'approved');
      
      // Sort by date
      approvedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setEvents(approvedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      if (error.response?.status === 401) {
        navigate('/');
      } else {
        setError('Failed to load events. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (error) {
    return (
      <div className="events-container student-view">
        <div className="error-message">
          <FaExclamationTriangle className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchEvents} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="events-container student-view">
      <div className="events-header">
        <h2>
          <FaCalendarAlt className="header-icon" />
          Upcoming Events
        </h2>
        <div className="header-actions">
          <div className="filter-section student-filters">
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="events-table-container">
        {loading ? (
          <div className="loading-message">Loading events...</div>
        ) : filteredEvents.length > 0 ? (
          <table className="events-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Date & Time</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event._id} className="event-row">
                  <td className="event-title">{event.title}</td>
                  <td className="event-description">{event.description}</td>
                  <td className="event-date">
                    <FaClock className="icon" />
                    {format(new Date(event.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="event-location">
                    <FaMapMarkerAlt className="icon" />
                    {event.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-events-message">
            {searchTerm ? (
              <>
                <FaSearch className="no-events-icon" />
                <p>No events found matching your search.</p>
              </>
            ) : (
              <>
                <FaCalendarAlt className="no-events-icon" />
                <p>No upcoming events available at the moment.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 