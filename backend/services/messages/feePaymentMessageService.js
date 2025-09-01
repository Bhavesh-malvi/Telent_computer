import whatsappMessageService from '../whatsapp/core/messageService.js';
import Student from '../../Model/Student.js';

class FeePaymentMessageService {
  constructor() {
    this.messageService = whatsappMessageService;
  }

  // ✅ Safe message sending with number validation
  async safeSendMessage(contactNo, message, options = {}) {
    try {
      console.log(`🔍 Validating number: ${contactNo.replace(/(\d{4})(\d{4})(\d{3})/, '$1****$3')}`);
      
      const client = this.messageService.connectionService.getClient();
      if (!client) {
        throw new Error('WhatsApp client not available');
      }

      // Clean and format number
      let phone = contactNo.toString().replace(/\D/g, "");
      if (phone.length === 10) {
        phone = "91" + phone; // default India
      }

      // Validate number with WhatsApp
      const numberId = await client.getNumberId(phone);
      if (!numberId) {
        console.error(`❌ Number ${phone} is not registered on WhatsApp`);
        return { 
          success: false, 
          error: "Number is not registered on WhatsApp",
          phoneNumber: phone
        };
      }

      console.log(`✅ Number validated successfully`);
      
      // ✅ STRONG SOLUTION: Send message with extra safety
      try {
        const result = await this.messageService.sendMessage(contactNo, message, options);
        
        if (!result.success) {
          console.log(`⚠️ Message service failed, trying alternative approach...`);
          
          // Alternative: Try with delay
          await new Promise(resolve => setTimeout(resolve, 3000));
          const retryResult = await this.messageService.sendMessage(contactNo, message, options);
          return retryResult;
        }
        
        return result;
      } catch (error) {
        console.error(`❌ Error in safeSendMessage:`, error);
        return { 
          success: false, 
          error: error.message,
          phoneNumber: contactNo
        };
      }
      
    } catch (err) {
      console.error(`❌ Error in safeSendMessage:`, err);
      return { 
        success: false, 
        error: err.message,
        phoneNumber: contactNo
      };
    }
  }

  // Send fee payment confirmation
  async sendFeePaymentConfirmation(studentId, paymentData) {
    try {
      console.log(`💰 Sending fee payment confirmation for student`);
      
      if (!this.messageService.isReady()) {
        throw new Error('WhatsApp message service is not ready');
      }

      const student = await Student.findById(studentId)
        .populate("selectedCourses", "name")
        .select("name selectedCourses studentId contactNo enquiryType totalFees paymentHistory");

      if (!student) {
        throw new Error('Student not found');
      }

      if (!student.contactNo) {
        throw new Error('Student contact number not available');
      }

      if (student.enquiryType !== 'Admission') {
        throw new Error('Student is not an admission student');
      }

      const message = this.createPaymentMessage(student, paymentData);
      
      const result = await this.safeSendMessage(student.contactNo, message, {
        maxRetries: 3
      });

      // Update student's payment history if message sent successfully
      if (result.success) {
        await this.updateStudentPaymentHistory(studentId, paymentData);
      }

      return {
        success: result.success,
        message: result.success ? 'Fee payment confirmation sent successfully' : 'Failed to send fee payment confirmation',
        studentId: 'masked',
        contactNo: 'masked',
        paymentData: 'masked',
        result: 'masked'
      };

    } catch (error) {
      console.error('❌ Error sending fee payment confirmation:', error);
      throw error;
    }
  }

  // Send fee payment message (for studentController compatibility)
  async sendFeePaymentMessage(student, amount, paymentDetails = {}) {
    try {
              console.log(`💰 Sending fee payment confirmation message`);
      
      if (!this.messageService.isReady()) {
        throw new Error('WhatsApp message service is not ready');
      }

      if (!student.contactNo) {
        throw new Error('Student contact number not available');
      }

      if (student.enquiryType !== 'Admission') {
        throw new Error('Student is not an admission student');
      }

      // Create payment data object
      const paymentData = {
        amount: amount,
        paymentMethod: paymentDetails.method || 'Cash',
        collectedBy: paymentDetails.collectedBy || 'Admin',
        paymentDate: paymentDetails.paymentDate || new Date(),
        description: 'Fee payment'
      };

      const message = this.createPaymentMessage(student, paymentData);
      
      const result = await this.safeSendMessage(student.contactNo, message, {
        maxRetries: 3
      });

      return {
        success: result.success,
        message: result.success ? 'Fee payment message sent successfully' : 'Failed to send fee payment message',
        studentId: 'masked',
        contactNo: 'masked',
        amount: 'masked',
        result: 'masked'
      };

    } catch (error) {
      console.error('❌ Error sending fee payment message:', error);
      return {
        success: false,
        message: error.message,
        studentId: 'masked',
        contactNo: 'masked',
        amount: 'masked'
      };
    }
  }

