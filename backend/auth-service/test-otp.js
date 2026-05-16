require('dotenv').config();
const emailUtils = require('./src/utils/email.utils');

emailUtils.sendOtpEmail({
  email: process.env.EMAIL_USER,
  subject: 'Verify your HackCollab Account',
  message: 'Please use the OTP below to verify your email address.',
  otp: '123456'
}).then(info => {
  console.log('Success:', info.messageId);
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
