import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'solved'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
issueSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Issue = mongoose.model('Issue', issueSchema);

export default Issue; 