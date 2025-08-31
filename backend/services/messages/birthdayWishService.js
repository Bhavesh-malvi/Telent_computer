import whatsappMessageService from '../whatsapp/core/messageService.js';
import Student from '../../Model/Student.js';
import BirthdayWish from '../../Model/BirthdayWish.js';

class BirthdayWishService {
  constructor() {
    this.messageService = whatsappMessageService;
  }

  // Get students with birthdays today using proper date comparison
  async getStudentsWithBirthdaysToday() {
    try {
      console.log('🎂 Fetching students with birthdays today...');
      
      const today = new Date();
      const todayMonth = today.getMonth() + 1; // getMonth() returns 0-11
      const todayDate = today.getDate();
      
      console.log(`🎂 Today's date: ${todayDate}/${todayMonth}`);
      
      // Find students with birthdays today using MongoDB aggregation
      const students = await Student.aggregate([
        {
          $match: {
            "contactNo": { $exists: true, $ne: null, $ne: "" },
            "enquiryType": "Admission",
            "dob": { $exists: true, $ne: null }
          }
        },
        {
          $addFields: {
            birthMonth: { $month: "$dob" },
            birthDay: { $dayOfMonth: "$dob" }
          }
        },
        {
          $match: {
            birthMonth: todayMonth,
            birthDay: todayDate
          }
        },
        {
          $lookup: {
            from: "courses", // Assuming courses collection name
            localField: "selectedCourses",
            foreignField: "_id",
            as: "selectedCourses"
          }
        },
        {
          $project: {
            name: 1,
            dob: 1,
            selectedCourses: 1,
            studentId: 1,
            contactNo: 1,
            enquiryType: 1,
            birthMonth: 1,
            birthDay: 1
          }
        }
      ]);

      console.log(`🎂 Found ${students.length} students with birthdays today`);
      
      // Log birthday students count only
      console.log(`🎂 Found ${students.length} students with birthdays today`);

      return students;

    } catch (error) {
      console.error('❌ Error fetching students with birthdays:', error);
      throw error;
    }
  }

  // Alternative method using find with date comparison
  async getStudentsWithBirthdaysTodayAlternative() {
    try {
      console.log('🎂 Fetching students with birthdays today (alternative method)...');
      
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDate = today.getDate();
      
      // Find students with birthdays today
      const students = await Student.find({
        "contactNo": { $exists: true, $ne: null, $ne: "" },
        "enquiryType": "Admission",
        "dob": { $exists: true, $ne: null }
      })
      .populate("selectedCourses", "name")
      .select("name dob selectedCourses studentId contactNo enquiryType");

      console.log(`🎂 Found ${students.length} students with contact numbers`);

      // Filter students with birthdays today
      const birthdayStudents = students.filter(student => {
        if (!student.dob) return false;
        
        const birthDate = new Date(student.dob);
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();
        
        return birthMonth === todayMonth && birthDay === todayDate;
      });

      console.log(`🎂 Filtered ${birthdayStudents.length} students with birthdays today`);
      
      // Log birthday students count only
      console.log(`🎂 Filtered ${birthdayStudents.length} students with birthdays today`);

      return birthdayStudents;

    } catch (error) {
      console.error('❌ Error fetching students with birthdays (alternative):', error);
      throw error;
    }
  }

