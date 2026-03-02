// Backend/test-email.js (temporary test file)
require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

async function testSend() {
  try {
    await sendEmail(
      'asantefesk8@gmail.com', 
      'Test MFA Email from Capstone Project',
      'Hello! This is a test email from your e-commerce security project.\n\nYour OTP would be: 123456\n\nDo not share this code.',
      '<h2>Test MFA Email</h2><p>Hello! This is a test from your capstone.</p><p><strong>OTP:</strong> 123456</p><p>Do not share.</p>'
    );
    console.log('Test email sent successfully!');
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testSend();