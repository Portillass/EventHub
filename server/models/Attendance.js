const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: false
  },
  title: {
    type: String,
    required: true,
    default: 'Daily Attendance'
  },
  studentId: {
    type: String,
    required: true,
    index: true
  },
  fullName: {
    type: String,
    required: true
  },
  yearLevel: {
    type: String,
    required: true,
    enum: ['First Year', 'Second Year', 'Third Year', 'Fourth Year']
  },
  course: {
    type: String,
    required: true
  },
  timeIn: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  timeOut: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Create compound index for faster lookups
attendanceSchema.index({ event: 1, studentId: 1 });

// Add pre-save middleware to ensure studentId is a string
attendanceSchema.pre('save', function(next) {
  if (this.studentId) {
    this.studentId = this.studentId.toString();
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema); 