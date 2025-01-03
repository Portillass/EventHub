import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    maxAttendees: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const handleOpenDialog = (event = null) => {
    if (event) {
      setSelectedEvent(event);
      setFormData({
        title: event.title,
        description: event.description,
        date: event.date.split('T')[0],
        time: event.time,
        venue: event.venue,
        maxAttendees: event.maxAttendees
      });
    } else {
      setSelectedEvent(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        maxAttendees: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      venue: '',
      maxAttendees: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedEvent) {
        await axios.put(`/api/events/${selectedEvent._id}`, formData);
      } else {
        await axios.post('/api/events', formData);
      }
      fetchEvents();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving event:', error);
      setError('Failed to save event');
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`/api/events/${eventId}`);
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        setError('Failed to delete event');
      }
    }
  };

  const getStatusChipColor = (event) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    if (eventDate < now) {
      return 'default'; // Past event
    }
    if (event.attendees?.length >= event.maxAttendees) {
      return 'error'; // Full
    }
    return 'success'; // Available
  };

  const getStatusText = (event) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    if (eventDate < now) {
      return 'Past';
    }
    if (event.attendees?.length >= event.maxAttendees) {
      return 'Full';
    }
    return 'Available';
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Event Management
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Event
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                  <TableCell>{event.time}</TableCell>
                  <TableCell>{event.venue}</TableCell>
                  <TableCell>
                    {event.attendees?.length || 0} / {event.maxAttendees}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(event)}
                      color={getStatusChipColor(event)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(event)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(event._id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedEvent ? 'Edit Event' : 'Add New Event'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" noValidate sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="title"
                    label="Event Title"
                    fullWidth
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="description"
                    label="Description"
                    fullWidth
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="date"
                    label="Date"
                    type="date"
                    fullWidth
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="time"
                    label="Time"
                    type="time"
                    fullWidth
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="venue"
                    label="Venue"
                    fullWidth
                    value={formData.venue}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="maxAttendees"
                    label="Maximum Attendees"
                    type="number"
                    fullWidth
                    value={formData.maxAttendees}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedEvent ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default EventManagement; 