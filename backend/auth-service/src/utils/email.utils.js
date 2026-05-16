const nodemailer = require('nodemailer');

/**
 * Create a transporter for sending emails
 */
const createTransporter = async () => {
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use real SMTP configuration
      return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // Use Ethereal credentials from CSV for development
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'abbey.haag61@ethereal.email',
          pass: 'QuamaR8XMsmwpXxr9v'
        }
      });

      console.log('Ethereal test transporter created.');
      return transporter;
    }
  } catch (error) {
    console.error('Failed to create email transporter:', error);

    return {
      sendMail: (options) => {
        console.log('\n--- EMAIL FALLBACK ---');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Text: ${options.text}`);
        console.log(`HTML: ${options.html}`);
        console.log('--- END EMAIL FALLBACK ---\n');

        return Promise.resolve({
          messageId: 'mock-id',
          previewURL: null
        });
      }
    };
  }
};

/**
 * Send a password reset email
 */
exports.sendPasswordResetEmail = async (options) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: '"HackCollab Support" <support@eventflowplus.com>',
      to: options.email,
      subject: options.subject,
      text: `${options.message}\n\nReset URL: ${options.resetUrl}\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="background-color: #f4f4f7; padding: 40px 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); overflow: hidden;">
            <tr>
              <td style="padding: 30px; text-align: center; background: #3b82f6;">
                <h1 style="color: white; font-size: 24px; margin: 0;">HackCollab</h1>
                <p style="color: #dbeafe; margin-top: 4px;">Reset your password</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; color: #333;">
                <p style="font-size: 16px; margin: 0 0 20px;">Hi there,</p>
                <p style="font-size: 15px; line-height: 1.6;">${options.message}</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${options.resetUrl}" 
                    style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                    Reset Password
                  </a>
                </div>
                <p style="font-size: 13px; color: #777;">If you didn't request this password reset, please ignore this email.</p>
                <p style="font-size: 13px; color: #777;">This link will expire in 30 minutes for security reasons.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; background-color: #f1f5f9; text-align: center;">
                <p style="font-size: 12px; color: #94a3b8;">HackCollab • College Event Management System</p>
              </td>
            </tr>
          </table>
        </div>
      `
    };
    

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent:', info.messageId);

    const previewURL = nodemailer.getTestMessageUrl(info);
    if (previewURL) {
      console.log('Preview URL:', previewURL);
    }

    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send an OTP verification email
 */
exports.sendOtpEmail = async (options) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: '"HackCollab Support" <' + (process.env.EMAIL_USER || 'support@eventflowplus.com') + '>',
      to: options.email,
      subject: options.subject,
      text: `${options.message}\n\nYour OTP is: ${options.otp}\n\nThis OTP will expire in 10 minutes.`,
      html: `
        <div style="background-color: #f4f4f7; padding: 40px 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); overflow: hidden;">
            <tr>
              <td style="padding: 30px; text-align: center; background: #3b82f6;">
                <h1 style="color: white; font-size: 24px; margin: 0;">HackCollab</h1>
                <p style="color: #dbeafe; margin-top: 4px;">Verification Required</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; color: #333; text-align: center;">
                <p style="font-size: 16px; margin: 0 0 20px;">Hi there,</p>
                <p style="font-size: 15px; line-height: 1.6;">${options.message}</p>
                <div style="margin: 30px 0;">
                  <span style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; padding: 15px 30px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e293b; border-radius: 8px;">
                    ${options.otp}
                  </span>
                </div>
                <p style="font-size: 13px; color: #777;">This OTP will expire in 10 minutes.</p>
                <p style="font-size: 13px; color: #777;">If you didn't request this, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; background-color: #f1f5f9; text-align: center;">
                <p style="font-size: 12px; color: #94a3b8;">HackCollab • College Event Management System</p>
              </td>
            </tr>
          </table>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};
