import nodemailer from 'nodemailer';

/**
 * Utility to send an email to the admin
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML formatted email body
 */
export const sendAdminEmail = async (subject, htmlContent) => {
  try {
    // Check if credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials (EMAIL_USER/EMAIL_PASS) are missing in .env');
      return false; // Silently fail or handled by controller
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this if not using gmail
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s+/g, '') // remove spaces from app password just in case
      }
    });

    // Setup email options
    const mailOptions = {
      from: `"Telent Computer" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Sending to admin's own email
      subject: subject,
      html: htmlContent
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
};
