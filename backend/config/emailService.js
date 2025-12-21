const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter with detailed configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s/g, '') : ''
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Log email configuration status
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('📧 Email service configured for:', process.env.EMAIL_USER);
} else {
  console.log('⚠️ Email credentials not configured in .env file');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'MISSING');
}

// Send welcome email to new intern
exports.sendInternCredentials = async (internName, internEmail, internId, password) => {
  try {
    const mailOptions = {
      from: `"Progrentures Team" <${process.env.EMAIL_USER}>`,
      to: internEmail,
      subject: 'Progrentures Internship - Your Login Credentials',
      text: `
Welcome to Progrentures!

Dear ${internName},

Congratulations! You have been registered for the internship at Progrentures.

This is your Progrentures Internship ID and Password:

Intern ID: ${internId}
Password: ${password}

Please keep these credentials safe and use them to login to your account.

Important: Do not share your credentials with anyone.

Best regards,
Progrentures Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 26px;">🎉 Welcome to Progrentures!</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff; border-radius: 0 0 10px 10px;">
            
            <p style="font-size: 17px; color: #333; margin-bottom: 10px;">Dear <strong>${internName}</strong>,</p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">
              Congratulations! You have been successfully registered as an intern at <strong>Progrentures</strong>.
            </p>
            
            <!-- Credentials Box -->
            <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 25px; border-radius: 10px; margin: 30px 0;">
              <h2 style="margin: 0 0 20px 0; color: #1e40af; font-size: 20px; text-align: center;">
                📧 This is your Progrentures Internship ID and Password
              </h2>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="margin: 15px 0; font-size: 16px; color: #1e293b;">
                  <strong style="display: inline-block; width: 120px;">Intern ID:</strong>
                  <span style="font-size: 20px; color: #2563eb; font-weight: bold; letter-spacing: 1px;">${internId}</span>
                </p>
                <p style="margin: 15px 0; font-size: 16px; color: #1e293b;">
                  <strong style="display: inline-block; width: 120px;">Password:</strong>
                  <span style="font-size: 20px; color: #2563eb; font-weight: bold; letter-spacing: 1px;">${password}</span>
                </p>
              </div>
            </div>
            
            <!-- Instructions -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                <strong>⚠️ Important:</strong> Please keep these credentials safe and do not share them with anyone. 
                Change your password after first login for security.
              </p>
            </div>
            
            <p style="font-size: 15px; color: #555; margin-top: 25px; line-height: 1.6;">
              You can now login to your account using the credentials provided above.
            </p>
            
            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
              <p style="margin: 5px 0; color: #666; font-size: 15px;">Best regards,</p>
              <p style="margin: 5px 0; color: #0f172a; font-weight: 700; font-size: 16px;">Progrentures Team</p>
            </div>
          </div>
          
          <!-- Bottom Note -->
          <div style="text-align: center; margin-top: 20px; padding: 15px;">
            <p style="margin: 0; font-size: 12px; color: #999;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${internEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Error code:', error.code);
    if (error.code === 'EAUTH') {
      console.error('💡 Authentication failed. Please check:');
      console.error('   1. EMAIL_USER is correct in .env');
      console.error('   2. EMAIL_PASS is a valid Gmail App Password (not regular password)');
      console.error('   3. 2-Step Verification is enabled on your Google account');
      console.error('   4. Generate new App Password: https://myaccount.google.com/apppasswords');
    }
    return { success: false, error: error.message };
  }
};

// Send task assignment email
exports.sendTaskAssignmentEmail = async (internName, internEmail, taskTitle, taskDescription, deadline) => {
  try {
    const formattedDeadline = new Date(deadline).toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    const mailOptions = {
      from: `"Progrentures Team" <${process.env.EMAIL_USER}>`,
      to: internEmail,
      subject: '📋 New Task Assigned - Progrentures Internship',
      text: `
Dear ${internName},

You have been assigned a new internship task!

Task Title: ${taskTitle}

Description: ${taskDescription}

Deadline: ${formattedDeadline}

Please login to your dashboard to view complete details and update your progress.

Best regards,
Progrentures Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 26px;">📋 New Task Assigned!</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff; border-radius: 0 0 10px 10px;">
            
            <p style="font-size: 17px; color: #333; margin-bottom: 10px;">Dear <strong>${internName}</strong>,</p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">
              You have been assigned a new internship task at <strong>Progrentures</strong>.
            </p>
            
            <!-- Task Details Box -->
            <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 25px; border-radius: 10px; margin: 30px 0;">
              <h2 style="margin: 0 0 20px 0; color: #1e40af; font-size: 20px; text-align: center;">
                Task Details
              </h2>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="margin: 15px 0; font-size: 16px; color: #1e293b;">
                  <strong style="display: block; margin-bottom: 5px; color: #64748b;">Task Title:</strong>
                  <span style="font-size: 18px; color: #0f172a; font-weight: 600;">${taskTitle}</span>
                </p>
                <p style="margin: 15px 0; font-size: 16px; color: #1e293b;">
                  <strong style="display: block; margin-bottom: 5px; color: #64748b;">Description:</strong>
                  <span style="font-size: 15px; color: #334155; line-height: 1.6;">${taskDescription}</span>
                </p>
                <p style="margin: 15px 0; font-size: 16px; color: #1e293b;">
                  <strong style="display: block; margin-bottom: 5px; color: #64748b;">Deadline:</strong>
                  <span style="font-size: 18px; color: #dc2626; font-weight: 600;">⏰ ${formattedDeadline}</span>
                </p>
              </div>
            </div>
            
            <!-- Action Box -->
            <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.6;">
                <strong>📌 Next Steps:</strong> Please login to your dashboard to view complete details and update your progress regularly.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
              <p style="margin: 5px 0; color: #666; font-size: 15px;">Best regards,</p>
              <p style="margin: 5px 0; color: #0f172a; font-weight: 700; font-size: 16px;">Progrentures Team</p>
            </div>
          </div>
          
          <!-- Bottom Note -->
          <div style="text-align: center; margin-top: 20px; padding: 15px;">
            <p style="margin: 0; font-size: 12px; color: #999;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Task assignment email sent to ${internEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Task email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};
