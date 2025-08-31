// Welcome message templates for new student admissions
const welcomeTemplates = [
  // Template 1: Joyful and Energetic
  `🎉 Congratulations [STUDENT_NAME]! Your admission for [COURSE_NAMES] is successfully confirmed. Welcome to our learning family! 🚀

We're excited to have you join us on this amazing educational journey. Get ready for:
✨ Incredible learning experiences
🌟 Expert guidance from our faculty
📚 Comprehensive course materials
🎯 Practical hands-on training

Your journey to success starts now! 🌟

Best regards,
TCIT Team 💝`,

  // Template 2: Motivational and Inspiring
  `👏 Welcome aboard [STUDENT_NAME]! You are now officially enrolled in [COURSE_NAMES]. Let's begin this exciting journey! 🎓

Your decision to join us shows your commitment to growth and excellence. We're here to support you every step of the way.

May this learning journey bring you:
🚀 New skills and knowledge
💫 Confidence and expertise
🎯 Career opportunities
🌟 Personal development

Together, we'll achieve great things! ✨

Warm regards,
TCIT Team 🌟`,

  // Template 3: Warm and Caring
  `🙌 Great news [STUDENT_NAME]! Your admission process for [COURSE_NAMES] is complete. We're thrilled to have you with us! 💡

Welcome to the TCIT family! We believe in nurturing talent and providing the best learning environment for our students.

Your success is our priority:
💝 Personalized attention
🎁 Quality education
😊 Supportive environment
🌟 Career guidance

We're excited to see you grow! 📘

Best wishes,
TCIT Team 💕`,

  // Template 4: Fun and Playful
  `🌟 Hello [STUDENT_NAME]! Congratulations, you're now a part of [COURSE_NAMES]. Let's start this new chapter together! 📘

You've made an excellent choice! Get ready for an amazing learning adventure filled with:
🎂 Knowledge and skills
🎁 Practical experience
😄 Fun learning sessions
🌟 Exciting projects

You're going to love it here! 🎊

Cheers to your success,
TCIT Team 🎉`,

  // Template 5: Encouraging and Supportive
  `🎓 Welcome [STUDENT_NAME]! Your admission to [COURSE_NAMES] is confirmed. Your journey to excellence begins now! 🌟

We're committed to providing you with:
📚 Comprehensive training
🎯 Industry-relevant skills
💪 Professional development
🌟 Career advancement

Your potential is limitless, and we're here to help you reach your goals!

Here's to an amazing learning experience! 🚀

Best regards,
TCIT Team 🌟`
];

// Function to get a random template
function getRandomTemplate() {
  const randomIndex = Math.floor(Math.random() * welcomeTemplates.length);
  return welcomeTemplates[randomIndex];
}

// Function to generate personalized welcome message
function generateWelcomeMessage(studentName, courseNames) {
  const template = getRandomTemplate();
  
  // Replace placeholders with actual values
  let message = template
    .replace(/\[STUDENT_NAME\]/g, studentName)
    .replace(/\[COURSE_NAMES\]/g, courseNames);
  
  return message;
}

// Function to get all templates (for testing)
function getAllTemplates() {
  return welcomeTemplates;
}

export {
  getRandomTemplate,
  generateWelcomeMessage,
  getAllTemplates,
  welcomeTemplates
};
