const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { authenticateToken } = require('../middleware/auth');

// Check-in attendance
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const { studentId, fullName, yearLevel, course, title, event } = req.body;
    
    // Create new attendance record
    const attendance = new Attendance({
      studentId,
      fullName,
      yearLevel,
      course,
      title,
      event,
      timeIn: new Date(),
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check-out attendance
router.post('/checkout/:id', authenticateToken, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    attendance.timeOut = new Date();
    await attendance.save();
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all attendance records (for officers)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const attendances = await Attendance.find()
      .sort({ timeIn: -1 });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student's attendance records
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const attendances = await Attendance.find({ studentId: req.params.studentId })
      .sort({ timeIn: -1 });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 