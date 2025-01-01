import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaEdit, FaTrash, FaCheck, FaArchive, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../../styles/Events.css';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchEvents();
  }, []);

  const checkAuthAndFetchEvents = async () => {
    try {
      const authResponse = await axios.get('http://localhost:2025/api/auth/current-user', {
        withCredentials: true
      });

      if (!authResponse.data.isAuthenticated || authResponse.data.user.role !== 'admin') {
        navigate('/');
        return;
      }

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
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await axios.post(`http://localhost:2025/api/events/${eventId}/status`, {
        status: newStatus
      }, {
        withCredentials: true
      });
      
      // Refresh events list after status change
      await fetchEvents();
    } catch (error) {
      console.error('Error updating event status:', error);
      setError('Failed to update event status. Please try again.');
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`http://localhost:2025/api/events/${eventId}`, {
          withCredentials: true
        });
        await fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        setError('Failed to delete event. Please try again.');
      }
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusFilter === 'all' ? matchesSearch : (matchesSearch && event.status === statusFilter);
  });

  if (error) {
    return (
      <div className="events-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchEvents} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="events-container">
      <div className="events-header">
        <h2>Event Management</h2>
        <div className="header-actions">
          <div className="filter-section admin-filters">
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="archived">Archived</option>
            </select>
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
                <th>Date</th>
                <th>Location</th>
                <th>Created By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event._id}>
                  <td>{event.title}</td>
                  <td>{event.description}</td>
                  <td>{format(new Date(event.date), 'MMM dd, yyyy')}</td>
                  <td>{event.location}</td>
                  <td>{event.createdBy?.firstName} {event.createdBy?.lastName}</td>
                  <td>
                    <span className={`status-badge ${event.status}`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {event.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(event._id, 'approved')}
                          className="action-btn approve"
                          title="Approve"
                        >
                          <FaCheck />
                        </button>
                      )}
                      {event.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(event._id, 'archived')}
                          className="action-btn archive"
                          title="Archive"
                        >
                          <FaArchive />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="action-btn delete"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-events-message">
            {searchTerm || statusFilter !== 'all' ? (
              <p>No events found matching your search criteria.</p>
            ) : (
              <p>No events available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 