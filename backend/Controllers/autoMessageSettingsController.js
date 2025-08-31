import AutoMessageSettings from '../Model/AutoMessageSettings.js';

const autoMessageSettingsController = {
  // Get current settings
  getSettings: async (req, res) => {
    try {
      console.log('⚙️ Getting auto message settings...');
      
      const settings = await AutoMessageSettings.getSettings();
      
      console.log('✅ Settings retrieved:', settings);
      
      res.json({
        success: true,
        settings: {
          feeReminderTime: settings.feeReminderTime,
          feeReminderGapDays: settings.feeReminderGapDays,
          birthdayWishTime: settings.birthdayWishTime,
          isActive: settings.isActive,
          lastUpdated: settings.lastUpdated
        }
      });
      
    } catch (error) {
      console.error('❌ Error getting settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get settings',
        error: error.message
      });
    }
  },

  // Update settings
  updateSettings: async (req, res) => {
    try {
      console.log('⚙️ Updating auto message settings...');
      console.log('📝 Update data:', req.body);
      
      const { feeReminderTime, feeReminderGapDays, birthdayWishTime, isActive } = req.body;
      
      // Validate input
      const updates = {};
      
      if (feeReminderTime !== undefined) {
        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(feeReminderTime)) {
          return res.status(400).json({
            success: false,
            message: 'Fee reminder time must be in HH:MM format (e.g., 10:00)'
          });
        }
        updates.feeReminderTime = feeReminderTime;
      }
      
      if (feeReminderGapDays !== undefined) {
        if (feeReminderGapDays < 1 || feeReminderGapDays > 30) {
          return res.status(400).json({
            success: false,
            message: 'Fee reminder gap days must be between 1 and 30'
          });
        }
        updates.feeReminderGapDays = feeReminderGapDays;
      }
      
      if (birthdayWishTime !== undefined) {
        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(birthdayWishTime)) {
          return res.status(400).json({
            success: false,
            message: 'Birthday wish time must be in HH:MM format (e.g., 09:00)'
          });
        }
        updates.birthdayWishTime = birthdayWishTime;
      }
      
      if (isActive !== undefined) {
        updates.isActive = Boolean(isActive);
      }
      
      // Update settings
      const updatedSettings = await AutoMessageSettings.updateSettings(updates);
      
      console.log('✅ Settings updated successfully:', updatedSettings);
      
      // Refresh scheduler with new settings
      try {
        const autoMessageScheduler = (await import('../services/scheduler/autoMessageScheduler.js')).default;
        await autoMessageScheduler.refreshSettings();
        console.log('🔄 Scheduler refreshed with new settings');
      } catch (error) {
        console.error('⚠️ Failed to refresh scheduler:', error.message);
      }
      
      res.json({
        success: true,
        message: 'Settings updated successfully',
        settings: {
          feeReminderTime: updatedSettings.feeReminderTime,
          feeReminderGapDays: updatedSettings.feeReminderGapDays,
          birthdayWishTime: updatedSettings.birthdayWishTime,
          isActive: updatedSettings.isActive,
          lastUpdated: updatedSettings.lastUpdated
        }
      });
      
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        error: error.message
      });
    }
  },

  // Reset to default settings
  resetSettings: async (req, res) => {
    try {
      console.log('🔄 Resetting auto message settings to defaults...');
      
      const defaultSettings = await AutoMessageSettings.updateSettings({
        feeReminderTime: '10:00',
        feeReminderGapDays: 1,
        birthdayWishTime: '09:00',
        isActive: true
      });
      
      console.log('✅ Settings reset to defaults:', defaultSettings);
      
      // Refresh scheduler with new settings
      try {
        const autoMessageScheduler = (await import('../services/scheduler/autoMessageScheduler.js')).default;
        await autoMessageScheduler.refreshSettings();
        console.log('🔄 Scheduler refreshed with new settings');
      } catch (error) {
        console.error('⚠️ Failed to refresh scheduler:', error.message);
      }
      
      res.json({
        success: true,
        message: 'Settings reset to defaults successfully',
        settings: {
          feeReminderTime: defaultSettings.feeReminderTime,
          feeReminderGapDays: defaultSettings.feeReminderGapDays,
          birthdayWishTime: defaultSettings.birthdayWishTime,
          isActive: defaultSettings.isActive,
          lastUpdated: defaultSettings.lastUpdated
        }
      });
      
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset settings',
        error: error.message
      });
    }
  }
};

export default autoMessageSettingsController;
