import mongoose from 'mongoose';

const autoMessageSettingsSchema = new mongoose.Schema({
  // Fee Reminder Settings
  feeReminderTime: {
    type: String,
    default: '10:00',
    required: true
  },
  feeReminderGapDays: {
    type: Number,
    default: 1,
    required: true,
    min: 1,
    max: 30
  },
  
  // Birthday Wish Settings
  birthdayWishTime: {
    type: String,
    default: '09:00',
    required: true
  },
  
  // System Settings
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Last reminder sent tracking
  lastFeeReminderSent: {
    type: Date,
    default: null
  },
  
  // Created by
  createdBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Validation for time format (HH:MM)
autoMessageSettingsSchema.path('feeReminderTime').validate(function(value) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(value);
}, 'Fee reminder time must be in HH:MM format');

autoMessageSettingsSchema.path('birthdayWishTime').validate(function(value) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(value);
}, 'Birthday wish time must be in HH:MM format');

// Get or create default settings
autoMessageSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      feeReminderTime: '10:00',
      feeReminderGapDays: 1,
      birthdayWishTime: '09:00',
      isActive: true
    });
  }
  return settings;
};

// Update settings
autoMessageSettingsSchema.statics.updateSettings = async function(updates) {
  const settings = await this.getSettings();
  
  // Update fields
  if (updates.feeReminderTime !== undefined) {
    settings.feeReminderTime = updates.feeReminderTime;
  }
  if (updates.feeReminderGapDays !== undefined) {
    settings.feeReminderGapDays = updates.feeReminderGapDays;
  }
  if (updates.birthdayWishTime !== undefined) {
    settings.birthdayWishTime = updates.birthdayWishTime;
  }
  if (updates.isActive !== undefined) {
    settings.isActive = updates.isActive;
  }
  
  settings.lastUpdated = new Date();
  await settings.save();
  
  return settings;
};

const AutoMessageSettings = mongoose.model('AutoMessageSettings', autoMessageSettingsSchema);

export default AutoMessageSettings;
