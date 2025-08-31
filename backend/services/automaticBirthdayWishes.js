import cron from 'node-cron';
import Student from '../Model/Student.js';
import BirthdayWish from '../Model/BirthdayWish.js';

// Function to check WhatsApp connection status
async function checkWhatsAppConnection() {
  try {
    const whatsappConnectionService = (await import('./whatsapp/core/connectionService.js')).default;
    const whatsappMessageService = (await import('./whatsapp/core/messageService.js')).default;
    
    console.log('🔍 Checking WhatsApp connection status...');
    console.log('📱 Client ready:', whatsappConnectionService.isReady);
    console.log('📱 Client instance:', !!whatsappConnectionService.getClient());
    console.log('📱 Is ready flag:', whatsappConnectionService.isReady);
    
    const client = whatsappConnectionService.getClient();
    
    if (!whatsappConnectionService.isReady) {
      return {
        connected: false,
        message: 'WhatsApp client is not ready',
        details: {
          isClientReady: whatsappConnectionService.isReady,
          hasClient: !!client,
          isReady: whatsappConnectionService.isReady
        }
      };
    }
    
    if (!client) {
      return {
        connected: false,
        message: 'WhatsApp client instance not found',
        details: {
          isClientReady: whatsappConnectionService.isReady,
          hasClient: false,
          isReady: whatsappConnectionService.isReady
        }
      };
    }
    
    if (!client.info || !client.info.wid) {
      return {
        connected: false,
        message: 'WhatsApp client not fully initialized',
        details: {
          isClientReady: whatsappConnectionService.isReady,
          hasClient: true,
          hasInfo: !!client.info,
          hasWid: !!(client.info && client.info.wid)
        }
      };
    }
    
    return {
      connected: true,
      message: 'WhatsApp is connected and ready',
      details: {
        isClientReady: whatsappConnectionService.isReady,
        hasClient: true,
        hasInfo: true,
        hasWid: true,
        wid: client.info.wid
      }
    };
    
  } catch (error) {
    return {
      connected: false,
      message: 'Error checking WhatsApp connection',
      error: error.message,
      details: {
        error: true
      }
    };
  }
}

// Helper function to validate and format phone number
function validateAndFormatPhone(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Remove all non-digits
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid Indian mobile number
  if (cleaned.length === 10) {
    // 10 digits - add 91 prefix
    return '91' + cleaned;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    // 12 digits with 91 prefix - valid
    return cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // 11 digits starting with 0 - remove 0 and add 91
    return '91' + cleaned.substring(1);
  }
  
  return null; // Invalid format
}

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

