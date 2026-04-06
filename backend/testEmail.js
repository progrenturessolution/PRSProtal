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
      subject: 'Test Email - PRS Portal',
      text: `Dear Team,

This is a test email to verify the PRS Portal mail system.

If you receive this message, the email delivery configuration is working correctly.
      `.trim(),
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#111827;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Progrentures™ Solution Pvt. Ltd.</p>
                    <p style="margin:6px 0 0;color:#d1d5db;font-size:13px;">PRS Portal</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#111827;font-size:22px;line-height:1.35;">Test Email - PRS Portal</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.7;">Dear Team,</p>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.7;">This is a test email to verify the PRS Portal mail system.</p>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.7;">If you receive this message, the email delivery configuration is working correctly.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 28px;border-top:1px solid #e5e7eb;background:#f9fafb;">
                    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">This is an automated service email. Please do not reply to this message.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `
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
