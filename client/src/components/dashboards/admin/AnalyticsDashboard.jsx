import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [eventAnalytics, setEventAnalytics] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const theme = useTheme();

  const darkTheme = {
    background: '#1a1a1a',
    paper: '#2d2d2d',
    text: '#ffffff',
    gridLines: '#404040',
    chartColors: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'],
  };

  const lightTheme = {
    background: '#ffffff',
    paper: '#ffffff',
    text: '#000000',
    gridLines: '#e0e0e0',
    chartColors: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'],
  };

  const currentTheme = darkMode ? darkTheme : lightTheme;

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, eventsRes, demographicsRes] = await Promise.all([
        axios.get('http://localhost:2025/api/analytics/overview', { withCredentials: true }),
        axios.get('http://localhost:2025/api/analytics/events', { withCredentials: true }),
        axios.get('http://localhost:2025/api/analytics/demographics', { withCredentials: true }),
      ]);

      setAnalyticsData(overviewRes.data);
      setEventAnalytics(eventsRes.data);
      setDemographics(demographicsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3} sx={{ backgroundColor: currentTheme.background, minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ color: currentTheme.text }}>
          Analytics Dashboard
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              color="primary"
            />
          }
          label={
            <Box component="span" sx={{ color: currentTheme.text }}>
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </Box>
          }
        />
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: currentTheme.paper }}>
            <CardContent>
              <Typography color={currentTheme.text} gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h5" sx={{ color: currentTheme.text }}>
                {analyticsData?.activeUsers?.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: currentTheme.paper }}>
            <CardContent>
              <Typography color={currentTheme.text} gutterBottom>
                Page Views
              </Typography>
              <Typography variant="h5" sx={{ color: currentTheme.text }}>
                {analyticsData?.pageViews?.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: currentTheme.paper }}>
            <CardContent>
              <Typography color={currentTheme.text} gutterBottom>
                Sessions
              </Typography>
              <Typography variant="h5" sx={{ color: currentTheme.text }}>
                {analyticsData?.sessions?.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: currentTheme.paper }}>
            <CardContent>
              <Typography color={currentTheme.text} gutterBottom>
                Avg. Session Duration
              </Typography>
              <Typography variant="h5" sx={{ color: currentTheme.text }}>
                {(analyticsData?.avgSessionDuration || 0).toFixed(2)}s
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* User Activity Over Time */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, backgroundColor: currentTheme.paper }}>
            <Typography variant="h6" gutterBottom sx={{ color: currentTheme.text }}>
              User Activity Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData?.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.gridLines} />
                <XAxis dataKey="date" stroke={currentTheme.text} />
                <YAxis stroke={currentTheme.text} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: currentTheme.paper,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.gridLines}`
                  }}
                  labelStyle={{ color: currentTheme.text }}
                />
                <Legend wrapperStyle={{ color: currentTheme.text }} />
                <Line type="monotone" dataKey="activeUsers" stroke={currentTheme.chartColors[0]} name="Active Users" />
                <Line type="monotone" dataKey="pageViews" stroke={currentTheme.chartColors[1]} name="Page Views" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Feedback Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, backgroundColor: currentTheme.paper }}>
            <Typography variant="h6" gutterBottom sx={{ color: currentTheme.text }}>
              Feedback Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(demographics?.feedbackDistribution || {}).map(([key, value]) => ({
                    name: key,
                    value,
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: currentTheme.text }}
                >
                  {Object.entries(demographics?.feedbackDistribution || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={currentTheme.chartColors[index % currentTheme.chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: currentTheme.paper,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.gridLines}`
                  }}
                  labelStyle={{ color: currentTheme.text }}
                />
                <Legend wrapperStyle={{ color: currentTheme.text }} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Event Analytics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, backgroundColor: currentTheme.paper }}>
            <Typography variant="h6" gutterBottom sx={{ color: currentTheme.text }}>
              Event Analytics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.gridLines} />
                <XAxis dataKey="eventName" stroke={currentTheme.text} />
                <YAxis stroke={currentTheme.text} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: currentTheme.paper,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.gridLines}`
                  }}
                  labelStyle={{ color: currentTheme.text }}
                />
                <Legend wrapperStyle={{ color: currentTheme.text }} />
                <Bar dataKey="count" fill={currentTheme.chartColors[0]} name="Event Count" />
                <Bar dataKey="value" fill={currentTheme.chartColors[1]} name="Event Value" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard; 