// Function to send automatic birthday wishes
async function sendAutomaticBirthdayWishes() {
  try {
    console.log('🎂 Starting automatic birthday wishes job...');
    
    // Import WhatsApp service first
     const whatsappConnectionService = (await import('./whatsapp/core/connectionService.js')).default;
     const whatsappMessageService = (await import('./whatsapp/core/messageService.js')).default;
     
           // Check if WhatsApp is ready with more detailed logging
      console.log('🔍 Checking WhatsApp client status...');
      console.log('📱 Client ready:', whatsappConnectionService.isReady);
      console.log('📱 Client instance:', !!whatsappConnectionService.getClient());
      console.log('📱 Is ready flag:', whatsappConnectionService.isReady);
      
      // Check if WhatsApp is truly ready
      const isTrulyReady = whatsappConnectionService.isReady;
      console.log('📱 Is truly ready:', isTrulyReady);
      
      if (!isTrulyReady || !whatsappConnectionService.isReady) {
        console.log('❌ WhatsApp is not connected, but will log birthday wishes for manual sending');
        console.log('💡 Please connect WhatsApp via the admin panel to send messages automatically');
        
        // Continue with logging but don't send messages
        console.log('📝 Proceeding with birthday wish logging only...');
      } else {
        console.log('✅ WhatsApp is ready, proceeding with birthday wishes...');
      }
    
    // Get current date
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    const day = now.getDate();
    
    console.log(`📅 Checking for birthdays on ${month}/${day}...`);
    
    // Find students with birthdays today
    const allBirthdayStudents = await Student.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$dob' }, month] },
          { $eq: [{ $dayOfMonth: '$dob' }, day] }
        ]
      },
      enquiryType: 'Admission',
      status: { $ne: 'ex-student' }
    }).select('name studentId contactNo phone dob enquiryType status');
    
    console.log(`🎂 Found ${allBirthdayStudents.length} students with birthdays today`);
    
    if (allBirthdayStudents.length === 0) {
      console.log('✅ No birthday students found for today');
        return;
      }
      
    // Check which students already received wishes today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const alreadyWishedStudents = await BirthdayWish.find({
      studentId: { $in: allBirthdayStudents.map(s => s._id) },
      sentAt: { $gte: today }
    });
    
    const alreadyWishedIds = alreadyWishedStudents.map(w => w.studentId.toString());
    const birthdayStudents = allBirthdayStudents.filter(s => !alreadyWishedIds.includes(s._id.toString()));
    
    console.log(`🎂 ${birthdayStudents.length} students need birthday wishes (${alreadyWishedStudents.length} already received)`);
    
    if (birthdayStudents.length === 0) {
      console.log('✅ All birthday students already received wishes today');
        return;
      }

    // Initialize counters for logging
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    
    console.log(`🚀 Starting to send birthday wishes to ${birthdayStudents.length} students...`);
    
    // Send birthday wishes to each student
    for (const student of birthdayStudents) {
      try {
        // Check if student has phone number (try contactNo first, then phone)
        const studentPhone = student.contactNo || student.phone;
        const formattedPhone = validateAndFormatPhone(studentPhone);
        
        if (!formattedPhone) {
          console.log(`⚠️  Student ${student.studentId} skipped - no valid phone number (contactNo: ${student.contactNo}, phone: ${student.phone})`);
          skippedCount++;
          continue;
        }
        
        const phoneNumber = formattedPhone;
        
        // Create birthday message
        const birthdayMessage = `🎉 Happy Birthday ${student.name}! 🎂

Wishing you a fantastic day filled with joy, success, and wonderful moments! 

May this year bring you:
✨ Amazing opportunities
📚 Great learning experiences  
🎯 Success in all your goals
💫 Lots of happiness and laughter

Have a wonderful birthday! 🎊

Best wishes,
TCIT Team 💝`;
        
        // Check if WhatsApp is ready before sending
        const canSendMessage = whatsappConnectionService.isReady;
        
        if (canSendMessage) {
          // Send message via WhatsApp
          await whatsappMessageService.sendMessage(phoneNumber, birthdayMessage);
          console.log(`✅ Birthday wish sent successfully to ${student.studentId}`);
          successCount++;
        } else {
          console.log(`📝 Birthday wish logged for ${student.studentId} (WhatsApp not ready for sending)`);
          skippedCount++;
        }
        
        // Save to database (always save, regardless of sending status)
        const birthdayWish = new BirthdayWish({
             studentId: student._id,
             studentName: student.name,
          studentPhone: studentPhone,
          message: birthdayMessage,
          sentAt: new Date(),
          status: canSendMessage ? 'sent' : 'logged'
        });
        await birthdayWish.save();
        
        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to send birthday wish to student ${student.studentId}:`, error.message);
        failureCount++;
           
           // Save failed attempt to database
           try {
          const failedWish = new BirthdayWish({
               studentId: student._id,
               studentName: student.name,
            studentPhone: studentPhone,
            message: 'Birthday wish failed to send',
            sentAt: new Date(),
               status: 'failed',
            error: error.message
             });
          await failedWish.save();
           } catch (dbError) {
          console.error('Failed to save failed wish to database:', dbError.message);
        }
      }
    }
    
    // Log final summary
    console.log('\n📊 BIRTHDAY WISHES SUMMARY:');
    console.log(`📅 Date: ${now.toDateString()}`);
    console.log(`🎂 Total students with birthdays: ${allBirthdayStudents.length}`);
    console.log(`✅ Already received wishes: ${alreadyWishedStudents.length}`);
    console.log(`🚀 Attempted to send: ${birthdayStudents.length}`);
    console.log(`✅ Successfully sent: ${successCount}`);
    console.log(`❌ Failed to send: ${failureCount}`);
    console.log(`⚠️  Skipped (no phone): ${skippedCount}`);
    console.log(`📈 Success rate: ${birthdayStudents.length > 0 ? Math.round((successCount / birthdayStudents.length) * 100) : 0}%`);
    
         // Log to file for tracking
     const logEntry = {
       date: now.toISOString(),
       type: 'birthday_wishes',
       total_birthdays: allBirthdayStudents.length,
       already_received: alreadyWishedStudents.length,
       attempted: birthdayStudents.length,
       successful: successCount,
       failed: failureCount,
       skipped: skippedCount,
       success_rate: birthdayStudents.length > 0 ? Math.round((successCount / birthdayStudents.length) * 100) : 0
     };
     
     console.log('📝 Log entry:', JSON.stringify(logEntry, null, 2));
     
     // Save to log file
     try {
       const logger = (await import('../utils/logger.js')).default;
       logger.logBirthdayWishes(logEntry);
     } catch (logError) {
       console.error('Failed to save log:', logError.message);
       // Continue execution even if logging fails
    }
    
  } catch (error) {
    console.error('❌ Error in automatic birthday wishes:', error);
  }
}

// Initialize automatic birthday wishes
function initializeAutomaticBirthdayWishes() {
  console.log('🕐 Initializing automatic birthday wishes system...');
  
  // Schedule job to run every day at 11:00 AM IST
  // Cron format: '0 11 * * *' = minute hour day month day-of-week
  // Using UTC time: 11:00 AM IST = 5:30 AM UTC (IST is UTC+5:30)
  cron.schedule('30 5 * * *', async () => {
    console.log('⏰ 11:00 AM IST (5:30 AM UTC) - Running automatic birthday wishes...');
    await sendAutomaticBirthdayWishes();
  }, {
    scheduled: true,
    timezone: "UTC" // Use UTC timezone for consistent scheduling
  });
  
  console.log('✅ Automatic birthday wishes scheduled for 11:00 AM IST (5:30 AM UTC) daily');
  
  // Check if current time is between 11:00 AM IST and 11:30 AM IST for immediate run
  // Convert to IST: UTC + 5:30 hours
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5:30 hours for IST
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  
  // Only run immediately if it's between 11:00 AM IST and 11:30 AM IST
  if (currentHour === 11 && currentMinute >= 0 && currentMinute <= 30) {
    console.log('🕐 Current time is between 11:00 AM IST - 11:30 AM IST');
    console.log('🚀 Running birthday wishes immediately (with WhatsApp check)...');
    
    // Run birthday wishes immediately, don't wait for WhatsApp
    setTimeout(async () => {
      await sendAutomaticBirthdayWishes();
    }, 5000); // Wait 5 seconds then run
        // Note: Birthday wishes will run immediately after 5 seconds
    // WhatsApp check is handled inside sendAutomaticBirthdayWishes function
  } else {
    console.log('⏰ Current time is not between 11:00 AM IST - 11:30 AM IST, birthday wishes will run at scheduled time only');
  }
}

export default {
  initializeAutomaticBirthdayWishes,
  sendAutomaticBirthdayWishes,
  checkWhatsAppConnection
};
