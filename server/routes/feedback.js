const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get feedback records (officers and admins only)
router.get('/records', authenticateToken, checkRole(['officer', 'admin']), feedbackController.getFeedbackRecords);

// Export feedback records to Excel (officers and admins only)
router.get('/export', authenticateToken, checkRole(['officer', 'admin']), feedbackController.exportFeedbackRecords);

// Submit feedback (students only)
router.post('/submit', authenticateToken, checkRole(['student']), feedbackController.submitFeedback);

module.exports = router; 