import cron from 'node-cron';
import feeReminderService from '../messages/feeReminderService.js';
import birthdayWishService from '../messages/birthdayWishService.js';
import admissionConfirmationService from '../messages/admissionConfirmationService.js';
import whatsappConnectionService from '../whatsapp/core/connectionService.js';
import AutoMessageSettings from '../../Model/AutoMessageSettings.js';

class AutoMessageScheduler {
  constructor() {
    this.schedules = new Map();
    this.isInitialized = false;
    this.schedulerStatus = {
      feeReminders: false,
      birthdayWishes: false,
      admissionConfirmations: false,
      lastRun: null
    };
  }

  // Initialize scheduler
  async initialize() {
    try {
      console.log('🕐 Initializing Auto Message Scheduler...');
      
      // Check if WhatsApp is ready
      if (!whatsappConnectionService.isReady) {
        console.log('⚠️ WhatsApp not ready, initializing...');
        await whatsappConnectionService.initialize();
      }

      this.isInitialized = true;
      console.log('✅ Auto Message Scheduler initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing scheduler:', error);
      return false;
    }
  }

  // Start all scheduled tasks
  async startAllSchedules() {
    console.log('🚀 Starting all auto message schedules...');
    
    await this.startFeeReminderSchedule();
    await this.startBirthdayWishSchedule();
    // Admission confirmations are now real-time, not scheduled
    
    console.log('✅ All schedules started');
  }

  // Stop all scheduled tasks
  stopAllSchedules() {
    console.log('🛑 Stopping all auto message schedules...');
    
    this.schedules.forEach((task, name) => {
      if (task) {
        task.stop();
        console.log(`🛑 Stopped schedule: ${name}`);
      }
    });
    
    this.schedules.clear();
    console.log('✅ All schedules stopped');
  }

