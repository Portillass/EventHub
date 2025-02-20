const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { authenticateToken } = require('../middleware/auth');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

// Check-in attendance
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const { studentId, fullName, yearLevel, course, title, event } = req.body;
    
    // Check if student already has attendance records for this event
    const existingAttendances = await Attendance.find({
      studentId,
      event,
      title
    }).sort({ timeIn: -1 });

    // Count check-ins (records with timeIn)
    const checkInCount = existingAttendances.length;

    if (checkInCount >= 2) {
      return res.status(400).json({ 
        message: 'You have already used your maximum check-in attempts (2) for this event'
      });
    }

    // Check if there's an active attendance (no timeOut)
    const hasActiveAttendance = existingAttendances.some(record => !record.timeOut);
    if (hasActiveAttendance) {
      return res.status(400).json({ 
        message: 'Please check out from your previous attendance first'
      });
    }

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
    
    // Send response with attempt count information
    res.status(201).json({
      attendance,
      message: `Check-in successful. You have ${2 - (checkInCount + 1)} check-in attempts remaining for this event.`
    });
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

    // Get all attendance records for this student and event
    const allAttendances = await Attendance.find({
      studentId: attendance.studentId,
      event: attendance.event,
      title: attendance.title
    });

    // Count check-outs (records with timeOut)
    const checkOutCount = allAttendances.filter(record => record.timeOut).length;

    if (checkOutCount >= 2) {
      return res.status(400).json({ 
        message: 'You have already used your maximum check-out attempts (2) for this event'
      });
    }

    // Check if this specific attendance is already checked out
    if (attendance.timeOut) {
      return res.status(400).json({ 
        message: 'This attendance record has already been checked out'
      });
    }

    attendance.timeOut = new Date();
    await attendance.save();
    
    // Send response with attempt count information
    res.json({
      attendance,
      message: `Check-out successful. You have ${2 - (checkOutCount + 1)} check-out attempts remaining for this event.`
    });
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

// Download attendance records as PDF
router.get('/download-pdf', authenticateToken, async (req, res) => {
  try {
    const { titleFilter, yearLevelFilter, courseFilter } = req.query;
    
    // Build filter object
    const filter = {};
    if (titleFilter && titleFilter !== 'all') filter.title = titleFilter;
    if (yearLevelFilter && yearLevelFilter !== 'all') filter.yearLevel = yearLevelFilter;
    if (courseFilter && courseFilter !== 'all') filter.course = courseFilter;

    const attendances = await Attendance.find(filter).sort({ timeIn: -1 });
    
    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_records.pdf');
    
    // Pipe the PDF document to the response
    doc.pipe(res);
    
    // Add header with logo and title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('BUKIDNON STATE UNIVERSITY', { align: 'center' })
       .fontSize(14)
       .text('COLLEGE OF TECHNOLOGIES', { align: 'center' })
       .text('INFORMATION TECHNOLOGY DEPARTMENT', { align: 'center' })
       .moveDown()
       .fontSize(12)
       .text('COT-SBO Event Management System', { align: 'center' })
       .text('Attendance Records', { align: 'center' })
       .moveDown(2);

    // Add date generated
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Date Generated: ${new Date().toLocaleDateString()}`, { align: 'right' })
       .moveDown();

    // Add filters if any
    if (titleFilter && titleFilter !== 'all') {
      doc.text(`Event: ${titleFilter}`);
    }
    if (yearLevelFilter && yearLevelFilter !== 'all') {
      doc.text(`Year Level: ${yearLevelFilter}`);
    }
    if (courseFilter && courseFilter !== 'all') {
      doc.text(`Course: ${courseFilter}`);
    }
    doc.moveDown();

    // Create table header
    const tableTop = doc.y;
    const columnSpacing = 20;
    const columns = {
      studentId: { x: 50, width: 80 },
      name: { x: 130, width: 120 },
      yearLevel: { x: 250, width: 80 },
      course: { x: 330, width: 80 },
      timeIn: { x: 410, width: 100 }
    };

    // Draw table header
    doc.font('Helvetica-Bold')
       .text('Student ID', columns.studentId.x, tableTop)
       .text('Name', columns.name.x, tableTop)
       .text('Year Level', columns.yearLevel.x, tableTop)
       .text('Course', columns.course.x, tableTop)
       .text('Time In', columns.timeIn.x, tableTop)
       .moveDown();

    // Draw horizontal line
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();

    // Add table rows
    doc.font('Helvetica');
    let rowTop = doc.y;

    attendances.forEach(record => {
      // Check if we need a new page
      if (rowTop > 700) {
        doc.addPage();
        rowTop = 50;
        doc.font('Helvetica-Bold');
        // Repeat header on new page
        Object.entries(columns).forEach(([key, col]) => {
          doc.text(key.charAt(0).toUpperCase() + key.slice(1), col.x, rowTop);
        });
        doc.moveDown();
        rowTop = doc.y;
        doc.font('Helvetica');
      }

      doc.text(record.studentId, columns.studentId.x, rowTop)
         .text(record.fullName, columns.name.x, rowTop)
         .text(record.yearLevel, columns.yearLevel.x, rowTop)
         .text(record.course, columns.course.x, rowTop)
         .text(new Date(record.timeIn).toLocaleString(), columns.timeIn.x, rowTop);

      rowTop = doc.y + columnSpacing;
    });

    // Add footer
    doc.fontSize(10)
       .text('Generated by COT-SBO Event Management System', 50, doc.page.height - 50, {
         align: 'center'
       });

    // Finalize PDF file
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF' });
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