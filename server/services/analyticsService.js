const Event = require('../models/Event');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const Attendance = require('../models/Attendance');

const getAnalyticsData = async () => {
  try {
    // Get real user activity data
    const totalUsers = await User.countDocuments({ status: 'active' });
    const totalStudents = await User.countDocuments({ role: 'student', status: 'active' });
    const totalOfficers = await User.countDocuments({ role: 'officer', status: 'active' });
    
    // Get session data from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get daily login activity (using createdAt as a proxy for sessions)
    const dailyData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: 'active'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          activeUsers: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format the daily data
    const formattedDailyData = dailyData.map(day => ({
      date: day._id,
      activeUsers: day.activeUsers,
      sessions: Math.round(day.activeUsers * 1.2), // Assuming each user has ~1.2 sessions per day
      pageViews: Math.round(day.activeUsers * 4), // Assuming each user views ~4 pages per day
    }));

    return {
      activeUsers: totalUsers,
      students: totalStudents,
      officers: totalOfficers,
      pageViews: formattedDailyData.reduce((sum, day) => sum + day.pageViews, 0),
      sessions: formattedDailyData.reduce((sum, day) => sum + day.sessions, 0),
      avgSessionDuration: 180, // Average 3 minutes per session
      dailyData: formattedDailyData,
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

const getEventAnalytics = async () => {
  try {
    // Get real event statistics
    const totalEvents = await Event.countDocuments();
    const totalAttendance = await Attendance.countDocuments();
    const totalFeedback = await Feedback.countDocuments();
    
    // Get event check-ins and check-outs
    const checkIns = await Attendance.countDocuments({ timeIn: { $exists: true } });
    const checkOuts = await Attendance.countDocuments({ timeOut: { $exists: true } });
    
    // Calculate event cancellations (events with status 'cancelled')
    const cancelledEvents = await Event.countDocuments({ status: 'cancelled' });

    return [
      { 
        eventName: 'Total Events', 
        count: totalEvents,
        value: totalEvents
      },
      { 
        eventName: 'Event Check-ins', 
        count: checkIns,
        value: checkIns
      },
      { 
        eventName: 'Event Check-outs', 
        count: checkOuts,
        value: checkOuts
      },
      { 
        eventName: 'Feedback Submissions', 
        count: totalFeedback,
        value: totalFeedback
      },
      { 
        eventName: 'Event Cancellations', 
        count: cancelledEvents,
        value: cancelledEvents
      }
    ];
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    throw error;
  }
};

const getUserDemographics = async () => {
  try {
    // Get real user demographics
    const usersByCity = await User.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: "$city",
          users: { $sum: 1 }
        }
      },
      { $sort: { users: -1 } },
      { $limit: 3 }
    ]);

    // Get feedback statistics
    const feedbackStats = await Feedback.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format feedback data
    const feedbackDistribution = {
      'Excellent (5)': 0,
      'Good (4)': 0,
      'Average (3)': 0,
      'Poor (2)': 0,
      'Very Poor (1)': 0
    };

    feedbackStats.forEach(stat => {
      const rating = stat._id;
      const label = rating === 5 ? 'Excellent (5)' :
                    rating === 4 ? 'Good (4)' :
                    rating === 3 ? 'Average (3)' :
                    rating === 2 ? 'Poor (2)' :
                    'Very Poor (1)';
      feedbackDistribution[label] = stat.count;
    });

    return {
      locations: usersByCity.map(city => ({
        country: 'Philippines',
        city: city._id || 'Unknown',
        users: city.users
      })),
      feedbackDistribution
    };
  } catch (error) {
    console.error('Error fetching user demographics:', error);
    throw error;
  }
};

module.exports = {
  getAnalyticsData,
  getEventAnalytics,
  getUserDemographics,
}; 