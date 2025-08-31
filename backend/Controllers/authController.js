import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Student from '../Model/Student.js';
import Staff from '../Model/Staff.js';
import cloudinary from '../config/cloudinary.js';
import nodemailer from 'nodemailer';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

const authController = {
  loginStudent: async (req, res) => {
    try {
      const { studentId, password } = req.body;
      
      // Find student
      const student = await Student.findOne({ studentId })
        .populate('selectedCourses', 'name image pdf');
        
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Check if login is allowed
      if (student.isLoginAllowed === false) {
        return res.status(403).json({ message: 'Your course has been completed. Login disabled.' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, student.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create token
      const token = jwt.sign(
        { 
          id: student._id,
          studentId: student.studentId,
          type: 'student'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Create a sanitized version of student data
      const sanitizedStudent = {
        _id: student._id, // Use _id instead of id for consistency
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        image: student.image,
        selectedCourses: student.selectedCourses.map(course => ({
          _id: course._id,
          name: course.name,
          image: course.image,
          pdf: course.pdf
        }))
      };

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/'
      });

      // Send response
      res.json({
        message: 'Login successful',
        student: {
          ...sanitizedStudent,
          token // Include token in response
        }
      });

    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ 
        message: 'Server error during login',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  getProfile: async (req, res) => {
    try {
      // Since we have user ID from middleware, fetch fresh student data
      const student = await Student.findById(req.user.id || req.user._id)
        .select('-password')
        .populate('selectedCourses', 'name image pdf');

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Create a sanitized version of student data
      const sanitizedStudent = {
        _id: student._id, // Use _id instead of id for consistency
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        image: student.image,
        selectedCourses: student.selectedCourses.map(course => ({
          _id: course._id,
          name: course.name,
          image: course.image,
          pdf: course.pdf
        }))
      };

      res.json({ student: sanitizedStudent });
    } catch (err) {
      res.status(500).json({ message: 'Server error while fetching profile' });
    }
  },

  logoutStudent: async (req, res) => {
    try {
      // Clear the cookie with same settings as when setting it
      res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 0,
        path: '/'
      });
      
      res.json({ message: 'Logout successful' });
    } catch (err) {
      res.status(500).json({ message: 'Server error during logout' });
    }
  },



  loginStaff: async (req, res) => {
    try {
      const { userId, password } = req.body; // userId can be username or email
      
      const staff = await Staff.findOne({ $or: [{ username: userId }, { email: userId }] });
      
      if (!staff) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const ok = await bcrypt.compare(password, staff.password);
      
      if (!ok) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { 
          id: staff._id, 
          role: staff.role, 
          type: 'staff',
          username: staff.username,
          firstName: staff.firstName,
          lastName: staff.lastName
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Update lastActiveAt and lastLoginAt on login
      try {
        const now = new Date();
        staff.lastActiveAt = now;
        staff.lastLoginAt = now;
        await staff.save();
        // broadcast presence
        try { 
          // req.app is not available here; export io via app locals
          const io = global.__io;
          io?.emit('staff:presence', { id: String(staff._id), lastActiveAt: staff.lastActiveAt, lastLoginAt: staff.lastLoginAt });
        } catch {}
      } catch (e) {
        // Failed to update staff lastActiveAt/lastLoginAt on login
      }

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
      });

      // Create sanitized staff response (no sensitive data)
      const sanitizedStaff = {
        _id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        username: staff.username,
        role: staff.role,
        image: staff.image,
        lastLoginAt: staff.lastLoginAt
      };

      res.json({ 
        message: 'Login successful', 
        role: staff.role, 
        staff: sanitizedStaff,
        token: token // Add token to response
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error during staff login' });
    }
  },

  updateProfileImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded' });
      }

      const userId = req.user.id;
      const imageFile = req.file;

      // Upload to Cloudinary
      try {
        const result = await cloudinary.uploader.upload(imageFile.path, {
          folder: 'student_profiles'
        });

        // Update student profile with new image URL
        const updatedStudent = await Student.findByIdAndUpdate(
          userId,
          { image: result.secure_url },
          { new: true }
        );

        res.json({
          message: 'Profile image updated successfully',
          image: result.secure_url,
          student: updatedStudent
        });
      } catch (cloudinaryError) {
        throw cloudinaryError;
      }
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to update profile image',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  validateToken: async (req, res) => {
    try {
      // If we reach here, token is valid (authMiddleware already validated it)
      // Just return success to confirm token is still valid
      res.json({ 
        message: 'Token is valid',
        user: {
          id: req.user.id,
          type: req.user.type,
          role: req.user.role || 'student'
        }
      });
    } catch (error) {
      res.status(401).json({ message: 'Token validation failed' });
    }
  },

  registerSuperAdmin: async (req, res) => {
    try {
      const { username, password, firstName, lastName } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Username and password are required' 
        });
      }

      // Check if username already exists
      const existingStaff = await Staff.findOne({ username });

      if (existingStaff) {
        return res.status(409).json({ 
          message: 'Username already exists' 
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create SuperAdmin
      const superAdmin = new Staff({
        username,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        email: process.env.EMAIL_USER || '', // Add email from environment
        role: 'SuperAdmin',
        lastActiveAt: new Date(),
        lastLoginAt: new Date()
      });

      await superAdmin.save();

      // Remove password from response
      const { password: _, ...superAdminResponse } = superAdmin.toObject();

      res.status(201).json({
        message: 'SuperAdmin registered successfully',
        superAdmin: superAdminResponse
      });

    } catch (error) {
      res.status(500).json({ 
        message: 'Server error during SuperAdmin registration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Generate and send OTP
  generateOTP: async (req, res) => {
    try {
      // Use fixed email from environment variables
      const email = process.env.EMAIL_USER;
      
      if (!email) {
        return res.status(500).json({ message: 'Email configuration not found' });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with email (expires in 10 minutes)
      otpStore.set(email, {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      });

      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Update OTP - TCIT',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">TCIT Password Update</h2>
            <p>You have requested to update your password. Use the following OTP to proceed:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #2563eb; font-size: 32px; margin: 0;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr>
            <p style="color: #6b7280; font-size: 12px;">Talent Computer Institute</p>
          </div>
        `
      };

      // Send email
      await transporter.sendMail(mailOptions);

      res.json({ 
        message: 'OTP sent successfully to your email',
        email: email 
      });

    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to send OTP',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Verify OTP
  verifyOTP: async (req, res) => {
    try {
      const { otp } = req.body;
      
      if (!otp) {
        return res.status(400).json({ message: 'OTP is required' });
      }

      // Use fixed email from environment variables
      const email = process.env.EMAIL_USER;
      const storedData = otpStore.get(email);
      
      if (!storedData) {
        return res.status(400).json({ message: 'OTP not found or expired' });
      }

      if (Date.now() > storedData.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ message: 'OTP has expired' });
      }

      if (storedData.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // OTP is valid, remove it from store
      otpStore.delete(email);

      res.json({ 
        message: 'OTP verified successfully',
        verified: true
      });

    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to verify OTP',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Update password
  updatePassword: async (req, res) => {
    try {
      const { newPassword, confirmPassword } = req.body;
      
      if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      // Find SuperAdmin by role (since email might not be set)
      const staff = await Staff.findOne({ role: 'SuperAdmin' });
      
      if (!staff) {
        return res.status(404).json({ message: 'SuperAdmin not found' });
      }

      // Don't update email to avoid duplicate key errors
      // Just update the password

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      staff.password = hashedPassword;
      await staff.save();

      res.json({ 
        message: 'Password updated successfully'
      });

    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to update password',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Add logout for staff to clear presence immediately
authController.logoutStaff = async (req, res) => {
  try {
    // Clear cookie similar to logoutStudent
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 0,
      path: '/'
    });

    // If staff, set lastActiveAt to null
    try {
      if (req.user?.type === 'staff' && req.user?.id) {
        const u = await Staff.findByIdAndUpdate(req.user.id, { lastActiveAt: null }, { new: true, select: '_id lastActiveAt' });
        try { global.__io?.emit('staff:presence', { id: String(u._id), lastActiveAt: null }); } catch {}
      }
    } catch (e) {
      // Failed to clear staff presence on logout
    }

    res.json({ message: 'Logout successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during logout' });
  }
};

export default authController; 