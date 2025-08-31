import Issue from '../Model/Issue.js';
import Student from '../Model/Student.js';

const issueController = {
  // Get all issues with student details
  getAllIssues: async (req, res) => {
    try {
      const issues = await Issue.find()
        .populate({
          path: 'student',
          model: 'Student',
          select: 'studentId name email'
        })
        .sort({ createdAt: -1 });

      // Format the response to include student details
      const formattedIssues = issues.map(issue => ({
        _id: issue._id,
        description: issue.description,
        status: issue.status,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        student: issue.student ? {
          _id: issue.student._id,
          studentId: issue.student.studentId,
          name: issue.student.name,
          email: issue.student.email
        } : null
      }));

      res.json(formattedIssues);
    } catch (err) {
      console.error('Error fetching issues:', err);
      res.status(500).json({ message: err.message });
    }
  },

  // Get all active issues for a specific student
  getStudentIssues: async (req, res) => {
    try {
      const { studentId } = req.params;
      
      // First find the student by studentId
      const student = await Student.findOne({ studentId });
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const issues = await Issue.find({
        student: student._id,
        status: { $in: ['pending', 'in-progress'] }
      }).sort({ createdAt: -1 });

      res.json(issues);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get all students with active issues
  getStudentsWithActiveIssues: async (req, res) => {
    try {
      // First get all active issues
      const activeIssues = await Issue.find({
        status: { $in: ['pending', 'in-progress'] }
      }).populate('student', 'studentId');

      // Extract unique studentIds
      const studentIds = [...new Set(
        activeIssues
          .map(issue => issue.student?.studentId)
          .filter(id => id) // Remove any null/undefined values
      )];

      res.json(studentIds);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update issue status
  updateIssueStatus: async (req, res) => {
    try {
      const { issueId } = req.params;
      const { status } = req.body;

      if (!['pending', 'in-progress', 'solved'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const issue = await Issue.findByIdAndUpdate(
        issueId,
        { status },
        { new: true }
      ).populate('student', 'studentId name email');

      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }

      res.json(issue);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Create a new issue
  createIssue: async (req, res) => {
    try {
      const { studentId, description } = req.body;

      // Find student by studentId
      const student = await Student.findOne({ studentId });
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const issue = await Issue.create({
        student: student._id,
        description,
        status: 'pending'
      });

      // Populate student details before sending response
      const populatedIssue = await Issue.findById(issue._id)
        .populate('student', 'studentId name email');

      res.status(201).json(populatedIssue);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

export default issueController; 