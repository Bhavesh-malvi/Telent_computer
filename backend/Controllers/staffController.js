import bcrypt from 'bcryptjs';
import Staff from '../Model/Staff.js';
import cloudinary from '../config/cloudinary.js';

const createStaff = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, role } = req.body;
    const usernameNorm = (username || '').trim();
    const emailNorm = (email || '').trim().toLowerCase();

    if (!firstName || !lastName || !usernameNorm || !emailNorm || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Precise duplicate checks to return field-specific errors
    const usernameExists = await Staff.findOne({ username: usernameNorm });
    if (usernameExists) {
      return res.status(409).json({ message: 'Username already exists', field: 'username' });
    }
    const emailExists = await Staff.findOne({ email: emailNorm });
    if (emailExists) {
      return res.status(409).json({ message: 'Email already exists', field: 'email' });
    }

    let imageUrl = '';

    if (req.file) {
      const uploadOptions = { folder: 'staff_profiles' };
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(base64, uploadOptions);
      imageUrl = result.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await Staff.create({
      firstName,
      lastName,
      username: usernameNorm,
      email: emailNorm,
      password: hashedPassword,
      role,
      image: imageUrl,
    });

    // Create sanitized response (no password)
    const sanitizedStaff = {
      _id: staff._id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      username: staff.username,
      email: staff.email,
      role: staff.role,
      image: staff.image,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt
    };

    res.status(201).json({ message: 'Staff created successfully', staff: sanitizedStaff });
  } catch (error) {
    // Handle Mongo duplicate key errors defensively
    if (error && error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
      return res.status(409).json({ message, field });
    }
    console.error('Create staff error:', error);
    res.status(500).json({ message: 'Failed to create staff' });
  }
};

const listStaff = async (req, res) => {
  try {
    const staff = await Staff.find().select('-password').sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    console.error('List staff error:', error);
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
};

const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select('-password');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
};

const updateStaff = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, role } = req.body;
    const { id } = req.params;

    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const usernameNorm = (username || '').trim();
    const emailNorm = (email || '').trim().toLowerCase();

    if (username && usernameNorm !== staff.username) {
      const exists = await Staff.findOne({ username: usernameNorm, _id: { $ne: id } });
      if (exists) return res.status(409).json({ message: 'Username already in use' });
      staff.username = usernameNorm;
    }
    if (email && emailNorm !== staff.email) {
      const exists = await Staff.findOne({ email: emailNorm, _id: { $ne: id } });
      if (exists) return res.status(409).json({ message: 'Email already in use' });
      staff.email = emailNorm;
    }
    if (firstName) staff.firstName = firstName;
    if (lastName) staff.lastName = lastName;
    if (role) {
      staff.role = role;
    }
    if (password && password.length >= 6) {
      staff.password = await bcrypt.hash(password, 10);
    }

    // Optional image update
    if (req.file) {
      const uploadOptions = { folder: 'staff_profiles' };
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(base64, uploadOptions);
      staff.image = result.secure_url;
    }

    await staff.save();
    const { password: _pw, ...safe } = staff.toObject();
    res.json({ message: 'Staff updated successfully', staff: safe });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ message: 'Failed to update staff' });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findByIdAndDelete(id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ message: 'Failed to delete staff' });
  }
};

const staffController = { createStaff, listStaff, getStaffById, updateStaff, deleteStaff };
export default staffController;


