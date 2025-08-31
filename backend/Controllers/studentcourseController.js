import Course from "../Model/studentCourse.js";
import cloudinary from "../config/cloudinary.js";
import StudentCourse from '../Model/studentCourse.js';

// Removed all functions, variables, and logic related to pdf, Google Drive links, and PDF uploads/processing.

export const addCourse = async (req, res) => {
  try {
    const { name, fees, duration, badge, description, category } = req.body;
    // Ensure fees is a valid number
    const feesNumber = fees ? parseFloat(fees) : 0;
    if (isNaN(feesNumber)) {
      return res.status(400).json({ message: 'Invalid fees amount' });
    }
    let imageUrl = '';
    // Handle image upload
    if (req.files && req.files.image && req.files.image[0]) {
      const upload = await cloudinary.uploader.upload(req.files.image[0].path, { 
        folder: 'courses',
        access_mode: 'public'
      });
      imageUrl = upload.secure_url;
    }
    
    const course = await Course.create({ 
      name, 
      fees: feesNumber, 
      duration,
      badge,
      description,
      category,
      image: imageUrl 
    });
    
    res.status(201).json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const editCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    
    // Convert fees to number if present
    if (updates.fees) {
      const feesNumber = parseFloat(updates.fees);
      if (isNaN(feesNumber)) {
        return res.status(400).json({ message: 'Invalid fees amount' });
      }
      updates.fees = feesNumber;
    }

    // Allow updating duration, badge, description, and category
    if (updates.duration !== undefined) updates.duration = updates.duration;
    if (updates.badge !== undefined) updates.badge = updates.badge;
    if (updates.description !== undefined) updates.description = updates.description;
    if (updates.category !== undefined) updates.category = updates.category;
    
    // Handle image upload - only update if new image is provided
    if (req.files && req.files.image && req.files.image[0]) {
      const upload = await cloudinary.uploader.upload(req.files.image[0].path, { 
        folder: 'courses',
        access_mode: 'public'
      });
      updates.image = upload.secure_url;
    }
    // If no new image is uploaded, keep the existing image (don't update image field)
    
    const course = await Course.findByIdAndUpdate(id, updates, { new: true });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await Course.findByIdAndDelete(id);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().select('_id name fees duration image createdAt description badge category');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentCourseById = async (req, res) => {
  try {
    const course = await StudentCourse.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const courseController = {
  addCourse,
  editCourse,
  deleteCourse,
  getCourses,
  getStudentCourseById
};

export default courseController; 