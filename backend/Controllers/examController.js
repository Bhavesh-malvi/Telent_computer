import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import StudentExamAccess from '../Model/StudentExamAccess.js';
import ExamAttempt from '../Model/ExamAttempt.js';
import Question from '../Model/Question.js';

// Helper to get logged-in studentId; fallback to body for now
function getStudentId(req) {
  // If you have separate student auth, extract from req.user
  return req.user?.id || req.body.studentId || req.query.studentId;
}

export const adminSetEligibility = async (req, res, next) => {
  try {
    const { studentId, courseId, isEligible } = req.body;
    if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid studentId or courseId' });
    }
    const access = await StudentExamAccess.findOneAndUpdate(
      { studentId, courseId },
      { $set: { isEligible: !!isEligible } },
      { upsert: true, new: true }
    );
    res.json({ status: 'ok', access });
  } catch (err) {
    next(err);
  }
};

export const adminSetPassword = async (req, res, next) => {
  try {
    const { studentId, courseId, password } = req.body;
    if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(courseId) || !password) {
      return res.status(400).json({ status: 'error', message: 'Invalid input' });
    }
    const hash = await bcrypt.hash(password, 10);
    const access = await StudentExamAccess.findOneAndUpdate(
      { studentId, courseId },
      { $set: { examPasswordHash: hash, isEligible: true } },
      { upsert: true, new: true }
    );
    res.json({ status: 'ok', accessId: access._id });
  } catch (err) {
    next(err);
  }
};

export const getEligibleCourses = async (req, res, next) => {
  try {
    const studentId = getStudentId(req);
    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid student' });
    }
    const list = await StudentExamAccess.find({ studentId, isEligible: true, examPasswordHash: { $exists: true, $ne: null } })
      .populate('courseId', 'name')
      .lean();
    const attemptIds = list.map(a => a.attemptId).filter(Boolean);
    let attemptsByCourse = new Map();
    if (attemptIds.length) {
      const attempts = await ExamAttempt.find({ _id: { $in: attemptIds } }).select('courseId status submittedAt').lean();
      attemptsByCourse = new Map(attempts.map(t => [String(t.courseId), t]));
    }
    const items = list
      .map(a => {
        const courseIdStr = String(a.courseId?._id || a.courseId);
        const attempt = attemptsByCourse.get(courseIdStr);
        // If submitted, show for 24 hours for review; else hide
        if (attempt && attempt.status === 'submitted') {
          const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : 0;
          const within24h = submittedAt && (Date.now() - submittedAt) <= (24 * 60 * 60 * 1000);
          if (!within24h) return null;
          return {
            courseId: a.courseId?._id || a.courseId,
            courseName: a.courseId?.name || '',
            attemptId: attempt._id // will open result view
          };
        }
        return {
          courseId: a.courseId?._id || a.courseId,
          courseName: a.courseId?.name || '',
          attemptId: attempt && attempt.status === 'in_progress' ? attempt._id : null
        };
      })
      .filter(Boolean);
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const startExam = async (req, res, next) => {
  try {
    const { courseId, password } = req.body;
    const studentId = getStudentId(req);
    if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(courseId) || !password) {
      return res.status(400).json({ status: 'error', message: 'Invalid input' });
    }
    const access = await StudentExamAccess.findOne({ studentId, courseId });
    if (!access || !access.isEligible || !access.examPasswordHash) {
      return res.status(403).json({ status: 'error', message: 'Not eligible' });
    }
    const ok = await bcrypt.compare(password, access.examPasswordHash);
    if (!ok) {
      return res.status(401).json({ status: 'error', message: 'Incorrect password' });
    }
    // Enforce single attempt
    const existing = await ExamAttempt.findOne({ studentId, courseId });
    if (existing) {
      if (existing.status === 'submitted') {
        return res.status(403).json({ status: 'error', message: 'Attempt already used' });
      }
      // Resume existing
      return res.json({ attemptId: existing._id, status: existing.status });
    }
    // Sample 30 random questions
    const total = await Question.countDocuments({ courseId, isActive: true });
    if (total < 30) {
      return res.status(400).json({ status: 'error', message: 'Not enough questions in bank' });
    }
    const pipeline = [
      { $match: { courseId: new mongoose.Types.ObjectId(courseId), isActive: true } },
      { $sample: { size: 30 } },
      { $project: { _id: 1 } }
    ];
    const sampled = await Question.aggregate(pipeline);
    const questionIds = sampled.map(q => q._id);
    const attempt = await ExamAttempt.create({
      studentId,
      courseId,
      questionIds,
      total: 30,
      status: 'in_progress'
    });
    // Link attempt to access
    await StudentExamAccess.updateOne({ _id: access._id }, { $set: { attemptId: attempt._id } });
    res.json({ attemptId: attempt._id, status: attempt.status });
  } catch (err) {
    next(err);
  }
};

