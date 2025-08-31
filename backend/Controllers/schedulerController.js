import autoMessageScheduler from '../services/scheduler/autoMessageScheduler.js';

class SchedulerController {
  // Initialize scheduler
  async initializeScheduler(req, res) {
    try {
      console.log('🕐 Initializing scheduler...');
      
      const result = await autoMessageScheduler.initialize();
      
      res.status(200).json({
        success: true,
        message: result ? 'Scheduler initialized successfully' : 'Failed to initialize scheduler',
        status: autoMessageScheduler.getStatus()
      });
    } catch (error) {
      console.error('❌ Error initializing scheduler:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize scheduler',
        error: error.message
      });
    }
  }

  // Start all schedules
  async startAllSchedules(req, res) {
    try {
      console.log('🚀 Starting all schedules...');
      
      autoMessageScheduler.startAllSchedules();
      
      res.status(200).json({
        success: true,
        message: 'All schedules started successfully',
        status: autoMessageScheduler.getStatus()
      });
    } catch (error) {
      console.error('❌ Error starting schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start schedules',
        error: error.message
      });
    }
  }

  // Stop all schedules
  async stopAllSchedules(req, res) {
    try {
      console.log('🛑 Stopping all schedules...');
      
      autoMessageScheduler.stopAllSchedules();
      
      res.status(200).json({
        success: true,
        message: 'All schedules stopped successfully',
        status: autoMessageScheduler.getStatus()
      });
    } catch (error) {
      console.error('❌ Error stopping schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop schedules',
        error: error.message
      });
    }
  }

  // Get scheduler status
  async getSchedulerStatus(req, res) {
    try {
      const status = autoMessageScheduler.getStatus();
      const nextRuns = autoMessageScheduler.getNextRunTimes();
      
      res.status(200).json({
        success: true,
        status: status,
        nextRuns: nextRuns
      });
    } catch (error) {
      console.error('❌ Error getting scheduler status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduler status',
        error: error.message
      });
    }
  }

  // Manual trigger fee reminders
  async triggerFeeReminders(req, res) {
    try {
      console.log('💰 Manually triggering fee reminders...');
      
      const result = await autoMessageScheduler.triggerFeeReminders();
      
      res.status(200).json({
        success: true,
        message: 'Fee reminders triggered successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Error triggering fee reminders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger fee reminders',
        error: error.message
      });
    }
  }

  // Manual trigger birthday wishes
  async triggerBirthdayWishes(req, res) {
    try {
      console.log('🎂 Manually triggering birthday wishes...');
      
      const result = await autoMessageScheduler.triggerBirthdayWishes();
      
      res.status(200).json({
        success: true,
        message: 'Birthday wishes triggered successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Error triggering birthday wishes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger birthday wishes',
        error: error.message
      });
    }
  }

  // Manual trigger admission confirmations
  async triggerAdmissionConfirmations(req, res) {
    try {
      console.log('🎓 Manually triggering admission confirmations...');
      
      const result = await autoMessageScheduler.triggerAdmissionConfirmations();
      
      res.status(200).json({
        success: true,
        message: 'Admission confirmations triggered successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Error triggering admission confirmations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger admission confirmations',
        error: error.message
      });
    }
  }

  // Send real-time admission confirmation for specific student
  async sendAdmissionConfirmationRealTime(req, res) {
    try {
      const { studentId } = req.params;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      console.log(`🎓 Sending real-time admission confirmation for student: ${studentId}`);
      
      const result = await autoMessageScheduler.sendAdmissionConfirmationRealTime(studentId);
      
      res.status(200).json({
        success: true,
        message: 'Real-time admission confirmation sent successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Error sending real-time admission confirmation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send real-time admission confirmation',
        error: error.message
      });
    }
  }

  // Start custom fee reminder schedule
  async startCustomFeeReminderSchedule(req, res) {
    try {
      const { schedule } = req.body;
      
      if (!schedule) {
        return res.status(400).json({
          success: false,
          message: 'Schedule pattern is required'
        });
      }

      console.log(`💰 Starting custom fee reminder schedule: ${schedule}`);
      
      autoMessageScheduler.startCustomFeeReminderSchedule(schedule);
      
      res.status(200).json({
        success: true,
        message: 'Custom fee reminder schedule started successfully',
        schedule: schedule,
        status: autoMessageScheduler.getStatus()
      });
    } catch (error) {
      console.error('❌ Error starting custom schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start custom schedule',
        error: error.message
      });
    }
  }

  // Get schedule information
  async getScheduleInfo(req, res) {
    try {
      const status = autoMessageScheduler.getStatus();
      const nextRuns = autoMessageScheduler.getNextRunTimes();
      
      const scheduleInfo = {
        currentTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        timezone: 'Asia/Kolkata',
        schedules: {
          feeReminders: {
            pattern: '0 10 * * *',
            description: 'Daily at 10:00 AM',
            nextRun: nextRuns.feeReminders.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            active: status.activeSchedules.includes('feeReminders')
          },
          birthdayWishes: {
            pattern: '0 9 * * *',
            description: 'Daily at 9:00 AM',
            nextRun: nextRuns.birthdayWishes.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            active: status.activeSchedules.includes('birthdayWishes')
          },
          admissionConfirmations: {
            pattern: 'Real-time',
            description: 'Immediate when admission created',
            nextRun: 'Real-time (when admission created)',
            active: true
          }
        },
        whatsappStatus: status.whatsappReady ? 'Connected' : 'Disconnected',
        schedulerStatus: status.schedulerStatus
      };
      
      res.status(200).json({
        success: true,
        scheduleInfo: scheduleInfo
      });
    } catch (error) {
      console.error('❌ Error getting schedule info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get schedule info',
        error: error.message
      });
    }
  }
}

export default new SchedulerController();
