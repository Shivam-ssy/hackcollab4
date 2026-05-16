require('dotenv').config({ path: './backend/auth-service/.env' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.sendMail({
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  to: 'shikharkant25@gmail.com', // sending to self
  subject: 'Test Email',
  text: 'Testing SMTP configuration'
}, (error, info) => {
  if (error) {
    console.error('Email sending failed:', error);
  } else {
    console.log('Email sent:', info.messageId);
  }
  process.exit();
});
