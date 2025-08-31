import ReminderSettings from '../Model/ReminderSettings.js';
import automaticReminderService from '../services/automaticReminderService.js';

const reminderSettingsController = {
  // Get current settings
  getSettings: async (req, res) => {
    try {
      let settings = await ReminderSettings.findOne();
      
      if (!settings) {
        // Create default settings if none exist
        settings = new ReminderSettings({
          reminderGap: 4,
          reminderTime: '10:00',
          isActive: true
        });
        await settings.save();
      }
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching reminder settings',
        error: error.message
      });
    }
  },

  // Update settings
  updateSettings: async (req, res) => {
    try {
      const { reminderGap, reminderTime, isActive, birthdayWishTime, birthdayWishesActive } = req.body;
      
      let settings = await ReminderSettings.findOne();
      
      if (!settings) {
        settings = new ReminderSettings();
      }
      
      // Update fields if provided
      if (reminderGap !== undefined) settings.reminderGap = reminderGap;
      if (reminderTime !== undefined) settings.reminderTime = reminderTime;
      if (isActive !== undefined) settings.isActive = isActive;
      if (birthdayWishTime !== undefined) settings.birthdayWishTime = birthdayWishTime;
      if (birthdayWishesActive !== undefined) settings.birthdayWishesActive = birthdayWishesActive;
      
      await settings.save();
      
      // Update service settings
      await automaticReminderService.updateSettings({
        reminderGap: settings.reminderGap,
        reminderTime: settings.reminderTime,
        isActive: settings.isActive,
        birthdayWishTime: settings.birthdayWishTime,
        birthdayWishesActive: settings.birthdayWishesActive
      });
      
      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: settings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating settings',
        error: error.message
      });
    }
  },

  // Get service status
  getStatus: async (req, res) => {
    try {
      const status = await automaticReminderService.getDetailedStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching service status',
        error: error.message
      });
    }
  },

  // Manual trigger
  triggerNow: async (req, res) => {
    try {
      await automaticReminderService.triggerNow();
      
      res.json({
        success: true,
        message: 'Fee reminders triggered successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error triggering reminders',
        error: error.message
      });
    }
  },

  // Manual birthday wishes trigger
  triggerBirthdayWishes: async (req, res) => {
    try {
      await automaticReminderService.triggerBirthdayWishes();
      
      res.json({
        success: true,
        message: 'Birthday wishes triggered successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error triggering birthday wishes',
        error: error.message
      });
    }
  }
};

export default reminderSettingsController;
