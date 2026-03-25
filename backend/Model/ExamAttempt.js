import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selected: { type: String, enum: ['A', 'B', 'C', 'D'], required: true }
}, { _id: false });

const breakdownSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selected: { type: String, enum: ['A', 'B', 'C', 'D'] },
  correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'] },
  isCorrect: { type: Boolean, required: true }
}, { _id: false });

const examAttemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentCourse', required: true, index: true },
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true }],
  answers: [answerSchema],
  status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },
  score: { type: Number, default: 0 },
  total: { type: Number, default: 30 },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  breakdown: [breakdownSchema]
}, { timestamps: true });

examAttemptSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const ExamAttempt = mongoose.model('ExamAttempt', examAttemptSchema);

// Ensure no TTL index remains on submittedAt (we want to retain records)
try {
  mongoose.connection.once('open', async () => {
    try {
      const indexes = await ExamAttempt.collection.indexes();
      const ttl = indexes.find(ix => ix.key && ix.key.submittedAt === 1 && typeof ix.expireAfterSeconds === 'number');
      if (ttl) {
        await ExamAttempt.collection.dropIndex('submittedAt_1');
      }
    } catch (_) {}
  });
} catch (_) {}

export default ExamAttempt;