  // Update student payment history
  async updateStudentPaymentHistory(studentId, paymentData) {
    try {
      const paymentRecord = {
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod || 'Cash',
        collectedBy: paymentData.collectedBy || 'Admin',
        date: new Date(),
        description: paymentData.description || 'Fee payment'
      };

      await Student.findByIdAndUpdate(studentId, {
        $push: { paymentHistory: paymentRecord },
        $inc: { totalPaidAmount: paymentData.amount }
      });

      console.log(`💰 Updated payment history successfully`);
    } catch (error) {
      console.error('❌ Error updating payment history:', error);
    }
  }

  // Create payment confirmation message
  createPaymentMessage(student, paymentData) {
    const courseNames = student.selectedCourses?.map(c => c.name)?.join(', ') || 'Course';
    const amount = paymentData.amount || 0;
    const paymentDate = new Date().toLocaleDateString('en-IN');
    const paymentTime = new Date().toLocaleTimeString('en-IN');
    const paymentMethod = paymentData.paymentMethod || 'Cash';
    const collectedBy = paymentData.collectedBy || 'Admin';
    
    // Calculate remaining amount
    const totalFees = student.totalFees || 0;
    const totalPaid = student.paymentHistory?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const remainingAmount = totalFees - totalPaid - amount; // Subtract current payment
    
    const templates = [
      `💰 PAYMENT CONFIRMED! 💰

Dear ${student.name},

Thank you for your payment! Your transaction has been successfully processed.

📚 Course: ${courseNames}
💰 Amount Paid: ₹${amount}
📅 Payment Date: ${paymentDate}
⏰ Payment Time: ${paymentTime}
💳 Payment Method: ${paymentMethod}
        👤 Payment collected successfully
        📊 Remaining Amount: ₹${remainingAmount}

Your payment has been recorded in our system. Keep this message for your records.

If you have any questions about your payment, please contact us.

Thank you for your trust in TCIT! 🙏

Best regards,
TCIT Team`,

      `✅ PAYMENT RECEIVED! ✅

Hello ${student.name}! 👋

Great news! Your payment has been successfully received and processed.

📚 Course: ${courseNames}
💰 Amount: ₹${amount}
📅 Date: ${paymentDate}
⏰ Time: ${paymentTime}
💳 Method: ${paymentMethod}
        👤 Payment collected successfully
        📊 Remaining: ₹${remainingAmount}

Your payment is now confirmed in our records. 

Thank you for your prompt payment! 🎉

Best regards,
TCIT Team`,

      `🎉 PAYMENT SUCCESSFUL! 🎉

Dear ${student.name},

Your fee payment has been successfully processed! 

📚 Course: ${courseNames}
💰 Amount: ₹${amount}
📅 Date: ${paymentDate}
⏰ Time: ${paymentTime}
💳 Method: ${paymentMethod}
        👤 Payment collected successfully
        📊 Remaining: ₹${remainingAmount}

Your payment is now confirmed. We appreciate your cooperation!

If you need any assistance, feel free to reach out to us.

Thank you! 🙏

Best regards,
TCIT Team`
    ];

    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  // Send payment confirmation for installment
  async sendInstallmentPaymentConfirmation(studentId, installmentData) {
    try {
      console.log(`💰 Sending installment payment confirmation`);
      
      if (!this.messageService.isReady()) {
        throw new Error('WhatsApp message service is not ready');
      }

      const student = await Student.findById(studentId)
        .populate("selectedCourses", "name")
        .select("name selectedCourses studentId contactNo enquiryType totalFees installments paymentHistory");

      if (!student) {
        throw new Error('Student not found');
      }

      if (!student.contactNo) {
        throw new Error('Student contact number not available');
      }

      if (student.enquiryType !== 'Admission') {
        throw new Error('Student is not an admission student');
      }

      const message = this.createInstallmentMessage(student, installmentData);
      
      const result = await this.messageService.sendMessage(student.contactNo, message, {
        maxRetries: 3
      });

      // Update student's payment history and installments if message sent successfully
      if (result.success) {
        await this.updateStudentInstallmentPayment(studentId, installmentData);
      }

      return {
        success: result.success,
        message: result.success ? 'Installment payment confirmation sent successfully' : 'Failed to send installment payment confirmation',
        studentId: 'masked',
        contactNo: 'masked',
        installmentData: 'masked',
        result: 'masked'
      };

    } catch (error) {
      console.error('❌ Error sending installment payment confirmation:', error);
      throw error;
    }
  }

  // Update student installment payment
  async updateStudentInstallmentPayment(studentId, installmentData) {
    try {
      const paymentRecord = {
        amount: installmentData.amount,
        paymentMethod: installmentData.paymentMethod || 'Cash',
        collectedBy: installmentData.collectedBy || 'Admin',
        date: new Date(),
        description: `Installment ${installmentData.installmentNumber} payment`
      };

      // Update payment history
      await Student.findByIdAndUpdate(studentId, {
        $push: { paymentHistory: paymentRecord },
        $inc: { totalPaidAmount: installmentData.amount }
      });

      // Update installment status if installment number is provided
      if (installmentData.installmentNumber && installmentData.installmentIndex !== undefined) {
        await Student.updateOne(
          { _id: studentId, "installments._id": installmentData.installmentIndex },
          { 
            $set: { 
              "installments.$.paid": true,
              "installments.$.paidDate": new Date(),
              "installments.$.paymentMethod": installmentData.paymentMethod || 'Cash'
            }
          }
        );
      }

      console.log(`💰 Updated installment payment successfully`);
    } catch (error) {
      console.error('❌ Error updating installment payment:', error);
    }
  }

  // Create installment payment message
  createInstallmentMessage(student, installmentData) {
    const courseNames = student.selectedCourses?.map(c => c.name)?.join(', ') || 'Course';
    const amount = installmentData.amount || 0;
    const installmentNumber = installmentData.installmentNumber || 1;
    const paymentDate = new Date().toLocaleDateString('en-IN');
    const paymentTime = new Date().toLocaleTimeString('en-IN');
    const paymentMethod = installmentData.paymentMethod || 'Cash';
    const collectedBy = installmentData.collectedBy || 'Admin';
    
    // Calculate remaining installments
    const totalInstallments = student.installments?.length || 0;
    const paidInstallments = student.installments?.filter(inst => inst.paid).length || 0;
    const remainingInstallments = totalInstallments - paidInstallments;
    
    const templates = [
      `💰 INSTALLMENT PAYMENT CONFIRMED! 💰

Dear ${student.name},

Your installment payment has been successfully processed!

📚 Course: ${courseNames}
💰 Amount Paid: ₹${amount}
📊 Installment: ${installmentNumber}/${totalInstallments}
📅 Payment Date: ${paymentDate}
⏰ Payment Time: ${paymentTime}
💳 Payment Method: ${paymentMethod}
        👤 Payment collected successfully
        📋 Remaining Installments: ${remainingInstallments}

Great progress! Keep up the good work! 🎉

Best regards,
TCIT Team`,

      `✅ INSTALLMENT RECEIVED! ✅

Hello ${student.name}! 👋

Your installment payment has been received and confirmed.

📚 Course: ${courseNames}
💰 Amount: ₹${amount}
📊 Installment: ${installmentNumber}/${totalInstallments}
📅 Date: ${paymentDate}
⏰ Time: ${paymentTime}
💳 Method: ${paymentMethod}
        👤 Payment collected successfully
        📋 Remaining: ${remainingInstallments} installments

You're making excellent progress! 🚀

Best regards,
TCIT Team`,

      `🎉 INSTALLMENT SUCCESSFUL! 🎉

Dear ${student.name},

Installment payment confirmed! 

📚 Course: ${courseNames}
💰 Amount: ₹${amount}
📊 Installment: ${installmentNumber}/${totalInstallments}
📅 Date: ${paymentDate}
⏰ Time: ${paymentTime}
💳 Method: ${paymentMethod}
        👤 Payment collected successfully
        📋 Remaining: ${remainingInstallments} installments

Thank you for your timely payment! 🙏

Best regards,
TCIT Team`
    ];

    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  // Send bulk payment confirmations
  async sendBulkPaymentConfirmations(payments) {
    try {
      console.log(`💰 Sending ${payments.length} bulk payment confirmations...`);
      
      if (!this.messageService.isReady()) {
        throw new Error('WhatsApp message service is not ready');
      }

      const messages = [];
      const results = [];

      // Prepare messages
      for (const payment of payments) {
        const student = await Student.findById(payment.studentId)
          .populate("selectedCourses", "name")
          .select("name selectedCourses studentId contactNo enquiryType totalFees paymentHistory");

        if (student && student.contactNo && student.enquiryType === 'Admission') {
          const message = this.createPaymentMessage(student, payment);
          messages.push({
            phoneNumber: student.contactNo,
            message: message,
            studentId: 'masked',
            paymentData: 'masked'
          });
        }
      }

      // Send messages
      const sendResult = await this.messageService.sendBulkMessages(messages, {
        delayBetweenMessages: 2000, // 2 seconds delay
        maxRetries: 3
      });

      // Process results and update payment history
      for (let i = 0; i < messages.length; i++) {
        const messageData = messages[i];
        const messageResult = sendResult.results[i];
        
        // Update payment history if message sent successfully
        if (messageResult.success) {
          await this.updateStudentPaymentHistory(messageData.studentId, messageData.paymentData);
        }
        
        results.push({
          studentId: 'masked',
          contactNo: 'masked',
          paymentData: 'masked',
          messageResult: 'masked'
        });
      }

      const successCount = results.filter(r => r.messageResult.success).length;
      const failureCount = results.filter(r => !r.messageResult.success).length;

      console.log(`✅ Bulk payment confirmations completed: ${successCount} sent, ${failureCount} failed`);

      return {
        success: true,
        message: `Payment confirmations sent to ${payments.length} students`,
        totalPayments: payments.length,
        successfulMessages: successCount,
        failedMessages: failureCount,
        results: results
      };

    } catch (error) {
      console.error('❌ Error sending bulk payment confirmations:', error);
      throw error;
    }
  }

  // Get service status
  getStatus() {
    return {
      serviceName: 'Fee Payment Message Service',
      messageServiceReady: this.messageService.isReady(),
      lastRun: new Date().toISOString()
    };
  }
}

// Create singleton instance
const feePaymentMessageService = new FeePaymentMessageService();

export default feePaymentMessageService;
