import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import '../../../styles/Events.css';
import { useNavigate } from 'react-router-dom';

export default function OfficerEvents() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: ''
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // First get the current user
      const userResponse = await axios.get('http://localhost:2025/api/auth/current-user', {
        withCredentials: true
      });

      if (!userResponse.data.isAuthenticated || userResponse.data.user.role !== 'officer') {
        navigate('/');
        return;
      }

      const currentUserId = userResponse.data.user.id;

      // Then fetch events
      const response = await axios.get('http://localhost:2025/api/events', {
        withCredentials: true
      });

      // Filter to show only events created by this officer
      setEvents(response.data.filter(event => event.createdBy?._id === currentUserId));
    } catch (error) {
      console.error('Error fetching events:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      // Validate form data
      if (!formData.title || !formData.description || !formData.date || !formData.location) {
        setError('All fields are required');
        return;
      }

      const eventData = {
        ...formData,
        date: new Date(formData.date).toISOString()
      };

      if (selectedEvent) {
        await axios.put(`http://localhost:2025/api/events/${selectedEvent._id}`, eventData, {
          withCredentials: true
        });
      } else {
        const response = await axios.post('http://localhost:2025/api/events', eventData, {
          withCredentials: true
        });
        console.log('Event created:', response.data);
      }

      setShowModal(false);
      setSelectedEvent(null);
      setFormData({ title: '', description: '', date: '', location: '' });
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      setError(error.response?.data?.message || 'Failed to save event. Please try again.');
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`http://localhost:2025/api/events/${eventId}`, {
          withCredentials: true
        });
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: format(new Date(event.date), 'yyyy-MM-dd'),
      location: event.location
    });
    setShowModal(true);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusFilter === 'all' ? matchesSearch : (matchesSearch && event.status === statusFilter);
  });

  return (
    <div className="events-container">
      <div className="events-header">
        <h2>Event Management</h2>
        <div className="header-actions">
          <button
            onClick={() => {
              setSelectedEvent(null);
              setFormData({ title: '', description: '', date: '', location: '' });
              setShowModal(true);
            }}
            className="create-event-btn"
          >
            <FaPlus /> Create New Event
          </button>
          <div className="filter-section officer-filters">
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
        <table className="events-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Date</th>
              <th>Location</th>
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
                <td>
                  <span className={`status-badge ${event.status}`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEdit(event)}
                      className="action-btn edit"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
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
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
            </div>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedEvent(null);
                    setFormData({ title: '', description: '', date: '', location: '' });
                  }}
                  className="modal-btn cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn submit">
                  {selectedEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 