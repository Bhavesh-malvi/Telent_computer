import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: false,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['Basic Clerk', 'IT Clerk', 'Basic Manager', 'IT Manager', 'SuperAdmin'],
      required: true,
    },
    lastActiveAt: {
      type: Date,
      default: null,
      index: true
    },
    lastLoginAt: {
      type: Date,
      default: null,
      index: true
    },
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Staff = mongoose.model('Staff', StaffSchema);
export default Staff;


