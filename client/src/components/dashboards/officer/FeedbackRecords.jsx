import React, { useState, useEffect } from 'react';
import { FaSearch, FaDownload } from 'react-icons/fa';

const FeedbackRecords = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    checkAuth();
    fetchEvents();
    fetchFeedbacks();
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
      if (!data.isAuthenticated || (data.user.role !== 'officer' && data.user.role !== 'admin')) {
        throw new Error('Unauthorized access');
      }

      setUserData(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('You do not have permission to view this page');
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/events', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:2025/api/feedback/records', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback records');
      }

      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/feedback/export', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download feedback records');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'feedback_records.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEvent = eventFilter === 'all' || feedback.eventId === eventFilter;
    
    return matchesSearch && matchesEvent;
  });

  if (loading) {
    return <div className="loading">Loading feedback records...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="feedback-records">
      <div className="section-header">
        <h2>Feedback Records</h2>
        <div className="header-actions">
          <button onClick={handleDownload} className="download-btn">
            <FaDownload /> Export to Excel
          </button>
        </div>
      </div>

      <div className="filter-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search feedbacks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Events</option>
          {events.map(event => (
            <option key={event._id} value={event._id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>

      <div className="feedback-table">
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Event</th>
              <th>Message</th>
              <th>Rating</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedbacks.map(feedback => (
              <tr key={feedback._id}>
                <td>{feedback.studentId}</td>
                <td>{feedback.eventTitle}</td>
                <td className="message-cell">{feedback.message}</td>
                <td className="rating-cell">{'⭐'.repeat(feedback.rating)}</td>
                <td>{new Date(feedback.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeedbackRecords; 