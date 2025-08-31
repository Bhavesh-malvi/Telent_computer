import mongoose from 'mongoose';

const reminderSettingsSchema = new mongoose.Schema({
  // Fee Reminder Settings
  reminderGap: {
    type: Number,
    default: 4,
    min: 1,
    max: 10,
    required: true
  },
  reminderTime: {
    type: String,
    default: '10:00',
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:MM format (e.g., 10:00)'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Birthday Wishes Settings
  birthdayWishTime: {
    type: String,
    default: '11:00',
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:MM format (e.g., 11:00)'
    }
  },
  birthdayWishesActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ReminderSettings = mongoose.model('ReminderSettings', reminderSettingsSchema);

export default ReminderSettings;
