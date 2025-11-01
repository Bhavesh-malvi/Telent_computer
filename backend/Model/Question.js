import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    key: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    text: { type: String, required: true }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentCourse', required: true, index: true },
    questionNo: { type: Number },
    text: { type: String, required: true },
    options: {
      type: [optionSchema],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length >= 2 && arr.length <= 6;
        },
        message: 'Options must contain between 2 and 6 entries.'
      }
    },
    correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    marks: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    source: { type: String, enum: ['Excel', 'Manual'], default: 'Excel' },
    dedupeHash: { type: String, required: true }
  },
  { timestamps: true }
);

// Unique composite index to prevent duplicates per course
questionSchema.index({ courseId: 1, dedupeHash: 1 }, { unique: true });

export default mongoose.model('Question', questionSchema);


