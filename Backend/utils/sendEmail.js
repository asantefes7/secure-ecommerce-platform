// Backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html = null) => {
  try {
    // Create transporter using Gmail (or your SMTP service)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Mail options
    const mailOptions = {
      from: `"Secure E-Commerce" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`, // Use HTML version if provided, else fallback to text
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('Email sending failed:', err.message);
    throw new Error(`Failed to send email: ${err.message}`);
  }
};

module.exports = sendEmail;