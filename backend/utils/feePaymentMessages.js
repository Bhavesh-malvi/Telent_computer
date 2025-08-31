// Fee payment confirmation message templates
const feePaymentTemplates = [
  // Template 1: Simple and Clear
  `✅ Payment Confirmed!

Dear [STUDENT_NAME],

Your fee payment of ₹[AMOUNT] has been successfully received.

Thank you for your payment! 📚

Best regards,
TCIT Team`,

  // Template 2: Friendly and Encouraging
  `🎉 Payment Successful!

Hi [STUDENT_NAME],

Great news! Your fee payment of ₹[AMOUNT] has been processed successfully.

Keep up the great work! 🌟

Best wishes,
TCIT Team`,

  // Template 3: Professional and Formal
  `📋 Payment Receipt

Dear [STUDENT_NAME],

We confirm receipt of your fee payment amounting to ₹[AMOUNT].

Your payment has been recorded in our system.

Thank you,
TCIT Team`,

  // Template 4: Warm and Appreciative
  `💝 Thank You!

Hello [STUDENT_NAME],

Your fee payment of ₹[AMOUNT] has been received with thanks.

We appreciate your prompt payment! 🙏

Best regards,
TCIT Team`,

  // Template 5: Motivational
  `🚀 Payment Complete!

Hi [STUDENT_NAME],

Your fee payment of ₹[AMOUNT] has been successfully completed.

You're one step closer to your goals! 💪

Best regards,
TCIT Team`
];

// Function to get a random template
function getRandomTemplate() {
  const randomIndex = Math.floor(Math.random() * feePaymentTemplates.length);
  return feePaymentTemplates[randomIndex];
}

// Function to generate personalized fee payment message
function generateFeePaymentMessage(studentName, amount) {
  const template = getRandomTemplate();
  
  // Replace placeholders with actual values
  let message = template
    .replace(/\[STUDENT_NAME\]/g, studentName)
    .replace(/\[AMOUNT\]/g, amount.toLocaleString('en-IN'));
  
  return message;
}

// Function to get all templates (for testing)
function getAllTemplates() {
  return feePaymentTemplates;
}

export {
  getRandomTemplate,
  generateFeePaymentMessage,
  getAllTemplates,
  feePaymentTemplates
};
