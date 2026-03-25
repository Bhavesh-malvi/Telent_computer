import Enrollment from '../Model/Enrollment.js';
import { sendAdminEmail } from '../utils/sendEmail.js';

// Validation helper
const validateEnrollment = (data) => {
  const errors = [];
  
  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push('Full name is required and must be at least 2 characters');
  }
  
  if (!data.email || !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('Valid email is required');
  }
  
  if (!data.phone || !data.phone.match(/^\+?[\d\s-]{10,}$/)) {
    errors.push('Valid phone number is required (minimum 10 digits)');
  }
  
  if (!data.course || data.course.trim().length < 2) {
    errors.push('Course name is required');
  }
  
  return errors;
};

// POST - Create new enrollment
export const createEnrollment = async (req, res) => {
  try {
    const { fullName, email, phone, course } = req.body;
    
    // Validate input
    const validationErrors = validateEnrollment({ fullName, email, phone, course });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Check for duplicate enrollment
    const existingEnrollment = await Enrollment.findOne({ 
      email, 
      course,
      createdAt: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    });
    
    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'You have already enrolled for this course recently'
      });
    }

    const newEnrollment = new Enrollment({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      course: course.trim()
    });

    const savedEnrollment = await newEnrollment.save();

    console.log(`[Enrollment Form] Entry saved for ${fullName}. Attempting to send Admin Email...`);
    
    // Send email to admin
    const emailSubject = `New Course Enrollment: ${course} by ${fullName}`;
    const emailHtml = `
      <h3>New Enrollment Received</h3>
      <p><strong>Full Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Course:</strong> ${course}</p>
    `;
    sendAdminEmail(emailSubject, emailHtml);
    
    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      data: savedEnrollment
    });
  } catch (error) {
    console.error('Create Enrollment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating enrollment',
      error: error.message
    });
  }
};

// GET - Get all enrollments
export const getAllEnrollments = async (req, res) => {
  try {
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Add filters
    const filter = {};
    if (req.query.course) {
      filter.course = new RegExp(req.query.course, 'i');
    }
    if (req.query.email) {
      filter.email = new RegExp(req.query.email, 'i');
    }
    
    // Get total count for pagination
    const total = await Enrollment.countDocuments(filter);
    
    // Get enrollments with pagination and filters
    const enrollments = await Enrollment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: enrollments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: enrollments
    });
  } catch (error) {
    console.error('Get Enrollments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// GET - Get single enrollment by ID
export const getEnrollmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enrollment ID format'
      });
    }
    
    const enrollment = await Enrollment.findById(id);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Get Enrollment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment',
      error: error.message
    });
  }
};

// DELETE - Delete enrollment by ID
export const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enrollment ID format'
      });
    }
    
    const enrollment = await Enrollment.findByIdAndDelete(id);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Enrollment deleted successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Delete Enrollment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting enrollment',
      error: error.message
    });
  }
}; 