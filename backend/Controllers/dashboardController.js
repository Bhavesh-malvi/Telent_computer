import Student from '../Model/Student.js';
import StudentCourse from '../Model/studentCourse.js';

const dashboardController = {
  // 1. Monthly Student Enrollments
  getMonthlyEnrollments: async (req, res) => {
    try {
      const { year, month } = req.query;
      
      // Build match stages
      const matchStages = [];
      
      // Base match for valid dates and admission students
      matchStages.push({
        $match: { 
          date: { $exists: true, $ne: null, $ne: "" },
          enquiryType: "Admission"
        }
      });
      
      // Add date parsing
      matchStages.push({
        $addFields: {
          admissionDateObj: {
            $dateFromString: {
              dateString: "$date",
              onError: null,
              onNull: null
            }
          }
        }
      });
      
      // Filter valid dates
      matchStages.push({
        $match: { admissionDateObj: { $ne: null } }
      });
      
      // Year filter
      if (year && year !== 'All') {
        matchStages.push({
          $match: {
            $expr: { $eq: [{ $year: "$admissionDateObj" }, parseInt(year)] }
          }
        });
      }
      
      // Month filter
      if (month && month !== 'All') {
        matchStages.push({
          $match: {
            $expr: { $eq: [{ $month: "$admissionDateObj" }, parseInt(month)] }
          }
        });
      }
      
      // Using date field (admission date) instead of inquiryDate
      const enrollments = await Student.aggregate([
        ...matchStages,
        {
          $group: {
            _id: {
              year: { $year: "$admissionDateObj" },
              month: { $month: "$admissionDateObj" }
            },
            newEnrollments: { $sum: 1 }
          }
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 }
        }
      ]);

      // Calculate cumulative total students for the filtered period only
      let cumulativeTotal = 0;
      const result = enrollments.map(item => {
        cumulativeTotal += item.newEnrollments;
        return {
          _id: item._id,
          newEnrollments: item.newEnrollments,
          totalStudents: cumulativeTotal
        };
      });

      // Get overall total students (all time) for the Total Students card
      const overallTotalStudents = await Student.countDocuments({ 
        enquiryType: "Admission"
      });



      // Add overall total to each result item for frontend use
      const resultWithOverallTotal = result.map(item => ({
        ...item,
        overallTotalStudents: overallTotalStudents
      }));


      res.json(resultWithOverallTotal);
    } catch (err) {
      console.error("Error in getMonthlyEnrollments:", err);
      res.status(500).json({ message: "Error fetching monthly enrollments", error: err.message });
    }
  },



  // 2. Course-wise Enrollment Demand
  getCourseDemand: async (req, res) => {
    try {
      const { year, month } = req.query;
      const matchStages = [];
      // AddFields to parse admission date
      matchStages.push({
        $addFields: {
          admissionDateObj: {
            $dateFromString: {
              dateString: "$date",
              onError: null,
              onNull: null
            }
          }
        }
      });
      // Year filter
      if (year && year !== 'All') {
        matchStages.push({ $match: { "admissionDateObj": { $ne: null }, $expr: { $eq: [ { $year: "$admissionDateObj" }, parseInt(year) ] } } });
      }
      // Month filter
      if (month && month !== 'All') {
        matchStages.push({ $match: { $expr: { $eq: [ { $month: "$admissionDateObj" }, parseInt(month) ] } } });
      }
      // Remove null dates and filter for Admission students only
      matchStages.push({ 
        $match: { 
          admissionDateObj: { $ne: null },
          enquiryType: "Admission" // Only show Admission students, not Enquiry
        } 
      });
      const courseDemand = await Student.aggregate([
        ...matchStages,
        { $unwind: "$selectedCourses" },
        {
          $lookup: {
            from: "studentcourses",
            localField: "selectedCourses",
            foreignField: "_id",
            as: "courseDetails"
          }
        },
        { $unwind: "$courseDetails" },
        // Normalize course names to avoid duplicates due to case/spacing differences
        {
          $addFields: {
            normalizedCourseName: {
              $toLower: {
                $trim: { input: "$courseDetails.name" }
              }
            },
            nameLen: { $strLenCP: "$courseDetails.name" }
          }
        },
        // Sort by name length so we can pick the longest, most descriptive display name
        { $sort: { nameLen: -1 } },
        {
          $group: {
            _id: {
              courseNameNorm: "$normalizedCourseName",
              year: { $year: "$admissionDateObj" },
              month: { $month: "$admissionDateObj" }
            },
            count: { $sum: 1 },
            displayName: { $first: "$courseDetails.name" }
          }
        },
        // Additional grouping to merge similar course names across months
        {
          $group: {
            _id: {
              courseNameNorm: "$_id.courseNameNorm",
              year: "$_id.year"
            },
            totalCount: { $sum: "$count" },
            displayName: { $first: "$displayName" },
            months: { $push: { month: "$_id.month", count: "$count" } }
          }
        },
        {
          $project: {
            _id: 0,
            courseName: "$displayName",
            year: "$_id.year",
            count: "$totalCount"
          }
        },
        { $sort: { count: -1 } }
      ]);



      res.json(courseDemand);
    } catch (err) {
      console.error('Error in getCourseDemand:', err);
      res.status(500).json({ message: "Error fetching course demand", error: err.message });
    }
  },

  // 3. Monthly Fee Revenue
  getMonthlyFeeRevenue: async (req, res) => {
    try {
      const revenue = await Student.aggregate([
        {
          $match: {
            enquiryType: "Admission" // Only show Admission students, not Enquiry
          }
        },
        { $unwind: "$paymentHistory" },
        {
          $addFields: {
            paymentDateObj: {
              $dateFromString: {
                dateString: "$paymentHistory.date",
                onError: "$paymentHistory.date",
                onNull: "$paymentHistory.date"
              }
            }
          }
        },
        {
          $match: {
            paymentDateObj: { $ne: null }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$paymentDateObj" },
              month: { $month: "$paymentDateObj" }
            },
            totalAmount: { $sum: "$paymentHistory.amount" },
            students: { $addToSet: "_id" }
          }
        },
        {
          $addFields: {
            studentsCount: { $size: "$students" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);

      res.json(revenue);
    } catch (err) {
      res.status(500).json({ message: "Error fetching monthly fee revenue", error: err.message });
    }
  },

  // 4. Today's Payments
  getTodaysPayments: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const payments = await Student.aggregate([
        {
          $match: {
            enquiryType: "Admission" // Only show Admission students, not Enquiry
          }
        },
        { $unwind: "$paymentHistory" },
        {
          $match: {
            "paymentHistory.date": { $gte: today, $lt: tomorrow }
          }
        },
        {
          $lookup: {
            from: "studentcourses",
            localField: "selectedCourses",
            foreignField: "_id",
            as: "courses"
          }
        },
        {
          $project: {
            studentName: "$name",
            studentId: "$studentId",
            studentImage: "$image",
            amount: "$paymentHistory.amount",
            method: "$paymentHistory.method",
            courseNames: "$courses.name",
            courseLogos: "$courses.image"
          }
        }
      ]);
      res.json(payments);
    } catch (err) {
      res.status(500).json({ message: "Error fetching today's payments", error: err.message });
    }
  },

  // 5. Pending Installments (With Time Categorization)
  getPendingInstallments: async (req, res) => {
    try {
      const now = new Date();
      const in30Days = new Date(now);
      in30Days.setDate(now.getDate() + 30);
      const over60Days = new Date(now);
      over60Days.setDate(now.getDate() - 60);

      // First, update existing unpaid installments with dueDate if missing
      const studentsToUpdate = await Student.find({ 
        "installments.paid": false,
        "installments.dueDate": { $exists: false }
      });

      if (studentsToUpdate.length > 0) {
        // Simple approach: Update all unpaid installments without dueDate
        await Student.updateMany(
          { 
            "installments.paid": false,
            "installments.dueDate": { $exists: false }
          },
          { 
            $set: { "installments.$.dueDate": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } // 30 days ago
          }
        );
      }

      // Force refresh data after updates
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get students with unpaid installments (only Admission students, not Enquiry)
      const students = await Student.find({ 
        "installments.paid": false,
        "enquiryType": "Admission" // Only show Admission students, not Enquiry
      })
        .populate("selectedCourses", "name")
        .select("name selectedCourses installments paymentHistory date studentId enquiryType");

      // Update dueDate based on registration date for students with no payment history
      for (const student of students) {
        if (!student.paymentHistory || student.paymentHistory.length === 0) {
          if (student.date) {
            const registrationDate = new Date(student.date);
            const daysSinceRegistration = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
            
            // If registration is old (>30 days), set dueDate to registration date
            if (daysSinceRegistration > 30) {
              await Student.updateMany(
                { 
                  _id: student._id,
                  "installments.paid": false
                },
                { 
                  $set: { "installments.$.dueDate": registrationDate }
                }
              );
            }
          }
        }
      }

      const pending = [];
      students.forEach(student => {
        student.installments.forEach((inst, index) => {
          if (!inst.paid && inst.amount && inst.dueDate) {
            const dueDate = new Date(inst.dueDate);
            
            // Check if student has made recent payments
            let shouldInclude = true;
            
                        // Get reference date: last payment date OR admission date
            let referenceDate = null;
            
            if (student.paymentHistory && student.paymentHistory.length > 0) {
              // Get the most recent payment date (check both date and paymentDate fields)
              const recentPayments = student.paymentHistory
                .filter(payment => payment.date || payment.paymentDate)
                .sort((a, b) => {
                  const dateA = new Date(a.paymentDate || a.date);
                  const dateB = new Date(b.paymentDate || b.date);
                  return dateB - dateA;
                });
              
              if (recentPayments.length > 0) {
                referenceDate = new Date(recentPayments[0].paymentDate || recentPayments[0].date);
              }
            }
            
            // If no last payment date, use admission date
            if (!referenceDate && student.date) {
              referenceDate = new Date(student.date);
            }
            
            if (referenceDate) {
              const daysSinceReference = Math.floor((now - referenceDate) / (1000 * 60 * 60 * 24));
              
              // Exclude if less than 30 days since reference date
              if (daysSinceReference < 30) {
                shouldInclude = false;
              }
            }
            
            if (shouldInclude) {
              // Calculate status based on reference date (last payment OR admission date)
              const daysSinceReference = Math.floor((now - referenceDate) / (1000 * 60 * 60 * 24));
              const monthsSinceReference = Math.floor(daysSinceReference / 30);
              
              let status = null;
              if (daysSinceReference >= 60) {
                status = `Overdue ${monthsSinceReference}+ months`; // 🔴 Overdue 2+ months
              } else if (daysSinceReference >= 30) {
                status = `Due ${monthsSinceReference}+ months`; // 🟡 Due X+ months
              }

              if (status) {
                pending.push({
                  id: `${student._id}_${index}`,
                  studentName: student.name,
                  studentId: student.studentId,
                  studentImage: student.image, // Add student image
                  courseNames: student.selectedCourses.map(c => c.name),
                  amount: inst.amount,
                  dueDate: inst.dueDate,
                  status: status,
                  daysPastDue: daysSinceReference > 0 ? daysSinceReference : 0,
                  monthsPastDue: monthsSinceReference > 0 ? monthsSinceReference : 0
                });
              }
            }
          }
        });
      });

      res.json(pending);
    } catch (err) {
      res.status(500).json({ message: "Error fetching pending installments", error: err.message });
    }
  },

  // 6. Get Available Filter Options
  getAvailableFilters: async (req, res) => {
    try {
      // Get available years from student enrollments
      const enrollmentYears = await Student.aggregate([
        {
          $match: {
            date: { $exists: true, $ne: null, $ne: "" },
            enquiryType: "Admission"
          }
        },
        {
          $addFields: {
            admissionDateObj: {
              $dateFromString: {
                dateString: "$date",
                onError: null,
                onNull: null
              }
            }
          }
        },
        {
          $match: {
            admissionDateObj: { $ne: null }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$admissionDateObj" }
            }
          }
        },
        {
          $sort: { "_id.year": -1 }
        }
      ]);

      // Get available months from student enrollments
      const enrollmentMonths = await Student.aggregate([
        {
          $match: {
            date: { $exists: true, $ne: null, $ne: "" },
            enquiryType: "Admission"
          }
        },
        {
          $addFields: {
            admissionDateObj: {
              $dateFromString: {
                dateString: "$date",
                onError: null,
                onNull: null
              }
            }
          }
        },
        {
          $match: {
            admissionDateObj: { $ne: null }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$admissionDateObj" },
              month: { $month: "$admissionDateObj" }
            }
          }
        },
        {
          $sort: { "_id.year": -1, "_id.month": -1 }
        }
      ]);

      // Get available years from fee revenue
      const revenueYears = await Student.aggregate([
        {
          $unwind: "$paymentHistory"
        },
        {
          $addFields: {
            paymentDateObj: {
              $dateFromString: {
                dateString: "$paymentHistory.date",
                onError: null,
                onNull: null
              }
            }
          }
        },
        {
          $match: {
            paymentDateObj: { $ne: null }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$paymentDateObj" }
            }
          }
        },
        {
          $sort: { "_id.year": -1 }
        }
      ]);

      // Combine and deduplicate years
      const allYears = [...new Set([
        ...enrollmentYears.map(item => item._id.year),
        ...revenueYears.map(item => item._id.year)
      ])].sort((a, b) => b - a);

      // Create months array with names
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const availableMonths = enrollmentMonths.map(item => ({
        value: item._id.month,
        label: monthNames[item._id.month - 1],
        year: item._id.year
      }));


      
      res.json({
        years: allYears,
        months: availableMonths,
        currentYear: new Date().getFullYear()
      });
    } catch (err) {
      console.error('Error in getAvailableFilters:', err);
      res.status(500).json({ message: "Error fetching available filters", error: err.message });
    }
  },
};

export default dashboardController;