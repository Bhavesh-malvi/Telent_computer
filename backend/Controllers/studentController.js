import Student from '../Model/Student.js';
import Course from '../Model/studentCourse.js';
import bcrypt from 'bcryptjs';
import generateInstallments from '../utils/generateInstallments.js';
import cloudinary from '../config/cloudinary.js';
import Issue from '../Model/Issue.js';
import ExcelJS from 'exceljs';
// Removed old service imports - using new modular services instead
import autoMessageScheduler from '../services/scheduler/autoMessageScheduler.js';
import welcomeMessageService from '../services/welcomeMessageService.js';

const studentController = {
  // Return next available form number (numeric, sequential)
  getNextFormNo: async (req, res) => {
    try {
      const result = await Student.aggregate([
        { $match: { formNo: { $exists: true, $ne: null, $ne: '' } } },
        {
          $addFields: {
            formNoNum: {
              $convert: { input: '$formNo', to: 'int', onError: 0, onNull: 0 }
            }
          }
        },
        { $sort: { formNoNum: -1 } },
        { $limit: 1 }
      ]);

      const maxFormNo = result.length > 0 ? (result[0].formNoNum || 0) : 0;
      const next = maxFormNo + 1;
      res.json({ nextFormNo: String(next), numeric: next });
    } catch (err) {
      res.status(500).json({ message: 'Failed to get next form number', error: err.message });
    }
  },
  registerStudent: async (req, res) => {
    try {
      // Validate content type
      if (!req.headers['content-type']?.includes('multipart/form-data')) {
        return res.status(400).json({ 
          message: 'Invalid content type. Must be multipart/form-data',
          receivedContentType: req.headers['content-type']
        });
      }

      // Handle multiple files
      const imageFile = req.files?.image?.[0];
      const certificateFile = req.files?.certificate?.[0];

      let selectedCoursesArray = [];
      try {
        if (typeof req.body.selectedCourses === 'string') {
          selectedCoursesArray = JSON.parse(req.body.selectedCourses);
        } else if (Array.isArray(req.body.selectedCourses)) {
          selectedCoursesArray = req.body.selectedCourses;
        }
      } catch (e) {
        return res.status(400).json({ message: 'Invalid selectedCourses format' });
      }

      // Remove phone from destructuring
      const { studentId, password, name, email, dob, aadhar, discount, installment } = req.body;
      
      // Age validation
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 6) {
        return res.status(400).json({
          message: 'Student must be at least 6 years old to register',
          providedAge: age,
          minimumAge: 6
        });
      }

      // Validate required fields (studentId and password are now optional)
      const requiredFields = {
        name,
        email,
        dob,
        aadhar,
        selectedCourses: selectedCoursesArray
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value || (Array.isArray(value) && value.length === 0))
        .map(([key]) => key);

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: 'Missing required fields',
          missingFields
        });
      }

      // Check for existing student
      const checkConditions = [{ email }, { aadhar }];
      if (studentId) {
        checkConditions.push({ studentId });
      }
      
      const existing = await Student.findOne({ $or: checkConditions });
      if (existing) {
        const duplicateFields = [];
        if (studentId && existing.studentId === studentId) duplicateFields.push('studentId');
        if (existing.email === email) duplicateFields.push('email');
        if (existing.aadhar === aadhar) duplicateFields.push('aadhar');
        
        // Create specific error message based on duplicate fields
        let specificMessage = '';
        if (duplicateFields.length === 1) {
          const field = duplicateFields[0];
          switch (field) {
            case 'studentId':
              specificMessage = 'Student ID already exists';
              break;
            case 'email':
              specificMessage = 'Email already exists';
              break;
            case 'aadhar':
              specificMessage = 'Aadhar number already exists';
              break;
            default:
              specificMessage = 'Student already exists';
          }
        } else if (duplicateFields.length > 1) {
          const fieldNames = duplicateFields.map(field => {
            switch (field) {
              case 'studentId': return 'Student ID';
              case 'email': return 'Email';
              case 'aadhar': return 'Aadhar number';
              default: return field;
            }
          });
          specificMessage = `${fieldNames.join(', ')} already exist`;
        } else {
          specificMessage = 'Student already exists';
        }
        
        return res.status(409).json({ 
          message: specificMessage, 
          duplicateFields 
        });
      }

      // Hash password (only if provided)
      let hashedPassword = null;
      if (password && password.trim()) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Get course details and calculate fees
      const courses = await Course.find({ _id: { $in: selectedCoursesArray } });
      if (courses.length !== selectedCoursesArray.length) {
        return res.status(400).json({ message: 'One or more selected courses do not exist' });
      }

      const totalFees = courses.reduce((sum, c) => sum + (c?.fees || 0), 0);
      let finalDiscount = Number(discount) || 0;
      let discountedFees = totalFees;
      
      if (finalDiscount > 0) {
        if (finalDiscount <= 100) {
          // treat as percentage
          discountedFees = totalFees - (totalFees * finalDiscount / 100);
        } else {
          // treat as absolute
          discountedFees = totalFees - finalDiscount;
        }
      }

      // Generate installments
      const installments = generateInstallments(discountedFees, Number(installment));
      const originalInstallments = installments.map(inst => ({ ...inst }));

      // Handle image upload
      let imageUrl = '';
      if (imageFile) {
        try {
          const upload = await cloudinary.uploader.upload(imageFile.path, { 
            folder: 'students',
            resource_type: 'auto'
          });
          imageUrl = upload.secure_url;
        } catch (uploadError) {
          return res.status(500).json({ message: 'Failed to upload image' });
        }
      }

      // Handle certificate upload
      let certificateUrl = '';
      if (certificateFile) {
        try {
          const upload = await cloudinary.uploader.upload(certificateFile.path, {
            folder: 'students/certificates',
            resource_type: 'auto'
          });
          certificateUrl = upload.secure_url;
        } catch (err) {
          // error handling
        }
      }

      // Handle marksheets upload
      let marksheetUrls = [];
      if (req.files && req.files.marksheets) {
        for (const file of req.files.marksheets) {
          try {
            const upload = await cloudinary.uploader.upload(file.path, {
              folder: 'students/marksheets',
              resource_type: 'auto'
            });
            marksheetUrls.push(upload.secure_url);
          } catch (err) {
            // error handling
          }
        }
      }

      // Handle courseProgress
      let courseProgress = new Map();
      if (req.body.courseProgress) {
        try {
          const progressData = typeof req.body.courseProgress === 'string' 
            ? JSON.parse(req.body.courseProgress) 
            : req.body.courseProgress;
          courseProgress = new Map(Object.entries(progressData));
        } catch (e) {
          // If parsing fails, use empty Map
        }
      }

      // Create student
      const courseStatus = req.body.courseStatus || 'padding';
      let isCompleted = false;
      let isLoginAllowed = true;
      if (courseStatus === 'completed') {
        isCompleted = true;
        isLoginAllowed = false;
      } else {
        isCompleted = false;
        isLoginAllowed = true;
      }
      // Create student data object
      const studentData = {
        name,
        email,
        dob,
        aadhar,
        image: imageUrl,
        certificate: certificateUrl,
        marksheets: marksheetUrls, // <-- yahan save karo
        selectedCourses: selectedCoursesArray,
        totalFees: discountedFees,
        totalDue: discountedFees, // Add totalDue for new students (no payments yet)
        discount: finalDiscount,
        installments,
        originalInstallments,
        // Add all extra fields from req.body
        address: req.body.address,
        area: req.body.area,
        city: req.body.city,
        pinCode: req.body.pinCode,
        contactNo: req.body.contactNo,
        fatherNo: req.body.fatherNo,
        homeContact: req.body.homeContact,
        motherName: req.body.motherName,
        fatherName: req.body.fatherName,
        fatherOccupation: req.body.fatherOccupation,
        motherOccupation: req.body.motherOccupation,
        formNo: req.body.formNo,
        date: req.body.date,
        reference: req.body.reference,
        inquiryBy: req.body.inquiryBy,
        inquiryDate: req.body.inquiryDate ? new Date(req.body.inquiryDate) : new Date(),
        educationLevel: req.body.educationLevel,
        schoolCollegeName: req.body.schoolCollegeName,
        gender: req.body.gender,
        surname: req.body.surname,
        fatherHusbandName: req.body.fatherHusbandName,
        courseStatus,
        courseProgress,
        isCompleted,
        isLoginAllowed
      };

      // Add optional fields only if provided
      if (studentId) {
        studentData.studentId = studentId;
      }
      if (hashedPassword) {
        studentData.password = hashedPassword;
      }

      const student = await Student.create(studentData);

      // Send welcome message and admission confirmation for new admissions
      if (student.enquiryType === 'Admission') {
        try {
          console.log(`🎉 New admission confirmed for student`);
          
          // Send welcome message asynchronously (don't block the response)
          welcomeMessageService.sendWelcomeMessage(student)
            .then(result => {
              if (result.success) {
                console.log(`✅ Welcome message sent successfully to student (${student.studentId})`);
              } else {
                console.log(`⚠️ Welcome message failed for student (${student.studentId}): ${result.message}`);
              }
            })
            .catch(error => {
              console.error(`❌ Error in welcome message for student:`, error.message);
            });

          // Send real-time admission confirmation asynchronously
          autoMessageScheduler.sendAdmissionConfirmationRealTime(student._id)
            .then(result => {
              if (result && result.success) {
                console.log(`✅ Admission confirmation sent successfully to student`);
              } else {
                console.log(`⚠️ Admission confirmation failed for student`);
              }
            })
            .catch(error => {
              console.error(`❌ Error in admission confirmation for student:`, error.message);
            });
        } catch (error) {
          console.error(`❌ Error sending messages to student:`, error.message);
          // Don't fail the registration if messages fail
        }
      }

      res.status(201).json(student);
    } catch (err) {
      res.status(500).json({ 
        message: 'Registration failed. Please check all required fields and try again.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },
  updateStudent: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      
      // Get existing student data
      const existingStudent = await Student.findById(id);
      if (!existingStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Check for duplicate fields (email, studentId, aadhar) excluding current student
      const { email, studentId, aadhar } = updates;
      if (email || studentId || aadhar) {
        const checkConditions = [];
        if (email) checkConditions.push({ email, _id: { $ne: id } });
        if (studentId) checkConditions.push({ studentId, _id: { $ne: id } });
        if (aadhar) checkConditions.push({ aadhar, _id: { $ne: id } });
        
        if (checkConditions.length > 0) {
          const duplicate = await Student.findOne({ $or: checkConditions });
          if (duplicate) {
            const duplicateFields = [];
            if (email && duplicate.email === email) duplicateFields.push('email');
            if (studentId && duplicate.studentId === studentId) duplicateFields.push('studentId');
            if (aadhar && duplicate.aadhar === aadhar) duplicateFields.push('aadhar');
            
            // Create specific error message based on duplicate fields
            let specificMessage = '';
            if (duplicateFields.length === 1) {
              const field = duplicateFields[0];
              switch (field) {
                case 'studentId':
                  specificMessage = 'Student ID already exists';
                  break;
                case 'email':
                  specificMessage = 'Email already exists';
                  break;
                case 'aadhar':
                  specificMessage = 'Aadhar number already exists';
                  break;
                default:
                  specificMessage = 'Student already exists';
              }
            } else if (duplicateFields.length > 1) {
              const fieldNames = duplicateFields.map(field => {
                switch (field) {
                  case 'studentId': return 'Student ID';
                  case 'email': return 'Email';
                  case 'aadhar': return 'Aadhar number';
                  default: return field;
                }
              });
              specificMessage = `${fieldNames.join(', ')} already exist`;
            } else {
              specificMessage = 'Student already exists';
            }
            
            return res.status(409).json({ 
              message: specificMessage, 
              duplicateFields 
            });
          }
        }
      }

      // Remove payment related fields from updates to prevent accidental modification
      delete updates.paymentHistory;
      
      // Handle selectedCourses and recalculate fees if courses change
      if (updates.selectedCourses) {
        try {
          if (typeof updates.selectedCourses === 'string') {
            updates.selectedCourses = JSON.parse(updates.selectedCourses);
          }
          
          // Calculate total paid amount from existing payments
          const totalPaid = existingStudent.paymentHistory ? 
            existingStudent.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0) : 0;
          
          // Recalculate total fees and installments if courses change
          const courses = await Course.find({ _id: { $in: updates.selectedCourses } });
          if (courses.length !== updates.selectedCourses.length) {
            return res.status(400).json({ message: 'One or more selected courses do not exist' });
          }

          const totalFees = courses.reduce((sum, c) => sum + (c?.fees || 0), 0);
          let finalDiscount = Number(updates.discount || existingStudent.discount || 0);
          let discountedFees = totalFees;
          
          if (finalDiscount > 0) {
            if (finalDiscount <= 100) {
              // treat as percentage
              discountedFees = totalFees - (totalFees * finalDiscount / 100);
            } else {
              // treat as absolute
              discountedFees = totalFees - finalDiscount;
            }
          }

          // Generate new installments
          const newInstallments = generateInstallments(discountedFees, Number(updates.installment || existingStudent.installment || 1));
          const originalInstallments = newInstallments.map(inst => ({ ...inst }));

          // Apply existing payments to new installments
          let remainingPaid = totalPaid;
          const adjustedInstallments = newInstallments.map((inst, index) => {
            const adjustedInst = { ...inst };
            if (remainingPaid > 0) {
              const toDeduct = Math.min(remainingPaid, adjustedInst.amount);
              adjustedInst.amount -= toDeduct;
              remainingPaid -= toDeduct;
              adjustedInst.paid = adjustedInst.amount === 0;
            } else {
              adjustedInst.paid = false;
            }
            return adjustedInst;
          });

          updates.totalFees = discountedFees;
          updates.totalDue = discountedFees - totalPaid; // Add totalDue calculation
          updates.installments = adjustedInstallments;
          updates.originalInstallments = originalInstallments;
          
        } catch (e) {
          return res.status(400).json({ message: 'Invalid selectedCourses format' });
        }
      } else if (updates.discount !== undefined || updates.installment !== undefined) {
        // If only discount or installment changes, recalculate with existing courses
        const totalPaid = existingStudent.paymentHistory ? 
          existingStudent.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0) : 0;
        
        const courses = await Course.find({ _id: { $in: existingStudent.selectedCourses } });
        const totalFees = courses.reduce((sum, c) => sum + (c?.fees || 0), 0);
        let finalDiscount = Number(updates.discount || existingStudent.discount || 0);
        let discountedFees = totalFees;
        
        if (finalDiscount > 0) {
          if (finalDiscount <= 100) {
            discountedFees = totalFees - (totalFees * finalDiscount / 100);
          } else {
            discountedFees = totalFees - finalDiscount;
          }
        }

        const newInstallments = generateInstallments(discountedFees, Number(updates.installment || existingStudent.installment || 1));
        const originalInstallments = newInstallments.map(inst => ({ ...inst }));

        // Apply existing payments to new installments
        let remainingPaid = totalPaid;
        const adjustedInstallments = newInstallments.map(inst => {
          const adjustedInst = { ...inst };
          if (remainingPaid > 0) {
            const toDeduct = Math.min(remainingPaid, adjustedInst.amount);
            adjustedInst.amount -= toDeduct;
            remainingPaid -= toDeduct;
            adjustedInst.paid = adjustedInst.amount === 0;
          } else {
            adjustedInst.paid = false;
          }
          return adjustedInst;
        });

        updates.totalFees = discountedFees;
        updates.totalDue = discountedFees - totalPaid; // Add totalDue calculation
        updates.installments = adjustedInstallments;
        updates.originalInstallments = originalInstallments;
      }

      // Handle selectedCourses
      if (updates.selectedCourses) {
        try {
          if (typeof updates.selectedCourses === 'string') {
            updates.selectedCourses = JSON.parse(updates.selectedCourses);
          }
        } catch (e) {
          return res.status(400).json({ message: 'Invalid selectedCourses format' });
        }
      }

      // Handle image upload
      if (req.files && req.files.image && req.files.image[0]) {
        const upload = await cloudinary.uploader.upload(req.files.image[0].path, { folder: 'students' });
        updates.image = upload.secure_url;
      }

      // Handle password
      if (typeof updates.password !== 'undefined') {
        if (updates.password && updates.password.trim() !== "") {
          updates.password = await bcrypt.hash(updates.password, 10);
        } else {
          delete updates.password;
        }
      }

      // Handle marksheets upload (update ke time)
      let newMarksheetUrls = [];
      if (req.files && req.files.marksheets) {
        for (const file of req.files.marksheets) {
          try {
            const upload = await cloudinary.uploader.upload(file.path, {
              folder: 'students/marksheets',
              resource_type: 'auto'
            });
            newMarksheetUrls.push(upload.secure_url);
          } catch (err) {
            // error handling
          }
        }
      }
      // Purani marksheets ko parse karo agar string aaye
      if (typeof updates.marksheets === 'string') {
        try {
          updates.marksheets = JSON.parse(updates.marksheets);
        } catch (e) {
          updates.marksheets = [];
        }
      }
      // Nayi marksheets add karo (agar hain)
      if (newMarksheetUrls.length > 0) {
        updates.marksheets = (updates.marksheets || existingStudent.marksheets || []).concat(newMarksheetUrls);
      }

      // Handle courseProgress
      if (updates.courseProgress) {
        try {
          const progressData = typeof updates.courseProgress === 'string' 
            ? JSON.parse(updates.courseProgress) 
            : updates.courseProgress;
          updates.courseProgress = new Map(Object.entries(progressData));
        } catch (e) {
          delete updates.courseProgress; // Remove if parsing fails
        }
      }

      // Set isCompleted and isLoginAllowed based on courseStatus
      if (updates.courseStatus) {
        if (updates.courseStatus === 'completed') {
          updates.isCompleted = true;
          updates.isLoginAllowed = false;
          updates.status = 'ex-student';
          updates.completedYear = new Date().getFullYear();
        } else {
          updates.isCompleted = false;
          updates.isLoginAllowed = true;
          updates.status = 'active';
          updates.completedYear = null;
        }
      } else {
        // If courseStatus is not provided, keep the existing value
        updates.courseStatus = existingStudent.courseStatus || 'padding';
      }

      // Use $set to only update specified fields and preserve existing ones
      const student = await Student.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
              ).populate('selectedCourses');

      // Send welcome message if enquiry type changed to "Admission"
      if (updates.enquiryType === 'Admission' && 
          existingStudent.enquiryType !== 'Admission') {
        try {
          console.log(`🎉 Enquiry converted to admission for student`);
          
          // Send welcome message asynchronously (don't block the response)
          welcomeMessageService.sendWelcomeMessage(student)
            .then(result => {
              if (result.success) {
                            console.log(`✅ Welcome message sent successfully to student`);
          } else {
            console.log(`⚠️ Welcome message failed for student: ${result.message}`);
          }
            })
            .catch(error => {
              console.error(`❌ Error in welcome message for ${student.name}:`, error.message);
            });
        } catch (error) {
          console.error(`❌ Error sending welcome message to ${student.name}:`, error.message);
          // Don't fail the update if welcome message fails
        }
      }

      // If only image is being updated, return { image: student.image }
      if (Object.keys(updates).length === 1 && updates.image) {
        return res.json({ image: student.image });
      }

      res.json(student);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  deleteStudent: async (req, res) => {
    try {
      const { id } = req.params;
      await Student.findByIdAndDelete(id);
      res.json({ message: 'Student deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  getStudent: async (req, res) => {
    try {
      const { id } = req.params;
      const student = await Student.findById(id).populate('selectedCourses');
      if (!student) return res.status(404).json({ message: 'Student not found' });
      
      res.json(student);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  payInstallment: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, method, utrNumber, collectedBy, paymentDate } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }
      
      let payAmount = Number(amount);
      if (!payAmount || payAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Validate collectedBy field
      if (!collectedBy || !collectedBy.trim()) {
        return res.status(400).json({ message: "Collected By is required" });
      }

      // Validate paymentDate field
      if (!paymentDate) {
        return res.status(400).json({ message: "Payment Date is required" });
      }

      // Validate paymentDate format
      const paymentDateObj = new Date(paymentDate);
      if (isNaN(paymentDateObj.getTime())) {
        return res.status(400).json({ message: "Invalid payment date format" });
      }

      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      let updated = [...student.installments];
      let totalPaid = 0;
      for (let i = 0; i < updated.length; i++) {
        if (!updated[i].paid && payAmount > 0) {
          const deduct = Math.min(payAmount, updated[i].amount);
          updated[i].amount -= deduct;
          payAmount -= deduct;
          totalPaid += deduct;
          if (updated[i].amount === 0) updated[i].paid = true;
        }
      }
      student.installments = updated;
      if (!student.paymentHistory) student.paymentHistory = [];
      
      // Initialize variables for payment processing
      let paidBy = collectedBy || 'Unknown';
      let paymentDateTime = '';
      console.log(`🔍 Debug - collectedBy: ${collectedBy}, paidBy: ${paidBy}`);
      
            if (totalPaid > 0) {
          // Use provided collectedBy or fallback to current user
          if (!collectedBy) {
            // Fallback to current user info if collectedBy not provided
            const currentUser = req.user;
            if (currentUser) {
              if (currentUser.type === 'staff') {
                const staffName = currentUser.firstName && currentUser.lastName ? 
                                 `${currentUser.firstName} ${currentUser.lastName}` : 
                                 (currentUser.username || 'Staff');
                paidBy = staffName;
              } else if (currentUser.type === 'admin') {
                paidBy = 'SuperAdmin';
              }
            }
          }
          
          // Use provided paymentDate or current date, but save only date string (no time)
          if (paymentDate) {
            // Convert to date string only (YYYY-MM-DD format)
            const dateOnly = new Date(paymentDate);
            const year = dateOnly.getFullYear();
            const month = String(dateOnly.getMonth() + 1).padStart(2, '0');
            const day = String(dateOnly.getDate()).padStart(2, '0');
            paymentDateTime = `${year}-${month}-${day}`;
          } else {
            // Use current date as string
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            paymentDateTime = `${year}-${month}-${day}`;
          }
        
        let paymentRecord = { 
          amount: totalPaid, 
            date: paymentDateTime, 
          method, 
          utrNumber,
            paidBy: paidBy // Use selected collectedBy
        };
        if (method && method.toLowerCase() === 'cheque' && req.body.chequeDetails) {
          try {
            paymentRecord.chequeDetails = typeof req.body.chequeDetails === 'string'
              ? JSON.parse(req.body.chequeDetails)
              : req.body.chequeDetails;
          } catch (e) {
            paymentRecord.chequeDetails = req.body.chequeDetails;
          }
        }
        student.paymentHistory.push(paymentRecord);
        
        // Update totalDue after payment
        const currentTotalPaid = student.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
        student.totalDue = student.totalFees - currentTotalPaid;
        console.log(`🔍 Debug - After payment processing, paidBy: ${paidBy}`);
      } else {
        // No payment recorded, totalPaid: 0
        console.log(`🔍 Debug - No payment recorded, paidBy: ${paidBy}`);
      }
      await student.save();

      // Send fee payment confirmation message
      if (totalPaid > 0) {
        try {
          console.log(`💰 Fee payment of ₹${totalPaid.toLocaleString('en-IN')} received for student`);
          console.log(`👤 Collected By: ${paidBy || 'Unknown'}`);
          
          // Send fee payment message using new service
          const feePaymentService = (await import('../services/messages/feePaymentMessageService.js')).default;
          feePaymentService.sendFeePaymentMessage(student, totalPaid, {
            method: method,
            collectedBy: paidBy || 'Unknown',
            paymentDate: paymentDateTime
          })
            .then(result => {
              if (result.success) {
                            console.log(`✅ Fee payment message sent successfully to student`);
          } else {
            console.log(`⚠️ Fee payment message failed for student: ${result.message}`);
          }
            })
            .catch(error => {
              console.error(`❌ Error in fee payment message for ${student.name}:`, error.message);
            });
        } catch (error) {
          console.error(`❌ Error sending fee payment message to ${student.name}:`, error.message);
          // Don't fail the payment if message fails
        }
      }

      // Fetch updated student with populated selectedCourses
      const updatedStudent = await Student.findById(id).populate('selectedCourses');
      res.json(updatedStudent);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  getTodaysBirthdays: async (req, res) => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      
      // Get birthday students
      const students = await Student.find();
      const birthdayStudents = students.filter(student => {
        // Only include students with enquiryType = 'Admission'
        if (student.enquiryType !== 'Admission') return false;
        
        if (!student.dob) return false;
        let dob;
        if (typeof student.dob === 'string') {
          dob = new Date(student.dob);
        } else if (student.dob instanceof Date) {
          dob = student.dob;
        } else {
          return false;
        }
        if (isNaN(dob.getTime())) {
          return false;
        }
        return (dob.getMonth() + 1 === month) && (dob.getDate() === day);
      });

      // Get today's birthday wishes status
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const BirthdayWish = (await import('../Model/BirthdayWish.js')).default;
      const todayWishes = await BirthdayWish.find({
        studentId: { $in: birthdayStudents.map(s => s._id) },
        wishDate: {
          $gte: todayStart,
          $lte: todayEnd
        }
      });

      // Add wish status to each student
      const studentsWithWishStatus = birthdayStudents.map(student => {
        const wish = todayWishes.find(w => w.studentId.toString() === student._id.toString());
        return {
          ...student.toObject(),
          wishStatus: wish ? wish.status : 'pending'
        };
      });

      res.json(studentsWithWishStatus);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  getAllStudents: async (req, res) => {
    try {
      // Get students with populated course details
      const students = await Student.find().populate('selectedCourses');
      
      // Initialize courseProgress for existing students who don't have it
      for (let student of students) {
        if (!student.courseProgress || student.courseProgress.size === 0) {
          const progressMap = new Map();
          if (student.selectedCourses) {
            student.selectedCourses.forEach(course => {
              progressMap.set(course._id.toString(), false);
            });
          }
          student.courseProgress = progressMap;
          await student.save();
        }
        
        // Initialize paidBy for existing payments that don't have it
        if (student.paymentHistory && student.paymentHistory.length > 0) {
          let needsUpdate = false;
          student.paymentHistory.forEach(payment => {
            if (!payment.paidBy) {
              payment.paidBy = 'Unknown (Legacy)';
              needsUpdate = true;
            }
          });
          if (needsUpdate) {
            await student.save();
          }
        }
      }
      
      // Fetch issues for all students
      const studentsWithIssues = await Promise.all(students.map(async (student) => {
        const issues = await Issue.find({ 
          studentId: student.studentId,
          status: { $ne: 'solved' }  // Only get active issues
        });
        
        const studentObj = student.toObject();
        
        // Transform selectedCourses to include course names instead of just IDs
        studentObj.selectedCourses = studentObj.selectedCourses.map(course => ({
          _id: course._id,
          name: course.name,
          fees: course.fees
        }));
        
        return {
          ...studentObj,
          hasActiveIssues: issues.length > 0,
          issues: issues
        };
      }));

      // Sort students - those with active issues first
      const sortedStudents = studentsWithIssues.sort((a, b) => {
        if (a.hasActiveIssues && !b.hasActiveIssues) return -1;
        if (!a.hasActiveIssues && b.hasActiveIssues) return 1;
        return 0;
      });

      res.json(sortedStudents);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  deletePayment: async (req, res) => {
    try {
      const { id, paymentId } = req.params;
      const student = await Student.findById(id);
      if (!student) return res.status(404).json({ message: "Student not found" });

      // Find payment index
      const paymentIdx = student.paymentHistory.findIndex(p => p._id.toString() === paymentId);
      if (paymentIdx === -1) return res.status(404).json({ message: "Payment not found" });

      const amount = student.paymentHistory[paymentIdx].amount;
      // Remove payment from history
      student.paymentHistory.splice(paymentIdx, 1);

      // DON'T add amount back to totalFees - totalFees should never change
      // Only update installments

      // Add amount back to installments (reverse, up to originalInstallments limits, distribute across all)
      let amtLeft = amount;
      if (student.originalInstallments && student.originalInstallments.length === student.installments.length) {
        for (let i = student.installments.length - 1; i >= 0 && amtLeft > 0; i--) {
          const maxAllowed = student.originalInstallments[i].amount;
          const current = student.installments[i].amount;
          const canAdd = maxAllowed - current;
          if (canAdd > 0) {
            const toAdd = Math.min(canAdd, amtLeft);
            student.installments[i].amount += toAdd;
            amtLeft -= toAdd;
          }
        }
        // After distributing, update paid/unpaid status for all installments
        for (let i = 0; i < student.installments.length; i++) {
          if (student.installments[i].amount === 0) {
            student.installments[i].paid = true;
          } else {
            student.installments[i].paid = false;
          }
        }
      } else {
        // fallback: add to last installment
        student.installments[student.installments.length - 1].amount += amtLeft;
        student.installments[student.installments.length - 1].paid = false;
      }

      // Update totalDue after deleting payment
      const currentTotalPaid = student.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
      student.totalDue = student.totalFees - currentTotalPaid;

      await student.save();
      // Fetch updated student with populated selectedCourses
      const updatedStudent = await Student.findById(id).populate('selectedCourses');
      res.json(updatedStudent);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  updateIssueStatus: async (req, res) => {
    try {
      const { issueId } = req.params;
      const { status } = req.body;

      if (!['in-progress', 'solved'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const issue = await Issue.findByIdAndUpdate(
        issueId,
        { status },
        { new: true }
      );

      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }

      res.json(issue);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  updateChequeStatus: async (req, res) => {
    try {
      const { id, paymentId } = req.params;
      const { status } = req.body;
      if (!['Pending', 'Cleared', 'Bounced'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      const student = await Student.findById(id);
      if (!student) return res.status(404).json({ message: 'Student not found' });
      const payment = student.paymentHistory.id(paymentId);
      if (!payment) return res.status(404).json({ message: 'Payment not found' });
      if (!payment.chequeDetails) return res.status(400).json({ message: 'Not a cheque payment' });
      payment.chequeDetails.status = status;
      await student.save();
      res.json({ message: 'Cheque status updated', payment });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  // Get Ex-Students by Year
  getExStudentsByYear: async (req, res) => {
    try {
      const { year } = req.query;
      if (!year) {
        return res.status(400).json({ message: 'Year is required' });
      }
      const exStudents = await Student.find({
        status: 'ex-student',
        completedYear: Number(year)
      }).populate('selectedCourses');
      res.json(exStudents);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  // Export Ex-Students to Excel (selected fields)
  exportExStudentsToExcel: async (req, res) => {
    try {
      const { year, fields } = req.body;
      if (!year || !fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ message: 'Year and fields are required' });
      }
      const exStudents = await Student.find({
        status: 'ex-student',
        completedYear: Number(year)
      }).populate('selectedCourses');
      // Excel workbook/worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Ex-Students');
      // Header row
      worksheet.addRow(fields);
      
      // Set column widths based on content (including headers)
      const columnWidths = fields.map(field => Math.max(String(field).length + 2, 10)); // minimum width
      // Data rows
      exStudents.forEach(stu => {
        const row = fields.map((f, index) => {
          let cellValue = '';
          if (f === 'course') {
            if (stu.selectedCourses && stu.selectedCourses.length > 0) {
              // Multiple courses ko comma-separated string banao
              cellValue = stu.selectedCourses.map(course => course.name).join(', ');
            }
          } else if (f === 'dob') {
            cellValue = stu.dob ? new Date(stu.dob).toLocaleDateString() : '';
          } else {
            cellValue = stu[f] !== undefined ? String(stu[f]) : '';
          }
          
          // Track maximum column width
          const cellLength = String(cellValue).length;
          if (cellLength > columnWidths[index]) {
            columnWidths[index] = Math.min(cellLength + 2, 50); // max width 50, +2 for padding
          }
          
          return cellValue;
        });
        worksheet.addRow(row);
      });
      
      // Apply column widths
      worksheet.columns.forEach((column, index) => {
        column.width = columnWidths[index];
      });
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=ex-students-${year}.xlsx`);
      // Stream Excel file
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  // Export Active Students to Excel (selected fields)
  exportStudentsToExcel: async (req, res) => {
    try {
      const { fields } = req.body;
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ message: 'Fields are required' });
      }
      const students = await Student.find({
        status: 'active'
      }).populate('selectedCourses');
      // Excel workbook/worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Active Students');
      // Header row
      worksheet.addRow(fields);
      
      // Set column widths based on content (including headers)
      const columnWidths = fields.map(field => Math.max(String(field).length + 2, 10)); // minimum width
      
      // Data rows
      students.forEach(stu => {
        const row = fields.map((f, index) => {
          let cellValue = '';
          if (f === 'course') {
            if (stu.selectedCourses && stu.selectedCourses.length > 0) {
              // Multiple courses ko comma-separated string banao
              cellValue = stu.selectedCourses.map(course => course.name).join(', ');
            }
          } else if (f === 'dob') {
            cellValue = stu.dob ? new Date(stu.dob).toLocaleDateString() : '';
          } else if (f === 'totalDue') {
            if (!stu.installments) {
              cellValue = '0';
            } else {
              const totalDue = stu.installments.reduce((total, installment) => {
                return total + (installment.paid ? 0 : installment.amount);
              }, 0);
              cellValue = String(totalDue);
            }
          } else {
            cellValue = stu[f] !== undefined ? String(stu[f]) : '';
          }
          
          // Track maximum column width
          const cellLength = String(cellValue).length;
          if (cellLength > columnWidths[index]) {
            columnWidths[index] = Math.min(cellLength + 2, 50); // max width 50, +2 for padding
          }
          
          return cellValue;
        });
        worksheet.addRow(row);
      });
      
      // Apply column widths
      worksheet.columns.forEach((column, index) => {
        column.width = columnWidths[index];
      });
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=active-students-${new Date().toISOString().split('T')[0]}.xlsx`);
      // Stream Excel file
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  // Export Filtered Students to Excel (specific student IDs)
  exportFilteredStudentsToExcel: async (req, res) => {
    try {
      const { fields, studentIds } = req.body;
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ message: 'Fields are required' });
      }
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: 'Student IDs are required' });
      }
      
      const students = await Student.find({
        _id: { $in: studentIds },
        status: 'active'
      }).populate('selectedCourses');
      
      // Excel workbook/worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Filtered Students');
      // Header row
      worksheet.addRow(fields);
      
      // Set column widths based on content (including headers)
      const columnWidths = fields.map(field => Math.max(String(field).length + 2, 10)); // minimum width
      
      // Data rows
      students.forEach(stu => {
        const row = fields.map((f, index) => {
          let cellValue = '';
          if (f === 'course') {
            if (stu.selectedCourses && stu.selectedCourses.length > 0) {
              // Multiple courses ko comma-separated string banao
              cellValue = stu.selectedCourses.map(course => course.name).join(', ');
            }
          } else if (f === 'dob') {
            cellValue = stu.dob ? new Date(stu.dob).toLocaleDateString() : '';
          } else if (f === 'totalDue') {
            if (!stu.installments) {
              cellValue = '0';
            } else {
              const totalDue = stu.installments.reduce((total, installment) => {
                return total + (installment.paid ? 0 : installment.amount);
              }, 0);
              cellValue = String(totalDue);
            }
          } else {
            cellValue = stu[f] !== undefined ? String(stu[f]) : '';
          }
          
          // Track maximum column width
          const cellLength = String(cellValue).length;
          if (cellLength > columnWidths[index]) {
            columnWidths[index] = Math.min(cellLength + 2, 50); // max width 50, +2 for padding
          }
          
          return cellValue;
        });
        worksheet.addRow(row);
      });
      
      // Apply column widths
      worksheet.columns.forEach((column, index) => {
        column.width = columnWidths[index];
      });
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=filtered-students-${new Date().toISOString().split('T')[0]}.xlsx`);
      // Stream Excel file
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  // Get unique years for ex-students
  getExStudentYears: async (req, res) => {
    try {
      const years = await Student.distinct('completedYear', { status: 'ex-student', completedYear: { $ne: null } });
      years.sort((a, b) => b - a); // descending order
      res.json(years);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  // Get student fee details for edit form
  getStudentFeeDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const student = await Student.findById(id).populate('selectedCourses');
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Calculate fee details
      const totalPrice = student.selectedCourses.reduce((sum, course) => sum + (course.fees || 0), 0);
      const discountAmount = totalPrice * (student.discount || 0) / 100;
      const discountedPrice = totalPrice - discountAmount;
      const totalPaid = student.paymentHistory ? 
        student.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0) : 0;
      const finalAmount = discountedPrice - totalPaid;

      const feeDetails = {
        totalPrice,
        discount: student.discount || 0,
        discountAmount,
        discountedPrice,
        totalPaid,
        finalAmount,
        paymentHistory: student.paymentHistory || []
      };

      res.json(feeDetails);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Send automatic birthday wishes to students
  sendBirthdayWishes: async (req, res) => {
    try {
      console.log('🎂 Starting automatic birthday wishes...');
      
      // Get today's birthday students
      const today = new Date();
      const month = today.getMonth() + 1; // 0-based to 1-based
      const day = today.getDate();
      
      const birthdayStudents = await Student.find({
        $expr: {
          $and: [
            { $eq: [{ $month: { $dateFromString: { dateString: '$dob' } } }, month] },
            { $eq: [{ $dayOfMonth: { $dateFromString: { dateString: '$dob' } } }, day] }
          ]
        },
        enquiryType: 'Admission', // Only Admission students
        status: { $ne: 'ex-student' } // Exclude ex-students
      });

      if (birthdayStudents.length === 0) {
        return res.json({
          success: true,
          message: 'No birthday students found today',
          sentCount: 0,
          results: []
        });
      }

      // Use auto message scheduler for birthday wishes
      const birthdayWishService = (await import('../services/messages/birthdayWishService.js')).default;
      
      const results = [];
      let sentCount = 0;

      for (const student of birthdayStudents) {
        try {
          // Generate birthday wish message
          const message = generateBirthdayWish(student.name);
          
          // Format phone number with +91 prefix
          let phoneNumber = student.contactNo.replace(/\D/g, ''); // Remove non-digits
          
          // Remove +91 if already present
          if (phoneNumber.startsWith('91')) {
            phoneNumber = phoneNumber.substring(2);
          }
          
          // Add +91 prefix
          phoneNumber = `+91${phoneNumber}`;
          
          // Use birthday wish service instead of direct WhatsApp
          const result = await birthdayWishService.sendSingleBirthdayWish(student, message);
          
          if (result.success) {
            results.push({
              studentId: student._id,
              studentName: student.name,
              contactNo: phoneNumber,
              status: 'sent',
              timestamp: new Date().toISOString()
            });
            sentCount++;
          } else {
            results.push({
              studentId: student._id,
              studentName: student.name,
              contactNo: student.contactNo,
              status: 'failed',
              error: result.error,
              timestamp: new Date().toISOString()
            });
          }
          
          // Add delay between messages (5 seconds)
          await new Promise(resolve => setTimeout(resolve, 5000));
          
        } catch (error) {
          console.error(`❌ Error sending birthday wish to student:`, error);
          results.push({
            studentId: student._id,
            studentName: student.name,
            contactNo: student.contactNo,
            status: 'failed',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      res.json({
        success: true,
        message: `Birthday wishes sent to ${sentCount} students`,
        sentCount,
        totalStudents: birthdayStudents.length,
        results
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending birthday wishes',
        error: error.message
      });
    }
  }
};

// Helper function to generate birthday wish messages
function generateBirthdayWish(studentName) {
  const templates = [
    // Template 1: Joyful and Energetic
    `🎉 Happy Birthday ${studentName}! 🎂

Wishing you a day filled with endless joy, laughter, and amazing surprises! 

May this new year of your life bring you:
✨ Incredible adventures
🌟 Boundless happiness  
📚 Academic excellence
🎯 All your dreams come true

You're such an amazing student and we're so proud of you! Keep shining bright! 🌟

Have a fantastic celebration! 🎈🎊

Best wishes,
TCIT Team 💝`,

    // Template 2: Motivational and Inspiring
    `🎂 Happy Birthday ${studentName}! 🎉

On this special day, we want to celebrate YOU!

Your dedication to learning, your positive attitude, and your incredible spirit make you truly special. 

May this birthday mark the beginning of:
🚀 New achievements
💫 Greater success
🎓 Academic brilliance
🌟 Personal growth

Remember, you have the power to achieve anything you set your mind to! 

Wishing you a year filled with success and happiness! ✨

With love,
TCIT Team 🌟`,

    // Template 3: Warm and Caring
    `🎈 Happy Birthday ${studentName}! 🎂

Today is all about celebrating the wonderful person you are!

We're so grateful to have you as part of our TCIT family. Your enthusiasm for learning and your kind heart brighten our days.

May your birthday be filled with:
💝 Love and warmth
🎁 Wonderful surprises
😊 Beautiful memories
🌟 Magical moments

You deserve all the happiness in the world! 

Enjoy your special day to the fullest! 🎊

Warmest wishes,
TCIT Team 💕`,

    // Template 4: Fun and Playful
    `🎊 Happy Birthday ${studentName}! 🎉

It's your special day! Time to party! 🎈

You're not just another year older, you're another year AWESOMER! 

May your birthday be filled with:
🎂 Delicious cake
🎁 Amazing gifts
😄 Endless laughter
🌟 Pure magic

You're a superstar student and we're lucky to have you! 

Go out there and make this the best birthday ever! ✨

Cheers to you,
TCIT Team 🎉`,

    // Template 5: Encouraging and Supportive
    `🎂 Happy Birthday ${studentName}! 🎉

Another year, another opportunity to shine! 

Your journey with us has been incredible, and we can't wait to see all the amazing things you'll accomplish this year.

May this birthday bring you:
📚 Knowledge and wisdom
🎯 Goals and achievements
💪 Strength and courage
🌟 Success and prosperity

You have so much potential, and we believe in you completely!

Here's to an amazing year ahead! 🚀

Best regards,
TCIT Team 🌟`
  ];

  // Random selection for variety
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

export default studentController; 