  // Create birthday wish message
  createBirthdayMessage(student) {
    const courseNames = student.selectedCourses?.map(c => c.name)?.join(', ') || 'Course';
    
    const templates = [
      `🎉 HAPPY BIRTHDAY! 🎉

Dear ${student.name},

Wishing you a fantastic birthday filled with joy, success, and wonderful moments! 🎂✨

May this special day bring you:
🌟 Happiness and laughter
📚 Success in your studies
🚀 Achievement of your goals
💫 All your dreams coming true

We're proud to have you as part of our TCIT family! 

📚 Course: ${courseNames}

Have a wonderful birthday celebration! 🎊

Best wishes,
TCIT Team`,

      `🎂 HAPPY BIRTHDAY! 🎂

Hello ${student.name}! 👋

Happy Birthday! 🎉 May your special day be filled with:
✨ Joy and happiness
📖 Learning and growth
🎯 Success in your goals
💝 Wonderful memories

You're doing amazing in your studies! Keep up the great work! 📚

📚 Course: ${courseNames}

Enjoy your birthday to the fullest! 🎊

Best regards,
TCIT Team`,

      `🎊 HAPPY BIRTHDAY! 🎊

Dear ${student.name},

Happy Birthday! 🎂✨

On this special day, we want to celebrate you and your dedication to learning! 

📚 Course: ${courseNames}

May your birthday be:
🌟 Filled with joy and laughter
📚 Successful in your studies
🎯 Productive and meaningful
💫 Memorable and special

We're excited to see your continued progress! 🚀

Have a wonderful birthday! 🎉

Best wishes,
TCIT Team`
    ];

    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  // Send birthday wishes
  async sendBirthdayWishes() {
    try {
      console.log('🎂 Starting birthday wish service...');
      
      if (!this.messageService.isReady()) {
        throw new Error('WhatsApp message service is not ready');
      }

      // Try aggregation method first, fallback to alternative
      let birthdayStudents = [];
      try {
        birthdayStudents = await this.getStudentsWithBirthdaysToday();
      } catch (error) {
        console.log('⚠️ Aggregation method failed, trying alternative...');
        birthdayStudents = await this.getStudentsWithBirthdaysTodayAlternative();
      }
      
      if (birthdayStudents.length === 0) {
        console.log('ℹ️ No students have birthdays today');
        return {
          success: true,
          message: 'No students have birthdays today',
          results: []
        };
      }

      console.log(`🎂 Sending birthday wishes to ${birthdayStudents.length} students...`);

      const messages = [];
      const results = [];

      // Prepare messages
      for (const student of birthdayStudents) {
        const message = this.createBirthdayMessage(student);
        messages.push({
          phoneNumber: student.contactNo,
          message: message,
          studentId: student.studentId,
          studentName: student.name
        });
      }

      // Send messages
      const sendResult = await this.messageService.sendBulkMessages(messages, {
        delayBetweenMessages: 2000, // 2 seconds delay
        maxRetries: 3
      });

      // Process results and save to database
      for (let i = 0; i < birthdayStudents.length; i++) {
        const student = birthdayStudents[i];
        const messageResult = sendResult.results[i];
        
                 // Save birthday wish record to database
         try {
           await BirthdayWish.create({
             studentId: student._id,
             studentName: student.name,
             contactNo: student.contactNo,
             wishDate: new Date(),
             status: messageResult.success ? 'sent' : 'failed',
             message: messages[i].message
           });
           console.log(`✅ Birthday wish record saved for student ${i + 1}`);
         } catch (error) {
           console.error(`❌ Failed to save birthday wish record for student ${i + 1}:`, error.message);
         }
        
        results.push({
          studentId: student.studentId,
          studentName: student.name,
          contactNo: student.contactNo,
          courseNames: student.selectedCourses?.map(c => c.name) || [],
          dateOfBirth: student.dateOfBirth,
          messageResult: messageResult
        });
      }

      const successCount = results.filter(r => r.messageResult.success).length;
      const failureCount = results.filter(r => !r.messageResult.success).length;

      console.log(`✅ Birthday wishes completed: ${successCount} sent, ${failureCount} failed`);

      return {
        success: true,
        message: `Birthday wishes sent to ${birthdayStudents.length} students`,
        totalStudents: birthdayStudents.length,
        successfulMessages: successCount,
        failedMessages: failureCount,
        results: results
      };

    } catch (error) {
      console.error('❌ Error sending birthday wishes:', error);
      throw error;
    }
  }

  // Send single birthday wish (for manual triggers)
  async sendSingleBirthdayWish(student, message) {
    try {
      console.log(`🎂 Sending single birthday wish to student`);
      
      if (!this.messageService.isReady()) {
        throw new Error('WhatsApp message service is not ready');
      }

      // Format phone number
      let phoneNumber = student.contactNo.replace(/\D/g, ''); // Remove non-digits
      
      // Remove +91 if already present
      if (phoneNumber.startsWith('91')) {
        phoneNumber = phoneNumber.substring(2);
      }
      
      // Add +91 prefix
      phoneNumber = `+91${phoneNumber}`;

      // Send message
      const result = await this.messageService.sendMessage(phoneNumber, message);
      
             // Save birthday wish record to database
       try {
         await BirthdayWish.create({
           studentId: student._id,
           studentName: student.name,
           contactNo: phoneNumber,
           wishDate: new Date(),
           status: result.success ? 'sent' : 'failed',
           message: message
         });
                   console.log(`✅ Birthday wish record saved for student`);
        } catch (error) {
          console.error(`❌ Failed to save birthday wish record for student:`, error.message);
       }
      
             if (result.success) {
         console.log(`✅ Birthday wish sent successfully to student`);
        return {
          success: true,
          studentId: student.studentId,
          studentName: student.name,
          contactNo: phoneNumber,
          status: 'sent',
          timestamp: new Date().toISOString()
        };
             } else {
         console.log(`⚠️ Birthday wish failed for student: ${result.error}`);
        return {
          success: false,
          studentId: student.studentId,
          studentName: student.name,
          contactNo: phoneNumber,
          status: 'failed',
          error: result.error,
          timestamp: new Date().toISOString()
        };
      }

         } catch (error) {
       console.error(`❌ Error sending birthday wish to student:`, error);
      return {
        success: false,
        studentId: student.studentId,
        studentName: student.name,
        contactNo: student.contactNo,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get service status
  getStatus() {
    return {
      serviceName: 'Birthday Wish Service',
      messageServiceReady: this.messageService.isReady(),
      lastRun: new Date().toISOString()
    };
  }
}

// Create singleton instance
const birthdayWishService = new BirthdayWishService();

export default birthdayWishService;
