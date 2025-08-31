import mongoose from 'mongoose';

const birthdayWishSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  contactNo: {
    type: String,
    required: true
  },
  wishDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent'
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one wish per student per day
birthdayWishSchema.index({ studentId: 1, wishDate: 1 }, { unique: true });

const BirthdayWish = mongoose.model('BirthdayWish', birthdayWishSchema);

export default BirthdayWish;
