import whatsappConnectionService from './connectionService.js';

class WhatsAppMessageService {
  constructor() {
    this.connectionService = whatsappConnectionService;
  }

  // ✅ FIXED: Send message safely using getNumberId
  async sendMessage(contactNo, message, options = {}) {
    try {
      if (!this.connectionService.isReady) {
        throw new Error("WhatsApp client not ready");
      }

      const client = this.connectionService.getClient();
      if (!client) {
        throw new Error("WhatsApp client not available");
      }

      // ✅ Clean number and add country code if missing
      let phone = contactNo.toString().replace(/\D/g, "");
      
      // Ensure it starts with country code (default India = 91)
      if (phone.length === 10) {
        phone = "91" + phone;
      }

      console.log(`📱 Sending message to ${phone}`);

      // Validate number with WhatsApp using getNumberId
      const numberId = await client.getNumberId(phone);
      if (!numberId) {
        console.error(`❌ Number ${phone} is not registered on WhatsApp`);
        return { success: false, error: "Number not registered on WhatsApp" };
      }

      // ✅ STRONG SOLUTION: Send message with retry and delay logic
      let sentMessage;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`📤 Attempt ${retryCount + 1}/${maxRetries} - Sending to ${phone}`);
          
                // Add delay before sending (helps with chat loading)
      if (retryCount > 0) {
        const delay = retryCount * 3000; // 3s, 6s, 9s delays (increased for Render)
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
          
          sentMessage = await client.sendMessage(numberId._serialized, message);
          console.log(`✅ Message sent successfully to ${phone} on attempt ${retryCount + 1}`);
          break;
          
        } catch (sendError) {
          retryCount++;
          console.error(`❌ Attempt ${retryCount} failed:`, sendError.message);
          
          // If it's a getChat error, try with delay
          if (sendError.message.includes('getChat') || sendError.message.includes('undefined')) {
            console.log(`🔄 getChat error detected, will retry with delay...`);
            continue;
          }
          
          // For other errors, throw immediately
          throw sendError;
        }
      }
      
      if (retryCount >= maxRetries) {
        throw new Error(`Failed to send message after ${maxRetries} attempts due to getChat issues`);
      }

      return { 
        success: true, 
        message: sentMessage,
        phoneNumber: phone,
        messageId: sentMessage?.id?._serialized || null,
        timestamp: new Date().toISOString()
      };

    } catch (err) {
      console.error(`❌ Failed to send message to ${contactNo}:`, err);
      return { 
        success: false, 
        error: err.message,
        phoneNumber: contactNo,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Send multiple messages
  async sendBulkMessages(messages, options = {}) {
    console.log(`📱 Sending ${messages.length} bulk messages...`);
    
    const results = [];
    const delayBetweenMessages = options.delayBetweenMessages || 3000; // 3 seconds delay (increased for Render)

    for (let i = 0; i < messages.length; i++) {
      const messageData = messages[i];
      
      try {
        console.log(`📤 Sending message ${i + 1}/${messages.length} to ${messageData.phoneNumber}`);
        
        const result = await this.sendMessage(
          messageData.phoneNumber, 
          messageData.message, 
          options
        );
        
        results.push({
          index: i,
          ...result
        });

        // Add delay between messages to avoid rate limiting
        if (i < messages.length - 1) {
          console.log(`⏳ Waiting ${delayBetweenMessages}ms before next message...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
        }

      } catch (error) {
        console.error(`❌ Error sending message ${i + 1}:`, error.message);
        results.push({
          index: i,
          success: false,
          phoneNumber: messageData.phoneNumber,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`✅ Bulk message sending completed: ${successCount} sent, ${failureCount} failed`);
    
    return {
      success: true,
      totalMessages: messages.length,
      successfulMessages: successCount,
      failedMessages: failureCount,
      results: results
    };
  }

  // Check if service is ready
  isReady() {
    return this.connectionService.isReady;
  }

  // Get service status
  getStatus() {
    return {
      messageServiceReady: this.connectionService.isReady,
      connectionStatus: this.connectionService.getStatus()
    };
  }
}

// Create singleton instance
const whatsappMessageService = new WhatsAppMessageService();

export default whatsappMessageService;