export const getAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const studentId = getStudentId(req);
    if (!mongoose.isValidObjectId(attemptId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid attemptId' });
    }
    const attempt = await ExamAttempt.findById(attemptId).lean();
    if (!attempt || String(attempt.studentId) !== String(studentId)) {
      return res.status(404).json({ status: 'error', message: 'Attempt not found' });
    }
    const questions = await Question.find({ _id: { $in: attempt.questionIds } }).lean();
    const qMap = new Map(questions.map(q => [String(q._id), q]));
    if (attempt.status === 'submitted') {
      // Return result view with correct answers
      const breakdown = attempt.breakdown || [];
      const payload = attempt.questionIds.map(qid => {
        const q = qMap.get(String(qid)) || {};
        const br = breakdown.find(b => String(b.questionId) === String(qid)) || {};
        return {
          questionId: qid,
          text: q.text,
          options: q.options,
          selected: br.selected,
          correctAnswer: br.correctAnswer,
          isCorrect: !!br.isCorrect
        };
      });
      return res.json({ status: attempt.status, score: attempt.score, total: attempt.total, items: payload });
    }
    // In progress - do not expose correct answers
    const answersMap = new Map((attempt.answers || []).map(a => [String(a.questionId), a.selected]));
    const payload = attempt.questionIds.map(qid => {
      const q = qMap.get(String(qid)) || {};
      return {
        questionId: qid,
        text: q.text,
        options: q.options,
        selected: answersMap.get(String(qid)) || null
      };
    });
    res.json({ status: attempt.status, items: payload });
  } catch (err) {
    next(err);
  }
};

export const submitAttempt = async (req, res, next) => {
  try {
    const { attemptId, answers } = req.body;
    const studentId = getStudentId(req);
    if (!mongoose.isValidObjectId(attemptId) || !Array.isArray(answers)) {
      return res.status(400).json({ status: 'error', message: 'Invalid input' });
    }
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt || String(attempt.studentId) !== String(studentId)) {
      return res.status(404).json({ status: 'error', message: 'Attempt not found' });
    }
    if (attempt.status === 'submitted') {
      return res.status(400).json({ status: 'error', message: 'Already submitted' });
    }
    // Prepare maps
    const ansMap = new Map(answers.map(a => [String(a.questionId), a.selected]));
    const questions = await Question.find({ _id: { $in: attempt.questionIds } }).lean();
    let score = 0;
    const breakdown = [];
    for (const q of questions) {
      const selected = ansMap.get(String(q._id)) || null;
      const correct = q.correctAnswer;
      const isCorrect = !!selected && selected === correct;
      if (isCorrect) score += (q.marks || 1);
      breakdown.push({
        questionId: q._id,
        selected,
        correctAnswer: correct,
        isCorrect
      });
    }
    attempt.answers = answers;
    attempt.status = 'submitted';
    attempt.score = score;
    attempt.total = attempt.questionIds.length;
    attempt.submittedAt = new Date();
    attempt.breakdown = breakdown;
    await attempt.save();
    res.json({ status: 'submitted', score: attempt.score, total: attempt.total, items: breakdown });
  } catch (err) {
    next(err);
  }
};


