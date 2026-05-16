require('dotenv').config({ path: './backend/auth-service/.env' });
const emailUtils = require('./backend/auth-service/src/utils/email.utils');

emailUtils.sendOtpEmail({
  email: 'shikharkant25@gmail.com',
  subject: 'Verify your HackCollab Account',
  message: 'Please use the OTP below to verify your email address.',
  otp: '123456'
}).then(info => {
  console.log('Success:', info);
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
