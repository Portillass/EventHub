const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

// Get general analytics data (admin only)
router.get('/overview', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const data = await analyticsService.getAnalyticsData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

// Get event-specific analytics (admin only)
router.get('/events', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const data = await analyticsService.getEventAnalytics();
    res.json(data);
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    res.status(500).json({ message: 'Failed to fetch event analytics' });
  }
});

// Get user demographics (admin only)
router.get('/demographics', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const data = await analyticsService.getUserDemographics();
    res.json(data);
  } catch (error) {
    console.error('Error fetching user demographics:', error);
    res.status(500).json({ message: 'Failed to fetch user demographics' });
  }
});

module.exports = router; 