  // Fee Reminder Schedule - Dynamic based on database settings
  async startFeeReminderSchedule() {
    try {
      // Get settings from database
      const settings = await AutoMessageSettings.getSettings();
      
      if (!settings.isActive) {
        console.log('⚠️ Auto message system is disabled, skipping fee reminder schedule');
        return;
      }

      // Parse time from settings (format: "HH:MM")
      const [hours, minutes] = settings.feeReminderTime.split(':').map(Number);
      
      console.log(`💰 Starting Fee Reminder Schedule (Daily ${settings.feeReminderTime})...`);
      console.log(`   - Reminder Gap: ${settings.feeReminderGapDays} days`);
      console.log(`   - Reminder Time: ${settings.feeReminderTime}`);
      
      const cronExpression = `${minutes} ${hours} * * *`;
      
      const task = cron.schedule(cronExpression, async () => {
        console.log('💰 Running scheduled fee reminders...');
        
        try {
          if (!whatsappConnectionService.isReady) {
            console.log('⚠️ WhatsApp not ready, skipping fee reminders');
            return;
          }

          const result = await feeReminderService.sendFeeReminders();
          console.log(`✅ Scheduled fee reminders completed: ${result.message}`);
          
          this.schedulerStatus.feeReminders = true;
          this.schedulerStatus.lastRun = new Date().toISOString();
          
        } catch (error) {
          console.error('❌ Error in scheduled fee reminders:', error);
          this.schedulerStatus.feeReminders = false;
        }
      }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
      });

      this.schedules.set('feeReminders', task);
      console.log('✅ Fee Reminder Schedule started');
      
    } catch (error) {
      console.error('❌ Error starting fee reminder schedule:', error);
    }
  }

  // Birthday Wish Schedule - Dynamic based on database settings
  async startBirthdayWishSchedule() {
    try {
      // Get settings from database
      const settings = await AutoMessageSettings.getSettings();
      
      if (!settings.isActive) {
        console.log('⚠️ Auto message system is disabled, skipping birthday wish schedule');
        return;
      }

      // Parse time from settings (format: "HH:MM")
      const [hours, minutes] = settings.birthdayWishTime.split(':').map(Number);
      
      console.log(`🎂 Starting Birthday Wish Schedule (Daily ${settings.birthdayWishTime})...`);
      
      const cronExpression = `${minutes} ${hours} * * *`;
      
      const task = cron.schedule(cronExpression, async () => {
        console.log('🎂 Running scheduled birthday wishes...');
        
        try {
          if (!whatsappConnectionService.isReady) {
            console.log('⚠️ WhatsApp not ready, skipping birthday wishes');
            return;
          }

          const result = await birthdayWishService.sendBirthdayWishes();
          console.log(`✅ Scheduled birthday wishes completed: ${result.message}`);
          
          this.schedulerStatus.birthdayWishes = true;
          this.schedulerStatus.lastRun = new Date().toISOString();
          
        } catch (error) {
          console.error('❌ Error in scheduled birthday wishes:', error);
          this.schedulerStatus.birthdayWishes = false;
        }
      }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
      });

      this.schedules.set('birthdayWishes', task);
      console.log('✅ Birthday Wish Schedule started');
      
    } catch (error) {
      console.error('❌ Error starting birthday wish schedule:', error);
    }
  }

  // Admission Confirmation - Real-time (triggered when admission is created)
  async sendAdmissionConfirmationRealTime(studentId) {
    try {
      console.log(`🎓 Sending real-time admission confirmation for student: ${studentId}`);
      
      if (!whatsappConnectionService.isReady) {
        console.log('⚠️ WhatsApp not ready, admission confirmation will be sent when ready');
        // Store for later sending
        this.pendingAdmissionConfirmations = this.pendingAdmissionConfirmations || [];
        this.pendingAdmissionConfirmations.push(studentId);
        return false;
      }

      const result = await admissionConfirmationService.sendAdmissionConfirmation(studentId);
      console.log(`✅ Real-time admission confirmation sent: ${result.message}`);
      
      this.schedulerStatus.admissionConfirmations = true;
      this.schedulerStatus.lastRun = new Date().toISOString();
      
      return result;
    } catch (error) {
      console.error('❌ Error sending real-time admission confirmation:', error);
      this.schedulerStatus.admissionConfirmations = false;
      return false;
    }
  }

  // Process pending admission confirmations when WhatsApp becomes ready
  async processPendingAdmissionConfirmations() {
    if (!this.pendingAdmissionConfirmations || this.pendingAdmissionConfirmations.length === 0) {
      return;
    }

    console.log(`🎓 Processing ${this.pendingAdmissionConfirmations.length} pending admission confirmations...`);
    
    for (const studentId of this.pendingAdmissionConfirmations) {
      try {
        await this.sendAdmissionConfirmationRealTime(studentId);
      } catch (error) {
        console.error(`❌ Error processing pending admission confirmation for ${studentId}:`, error);
      }
    }
    
    this.pendingAdmissionConfirmations = [];
    console.log('✅ Pending admission confirmations processed');
  }

  // Custom Fee Reminder Schedule
  startCustomFeeReminderSchedule(schedule) {
    try {
      console.log(`💰 Starting Custom Fee Reminder Schedule: ${schedule}`);
      
      const task = cron.schedule(schedule, async () => {
        console.log('💰 Running custom scheduled fee reminders...');
        
        try {
          if (!whatsappConnectionService.isReady) {
            console.log('⚠️ WhatsApp not ready, skipping fee reminders');
            return;
          }

          const result = await feeReminderService.sendFeeReminders();
          console.log(`✅ Custom fee reminders completed: ${result.message}`);
          
        } catch (error) {
          console.error('❌ Error in custom fee reminders:', error);
        }
      }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
      });

      this.schedules.set('customFeeReminders', task);
      console.log('✅ Custom Fee Reminder Schedule started');
      
    } catch (error) {
      console.error('❌ Error starting custom fee reminder schedule:', error);
    }
  }

  // Manual trigger functions
  async triggerFeeReminders() {
    try {
      console.log('💰 Manually triggering fee reminders...');
      
      if (!whatsappConnectionService.isReady) {
        throw new Error('WhatsApp not ready');
      }

      const result = await feeReminderService.sendFeeReminders();
      console.log(`✅ Manual fee reminders completed: ${result.message}`);
      
      return result;
    } catch (error) {
      console.error('❌ Error in manual fee reminders:', error);
      throw error;
    }
  }

  async triggerBirthdayWishes() {
    try {
      console.log('🎂 Manually triggering birthday wishes...');
      
      if (!whatsappConnectionService.isReady) {
        throw new Error('WhatsApp not ready');
      }

      const result = await birthdayWishService.sendBirthdayWishes();
      console.log(`✅ Manual birthday wishes completed: ${result.message}`);
      
      return result;
    } catch (error) {
      console.error('❌ Error in manual birthday wishes:', error);
      throw error;
    }
  }

  async triggerAdmissionConfirmations() {
    try {
      console.log('🎓 Manually triggering admission confirmations...');
      
      if (!whatsappConnectionService.isReady) {
        throw new Error('WhatsApp not ready');
      }

      const result = await admissionConfirmationService.sendAdmissionConfirmations();
      console.log(`✅ Manual admission confirmations completed: ${result.message}`);
      
      return result;
    } catch (error) {
      console.error('❌ Error in manual admission confirmations:', error);
      throw error;
    }
  }

  // Get scheduler status
  async getStatus() {
    try {
      const settings = await AutoMessageSettings.getSettings();
      const activeSchedules = Array.from(this.schedules.keys());
      
      return {
        isInitialized: this.isInitialized,
        activeSchedules: activeSchedules,
        schedulerStatus: this.schedulerStatus,
        whatsappReady: whatsappConnectionService.isReady,
        pendingAdmissionConfirmations: this.pendingAdmissionConfirmations?.length || 0,
        settings: {
          feeReminderTime: settings.feeReminderTime,
          feeReminderGapDays: settings.feeReminderGapDays,
          birthdayWishTime: settings.birthdayWishTime,
          isActive: settings.isActive
        },
        nextRuns: {
          feeReminders: `Daily ${settings.feeReminderTime}`,
          birthdayWishes: `Daily ${settings.birthdayWishTime}`,
          admissionConfirmations: 'Real-time (when admission created)'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting scheduler status:', error);
      return {
        isInitialized: this.isInitialized,
        activeSchedules: Array.from(this.schedules.keys()),
        schedulerStatus: this.schedulerStatus,
        whatsappReady: whatsappConnectionService.isReady,
        pendingAdmissionConfirmations: this.pendingAdmissionConfirmations?.length || 0,
        settings: null,
        nextRuns: {
          feeReminders: 'Error getting time',
          birthdayWishes: 'Error getting time',
          admissionConfirmations: 'Real-time (when admission created)'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get next run times
  async getNextRunTimes() {
    try {
      const settings = await AutoMessageSettings.getSettings();
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Parse times from settings
      const [feeHours, feeMinutes] = settings.feeReminderTime.split(':').map(Number);
      const [birthdayHours, birthdayMinutes] = settings.birthdayWishTime.split(':').map(Number);
      
      return {
        feeReminders: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), feeHours, feeMinutes, 0),
        birthdayWishes: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), birthdayHours, birthdayMinutes, 0),
        admissionConfirmations: 'Real-time (immediate when admission created)'
      };
    } catch (error) {
      console.error('❌ Error getting next run times:', error);
      return {
        feeReminders: 'Error getting time',
        birthdayWishes: 'Error getting time',
        admissionConfirmations: 'Real-time (immediate when admission created)'
      };
    }
  }

  // Refresh settings and restart schedules
  async refreshSettings() {
    try {
      console.log('🔄 Refreshing auto message settings...');
      
      // Stop existing schedules
      this.stopAllSchedules();
      
      // Wait a moment for schedules to stop
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Restart schedules with new settings
      await this.startAllSchedules();
      
      console.log('✅ Settings refreshed and schedules restarted');
      return true;
    } catch (error) {
      console.error('❌ Error refreshing settings:', error);
      return false;
    }
  }
}

// Create singleton instance
const autoMessageScheduler = new AutoMessageScheduler();

export default autoMessageScheduler;
