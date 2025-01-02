const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { authenticateToken } = require('../middleware/auth');
const XLSX = require('xlsx');

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

// Download attendance records as Excel
router.get('/download-excel', authenticateToken, async (req, res) => {
  try {
    const { titleFilter, yearLevelFilter, courseFilter } = req.query;
    
    // Build filter object
    const filter = {};
    if (titleFilter && titleFilter !== 'all') filter.title = titleFilter;
    if (yearLevelFilter && yearLevelFilter !== 'all') filter.yearLevel = yearLevelFilter;
    if (courseFilter && courseFilter !== 'all') filter.course = courseFilter;

    const attendances = await Attendance.find(filter).sort({ timeIn: -1 });
    
    // Transform data for Excel
    const excelData = attendances.map(record => ({
      'Student ID': record.studentId,
      'Full Name': record.fullName,
      'Year Level': record.yearLevel,
      'Course': record.course,
      'Event': record.title || 'Daily Attendance',
      'Date & Time In': record.timeIn ? new Date(record.timeIn).toLocaleString() : '',
      'Date & Time Out': record.timeOut ? new Date(record.timeOut).toLocaleString() : 'Not checked out',
      'Duration': record.timeOut ? calculateDuration(record.timeIn, record.timeOut) : 'In Progress',
      'Status': record.timeOut ? 'Completed' : 'Ongoing'
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Add worksheet to workbook
    const sheetName = 'Attendance Records';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Create a dynamic filename based on filters
    let filename = 'attendance_records';
    if (titleFilter && titleFilter !== 'all') filename += `_${titleFilter}`;
    if (yearLevelFilter && yearLevelFilter !== 'all') filename += `_${yearLevelFilter}`;
    if (courseFilter && courseFilter !== 'all') filename += `_${courseFilter}`;
    filename += '.xlsx';
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Send file
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to calculate duration
function calculateDuration(timeIn, timeOut) {
  const start = new Date(timeIn);
  const end = new Date(timeOut);
  const diff = end - start;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  let duration = '';
  if (hours > 0) duration += `${hours}h `;
  if (minutes > 0) duration += `${minutes}m `;
  if (seconds > 0) duration += `${seconds}s`;
  
  return duration.trim() || '0s';
}

module.exports = router; 