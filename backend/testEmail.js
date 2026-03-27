require('dotenv').config();
const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('Testing email with:');
console.log('Email:', process.env.EMAIL_USER);
console.log('SMTP:', `${smtpHost}:${smtpPort}`, 'secure=', smtpSecure);
console.log('Password length:', process.env.EMAIL_PASS.length);

transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Verification Error:', error.message);
    console.log('Error code:', error.code);
  } else {
    console.log('✅ Server is ready to take our messages');
    
    // Send test email
    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Test Email from Progrentures',
      text: 'If you receive this, email is working!'
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('❌ Send Error:', error.message);
      } else {
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
      }
      process.exit(0);
    });
  }
});
