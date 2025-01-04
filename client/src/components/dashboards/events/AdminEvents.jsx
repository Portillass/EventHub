import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaEdit, FaTrash, FaCheck, FaArchive, FaSearch, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../../styles/Events.css';
import '../../../styles/OfficerEventModal.css';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [successModal, setSuccessModal] = useState(false);
  const [emailStats, setEmailStats] = useState(null);
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
      setLoading(true);
      const response = await axios.post(
        `http://localhost:2025/api/events/${eventId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      if (newStatus === 'approved') {
        setEmailStats(response.data.emailStats);
        setSuccessModal(true);
      }

      // Refresh events list
      fetchEvents();
    } catch (error) {
      console.error('Error updating event status:', error);
      setError('Failed to update event status');
    } finally {
      setLoading(false);
    }
  };

  const initiateStatusChange = (eventId, newStatus) => {
    setSelectedEventId(eventId);
    setSelectedAction(newStatus);
    setShowConfirmModal(true);
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

  // Success Modal Component
  const SuccessModal = () => (
    <Dialog 
      open={successModal} 
      onClose={() => setSuccessModal(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 60, mb: 1 }} />
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'success.main', fontWeight: 'bold' }}>
          Congratulations!
        </Typography>
        <Typography variant="body1" gutterBottom>
          The event has been successfully approved.
        </Typography>
        {emailStats && (
          <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Email Notification Summary:
            </Typography>
            <Typography variant="body2">
              Total Recipients: {emailStats.totalAttempted}
            </Typography>
            <Typography variant="body2" color="success.main">
              Successfully Sent: {emailStats.successful}
            </Typography>
            {emailStats.failed > 0 && (
              <Typography variant="body2" color="error">
                Failed to Send: {emailStats.failed}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button 
          variant="contained" 
          onClick={() => setSuccessModal(false)}
          sx={{
            bgcolor: 'success.main',
            '&:hover': { bgcolor: 'success.dark' },
            px: 4
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );

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
                          onClick={() => initiateStatusChange(event._id, 'approved')}
                          className="action-btn approve"
                          title="Approve"
                        >
                          <FaCheck />
                        </button>
                      )}
                      {event.status === 'approved' && (
                        <button
                          onClick={() => initiateStatusChange(event._id, 'archived')}
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

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Confirm Action</h2>
              <button
                className="event-close-btn"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedEventId(null);
                  setSelectedAction(null);
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#fff' }}>
                Are you sure you want to {selectedAction === 'approved' ? 'approve' : 'archive'} this event?
              </p>
              <div className="modal-footer" style={{ justifyContent: 'center', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedEventId(null);
                    setSelectedAction(null);
                  }}
                  className="modal-btn cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusChange(selectedEventId, selectedAction)}
                  className="modal-btn submit"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SuccessModal />
    </div>
  );
} 