import mongoose from 'mongoose';

const studentExamAccessSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentCourse', required: true, index: true },
  isEligible: { type: Boolean, default: false },
  examPasswordHash: { type: String }, // bcrypt hash
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamAttempt' }
}, { timestamps: true });

studentExamAccessSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export default mongoose.model('StudentExamAccess', studentExamAccessSchema);


