import mongoose from 'mongoose';

const installmentSchema = new mongoose.Schema({
  amount: Number,
  paid: { type: Boolean, default: false },
  dueDate: { type: Date },
});

const studentSchema = new mongoose.Schema({
  // Basic Information
  formNo: { type: String },
  date: { type: String },
  studentId: { type: String, unique: true, sparse: true }, // sparse allows multiple null values
  password: { type: String },
  courseStatus: { type: String, default: 'padding' },
  courseProgress: { 
    type: Map, 
    of: Boolean, 
    default: new Map() 
  },
  isCompleted: { type: Boolean, default: false },
  isLoginAllowed: { type: Boolean, default: true },
  image: { type: String },
  
  // Ex-Student/Status Information
  status: { type: String, enum: ['active', 'ex-student'], default: 'active' },
  completedYear: { type: Number },
  
  // Student Information
  name: { type: String, required: true },
  surname: { type: String },
  fatherHusbandName: { type: String },
  dob: { type: Date, required: true },
  gender: { type: String },
  educationLevel: { type: String },
  schoolCollegeName: { type: String },
  aadhar: { type: String, required: true, unique: true },
  certificate: { type: String },
  marksheets: [String],
  
  // Family Information
  fatherName: { type: String },
  fatherOccupation: { type: String },
  motherName: { type: String },
  motherOccupation: { type: String },
  
  // Address Information
  address: { type: String },
  area: { type: String },
  city: { type: String },
  pinCode: { type: String },
  contactNo: { type: String },
  fatherNo: { type: String },
  email: { type: String, required: true, unique: true },
  homeContact: { type: String },
  
  // Course and Fee Information
  selectedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudentCourse' }],
  discount: { type: Number, default: 0 },
  totalFees: { type: Number, required: true },
  totalDue: { type: Number, required: true },
  installments: [installmentSchema],
  originalInstallments: [installmentSchema],
  
  // Reference Information
  reference: { type: String },
  inquiryBy: { type: String },
  inquiryDate: { type: String },
  enquiryType: { type: String, enum: ['Enquiry', 'Admission'], default: 'Enquiry' },
  
  // Payment History
  paymentHistory: [
    {
      amount: Number,
      date: { type: Date, default: Date.now },
      method: { type: String },
      utrNumber: { type: String },
      paidBy: { type: String }, // Add paidBy field
      chequeDetails: {
        chequeNumber: String,
        bankName: String,
        chequeDate: Date,
        accountHolderName: String,
        branchName: String,
        status: String
      }
    }
  ],

  // WhatsApp Reminder Tracking - Now using separate model
  // whatsappReminders: { type: Array, default: [] }, // Removed - using separate model
  lastReminderDate: {
    type: Date,
    default: null
  },
  nextReminderDate: {
    type: Date,
    default: null
  },
  reminderCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Transform Map to Object for JSON serialization
studentSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.courseProgress && ret.courseProgress instanceof Map) {
      ret.courseProgress = Object.fromEntries(ret.courseProgress);
    }
    return ret;
  }
});

// Transform Map to Object for toObject() as well
studentSchema.set('toObject', {
  transform: function(doc, ret) {
    if (ret.courseProgress && ret.courseProgress instanceof Map) {
      ret.courseProgress = Object.fromEntries(ret.courseProgress);
    }
    return ret;
  }
});

// WhatsApp reminder middleware removed - using separate model now

export default mongoose.model('Student', studentSchema); 