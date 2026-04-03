const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

// Create transporter with detailed configuration
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure, // true for 465, false for STARTTLS (587)
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
  console.log('📧 Email service configured for:', process.env.EMAIL_USER, `via ${smtpHost}:${smtpPort}`);
} else {
  console.log('⚠️ Email credentials not configured in .env file');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'MISSING');
}

// Send welcome email to new intern
exports.sendInternCredentials = async (internName, internEmail, internId, password) => {
  try {
    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: internEmail,
      subject: 'Progrentures Internship Program: Login Credentials',
      text: `
Dear ${internName},

    Greetings from Progrentures.

    This is to inform you that your internship account has been successfully created.
    Please use the credentials below to sign in:

Intern ID: ${internId}
Temporary Password: ${password}

    Important:
    - After login, please download your Offer Letter from the Certifications section.

Security Notice:
- Keep these credentials confidential.
- Update your password after your first login.

    Best regards,
Progrentures Team
      `,
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#111827;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Progrentures</p>
                    <p style="margin:6px 0 0;color:#d1d5db;font-size:13px;">Internship Management</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#111827;font-size:22px;line-height:1.35;">Internship Account Credentials</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">Dear ${internName},</p>
                    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">This is to inform you that your internship account has been successfully created. Please use the credentials below to sign in.</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-collapse:collapse;margin:0 0 20px;">
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Intern ID</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:15px;font-weight:700;">${internId}</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Temporary Password</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:15px;font-weight:700;">${password}</td>
                      </tr>
                    </table>

                    <div style="background:#fff7ed;border:1px solid #fed7aa;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#9a3412;font-size:13px;line-height:1.6;"><strong>Security Notice:</strong> Keep credentials confidential and update your password after first login.</p>
                    </div>

                    <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#1d4ed8;font-size:13px;line-height:1.6;"><strong>Next Step:</strong> After login, please download your Offer Letter from the Certifications section.</p>
                    </div>

                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Regards,<br><strong>Progrentures Team</strong></p>
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

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${internEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Error code:', error.code);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check:', 'line 124');
      console.error('   1. EMAIL_USER is correct in .env');
      console.error('   2. EMAIL_PASS is correct for your SMTP provider');
      console.error('   3. SMTP_HOST, SMTP_PORT, SMTP_SECURE are configured correctly');
    }
    return { success: false, error: error.message };
  }
};

// Send representative login credentials
exports.sendRepresentativeCredentials = async ({
  repName,
  repEmail,
  password
}) => {
  try {
    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: repEmail,
      subject: 'Progrentures Representative Panel: Login Credentials',
      text: `
Dear ${repName},

Greetings from Team Progrentures.

Your Representative Panel account has been created successfully.
Please use the following credentials to login:

Email: ${repEmail}
Temporary Password: ${password}

Security Notice:
- Keep these credentials confidential.
- Please change your password after first login.

Best regards,
Team Progrentures
      `,
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#111827;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Progrentures</p>
                    <p style="margin:6px 0 0;color:#d1d5db;font-size:13px;">Representative Management</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#111827;font-size:22px;line-height:1.35;">Representative Login Credentials</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">Dear ${repName},</p>
                    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">Your Representative Panel account has been created successfully. Please use the credentials below to login.</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-collapse:collapse;margin:0 0 20px;">
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Login Email</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:15px;font-weight:700;">${repEmail}</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Temporary Password</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:15px;font-weight:700;">${password}</td>
                      </tr>
                    </table>

                    <div style="background:#fff7ed;border:1px solid #fed7aa;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#9a3412;font-size:13px;line-height:1.6;"><strong>Security Notice:</strong> Keep credentials confidential and change your password after first login.</p>
                    </div>

                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Regards,<br><strong>Team Progrentures</strong></p>
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

    await transporter.sendMail(mailOptions);
    console.log(`✅ Representative credentials email sent to ${repEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Representative email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send trainer credentials email
exports.sendTrainerCredentials = async ({
  trainerName,
  trainerEmail,
  password
}) => {
  try {
    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: trainerEmail,
      subject: 'Progrentures Trainer Panel: Login Credentials',
      text: `
Dear ${trainerName},

Greetings from Team Progrentures.

Your Trainer Panel account has been created successfully.
Please use the following credentials to login:

Email: ${trainerEmail}
Temporary Password: ${password}

Security Notice:
- Keep these credentials confidential.
- Please change your password after first login.

Best regards,
Team Progrentures
      `,
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#111827;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Progrentures</p>
                    <p style="margin:6px 0 0;color:#d1d5db;font-size:13px;">Trainer Management</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#111827;font-size:22px;line-height:1.35;">Trainer Login Credentials</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">Dear ${trainerName},</p>
                    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">Your Trainer Panel account has been created successfully. Please use the credentials below to login.</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-collapse:collapse;margin:0 0 20px;">
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Login Email</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:15px;font-weight:700;">${trainerEmail}</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Temporary Password</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:15px;font-weight:700;">${password}</td>
                      </tr>
                    </table>

                    <div style="background:#fff7ed;border:1px solid #fed7aa;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#9a3412;font-size:13px;line-height:1.6;"><strong>Security Notice:</strong> Keep credentials confidential and change your password after first login.</p>
                    </div>

                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Regards,<br><strong>Team Progrentures</strong></p>
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

    await transporter.sendMail(mailOptions);
    console.log(`✅ Trainer credentials email sent to ${trainerEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Trainer email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send certificate assignment notification
exports.sendCertificateAssignmentEmail = async ({
  internName,
  internEmail,
  certificateNames = [],
  expiresAt,
  certificateFiles = []
}) => {
  try {
    const formattedExpiry = expiresAt
      ? new Date(expiresAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
      : null;

    const namesListText = certificateNames.length > 0
      ? certificateNames.map((name, index) => `${index + 1}. ${name}`).join('\n')
      : 'Your assigned certificate(s) are now available in your account.';

    const namesListHtml = certificateNames.length > 0
      ? `<ul style="margin:10px 0 0 18px;padding:0;color:#374151;font-size:14px;line-height:1.6;">${certificateNames.map((name) => `<li style="margin-bottom:6px;">${name}</li>`).join('')}</ul>`
      : '<p style="margin:10px 0 0;color:#374151;font-size:14px;line-height:1.6;">Your assigned certificate(s) are now available in your account.</p>';

    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: internEmail,
      subject: 'Progrentures Internship Program: Certificate Assignment Notice',
      text: `
Dear ${internName},

This is to inform you that certificate(s) have been assigned to your account.

Assigned Certificates:
${namesListText}

Please login to your dashboard and open the Certifications section to view and download your certificates.
${formattedExpiry ? `\nNote: Access may expire on ${formattedExpiry}.` : ''}

Best regards,
Progrentures Team
      `,
      attachments: Array.isArray(certificateFiles)
        ? certificateFiles
            .filter((file) => file && file.filepath && file.filename)
            .map((file) => ({
              filename: file.filename,
              path: path.resolve(file.filepath),
              contentDisposition: 'attachment'
            }))
        : [],
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#111827;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Progrentures</p>
                    <p style="margin:6px 0 0;color:#d1d5db;font-size:13px;">Internship Management</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#111827;font-size:22px;line-height:1.35;">Certificate Assignment Notice</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">Dear ${internName},</p>
                    <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.6;">Certificate(s) have been assigned to your account.</p>

                    <div style="border:1px solid #d1d5db;background:#f9fafb;padding:12px 14px;margin:0 0 16px;">
                      <p style="margin:0;color:#4b5563;font-size:13px;font-weight:600;">Assigned Certificates</p>
                      ${namesListHtml}
                    </div>

                    <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:12px 14px;margin:0 0 16px;">
                      <p style="margin:0;color:#1d4ed8;font-size:13px;line-height:1.6;"><strong>Action Required:</strong> Please login and open the Certifications section to view and download your certificates.${certificateFiles.length > 0 ? ' The assigned certificate file(s) are also attached with this email for direct download.' : ''}</p>
                    </div>

                    ${formattedExpiry ? `<p style="margin:0 0 14px;color:#9a3412;font-size:13px;line-height:1.6;"><strong>Note:</strong> Access may expire on ${formattedExpiry}.</p>` : ''}

                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Regards,<br><strong>Progrentures Team</strong></p>
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

    await transporter.sendMail(mailOptions);
    console.log(`✅ Certificate assignment email sent to ${internEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Certificate assignment email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send task assignment email
exports.sendTaskAssignmentEmail = async ({
  internName,
  internEmail,
  taskTitle,
  taskDescription,
  deadline,
  isTeamTask = false,
  teamMembers = [],
  taskDocument = null
}) => {
  try {
    const formattedDeadline = new Date(deadline).toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    const teamListText = teamMembers.length > 0
      ? teamMembers.map((member, index) => `${index + 1}. ${member.name}${member.internId ? ` (${member.internId})` : ''}`).join('\n')
      : 'No additional team members listed.';

    const teamListHtml = teamMembers.length > 0
      ? `<ul style="margin:10px 0 0 18px;padding:0;color:#374151;font-size:14px;line-height:1.6;">${teamMembers.map((member) => `<li style="margin-bottom:6px;">${member.name}${member.internId ? ` (${member.internId})` : ''}</li>`).join('')}</ul>`
      : '<p style="margin:10px 0 0;color:#374151;font-size:14px;line-height:1.6;">No additional team members listed.</p>';

    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: internEmail,
      subject: 'Progrentures Internship: New Task Assignment',
      text: `
Dear ${internName},

You have been assigned a new internship task.

Task Title: ${taskTitle}

Description: ${taskDescription}

Deadline: ${formattedDeadline}

Task Type: ${isTeamTask ? 'Team Task' : 'Individual Task'}

${isTeamTask ? `Team Members:\n${teamListText}\n` : ''}

Please sign in to your dashboard to review details and update progress.
${taskDocument ? '\nThe task PDF/document has been attached to this email.' : ''}

Best regards,
Progrentures Team
      `,
      attachments: taskDocument ? [{
        filename: taskDocument.filename,
        path: path.resolve(taskDocument.filepath),
        contentDisposition: 'attachment'
      }] : [],
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#111827;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Progrentures</p>
                    <p style="margin:6px 0 0;color:#d1d5db;font-size:13px;">Internship Management</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#111827;font-size:22px;line-height:1.35;">New Task Assignment</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">Dear ${internName},</p>
                    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">A new task has been assigned to you. Please review the details below.</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-collapse:collapse;margin:0 0 20px;">
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Task Title</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;font-weight:600;">${taskTitle}</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;vertical-align:top;">Description</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#374151;font-size:14px;line-height:1.6;">${taskDescription}</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Deadline</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#991b1b;font-size:14px;font-weight:700;">${formattedDeadline}</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Task Type</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;font-weight:600;">${isTeamTask ? 'Team Task' : 'Individual Task'}</td>
                      </tr>
                    </table>

                    ${isTeamTask ? `
                      <div style="border:1px solid #d1d5db;background:#f9fafb;padding:12px 14px;margin:0 0 16px;">
                        <p style="margin:0;color:#4b5563;font-size:13px;font-weight:600;">Team Members</p>
                        ${teamListHtml}
                      </div>
                    ` : ''}

                    <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#065f46;font-size:13px;line-height:1.6;"><strong>Action Required:</strong> Please sign in to your dashboard and update progress regularly.</p>
                    </div>

                    ${taskDocument ? `
                      <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:12px 14px;margin:0 0 20px;">
                        <p style="margin:0;color:#1d4ed8;font-size:13px;line-height:1.6;"><strong>Attachment:</strong> Task PDF/document is attached with this email.</p>
                      </div>
                    ` : ''}

                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Regards,<br><strong>Progrentures Team</strong></p>
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

    await transporter.sendMail(mailOptions);
    console.log(`✅ Task assignment email sent to ${internEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Task email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Generic email sender (used for feedback and other notifications)
exports.sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return { success: false, error: error.message };
  }
};
// Send trainer assignment notification
exports.sendTrainerAssignmentNotification = async ({
  trainerName,
  trainerEmail,
  studentsList = []
}) => {
  try {
    const studentListHtml = studentsList
      .map((student) => `
        <tr>
          <td style="padding:10px;border:1px solid #d1d5db;">${student.name || 'N/A'}</td>
          <td style="padding:10px;border:1px solid #d1d5db;">${student.email || 'N/A'}</td>
          <td style="padding:10px;border:1px solid #d1d5db;">${student.internId || 'N/A'}</td>
        </tr>
      `)
      .join('');

    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: trainerEmail,
      subject: 'Students Assigned to You - Progrentures Trainer Panel',
      text: `
Dear ${trainerName},

Greetings from Team Progrentures.

You have been assigned ${studentsList.length} student(s) for mentoring and training.

Student Details:
${studentsList.map((s) => `- ${s.name} (${s.internId}) - ${s.email}`).join('\n')}

Please login to your Trainer Panel to view more details and start mentoring.

Best regards,
Team Progrentures
      `,
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#111827;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Progrentures</p>
                    <p style="margin:6px 0 0;color:#d1d5db;font-size:13px;">Trainer Assignment</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#111827;font-size:22px;line-height:1.35;">New Students Assigned</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">Dear ${trainerName},</p>
                    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">You have been assigned ${studentsList.length} student(s) for mentoring and training. Please review their details below.</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-collapse:collapse;margin:0 0 20px;">
                      <thead>
                        <tr style="background:#f9fafb;">
                          <th style="padding:12px;border:1px solid #d1d5db;text-align:left;color:#4b5563;font-size:13px;font-weight:600;">Student Name</th>
                          <th style="padding:12px;border:1px solid #d1d5db;text-align:left;color:#4b5563;font-size:13px;font-weight:600;">Email</th>
                          <th style="padding:12px;border:1px solid #d1d5db;text-align:left;color:#4b5563;font-size:13px;font-weight:600;">Intern ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${studentListHtml}
                      </tbody>
                    </table>

                    <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#1e40af;font-size:13px;line-height:1.6;"><strong>Action Required:</strong> Login to your Trainer Panel to view complete student details and start mentoring.</p>
                    </div>

                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Regards,<br><strong>Team Progrentures</strong></p>
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

    await transporter.sendMail(mailOptions);
    console.log(`? Trainer assignment email sent to ${trainerEmail}`);
    return { success: true };
  } catch (error) {
    console.error('? Trainer assignment email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send student assignment notification
exports.sendStudentAssignmentNotification = async ({
  studentName,
  studentEmail,
  trainerName,
  trainerEmail,
  trainerMobile
}) => {
  try {
    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: 'Trainer Assignment - Your Mentor Details - Progrentures',
      text: `
Dear ${studentName},

Greetings from Team Progrentures.

You have been assigned a dedicated trainer/mentor for your internship journey.

Trainer Details:
Name: ${trainerName}
Email: ${trainerEmail}
Mobile: ${trainerMobile || 'N/A'}

Please feel free to reach out to your trainer for guidance and support.

Best regards,
Team Progrentures
      `,
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#111827;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Progrentures</p>
                    <p style="margin:6px 0 0;color:#d1d5db;font-size:13px;">Trainer Assignment</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#111827;font-size:22px;line-height:1.35;">Trainer Assigned</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">Dear ${studentName},</p>
                    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">Great news! You have been assigned a dedicated trainer/mentor for your internship journey. Here are their contact details.</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-collapse:collapse;margin:0 0 20px;">
                      <tr>
                        <td style="width:140px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Trainer Name</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:15px;font-weight:700;">${trainerName}</td>
                      </tr>
                      <tr>
                        <td style="width:140px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Email</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#0078d4;font-size:14px;word-break:break-all;">${trainerEmail}</td>
                      </tr>
                      <tr>
                        <td style="width:140px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Mobile</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:15px;font-weight:700;">${trainerMobile || 'N/A'}</td>
                      </tr>
                    </table>

                    <div style="background:#ecfdf5;border:1px solid #bbf7d0;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#166534;font-size:13px;line-height:1.6;"><strong>Next Steps:</strong> Reach out to your trainer to introduce yourself and understand your training plan.</p>
                    </div>

                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Regards,<br><strong>Team Progrentures</strong></p>
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

    await transporter.sendMail(mailOptions);
    console.log(`? Student assignment email sent to ${studentEmail}`);
    return { success: true };
  } catch (error) {
    console.error('? Student assignment email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Interview Result Email
exports.sendInterviewResultEmail = async ({
  studentName,
  studentEmail,
  trainerName,
  interviewType,
  attemptNumber,
  communicationLevel,
  confidenceLevel,
  clarityLevel,
  overallLevel,
  levelCrossed,
  remarks
}) => {
  try {
    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `Interview Result - ${interviewType} (Attempt ${attemptNumber}) - Progrentures`,
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#1e40af;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Interview Results</p>
                    <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Progrentures Assessment</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#1e40af;font-size:22px;line-height:1.35;">Interview Result: ${interviewType}</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">Dear ${studentName},</p>
                    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">Your interview has been evaluated by ${trainerName}. Please find your detailed feedback below.</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-collapse:collapse;margin:0 0 20px;">
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Interview Type</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;">${interviewType}</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Attempt Number</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;">${attemptNumber}</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Communication Level</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;font-weight:600;">${communicationLevel}/10</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Confidence Level</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;font-weight:600;">${confidenceLevel}/10</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Clarity Level</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;font-weight:600;">${clarityLevel}/10</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Overall Level</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;font-weight:600;">${overallLevel}/10</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Level Crossed</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;font-weight:700;">${levelCrossed ? '✓ YES' : '✗ NO'}</td>
                      </tr>
                    </table>

                    ${remarks ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#166534;font-size:13px;line-height:1.6;"><strong>Trainer's Remarks:</strong> ${remarks}</p>
                    </div>` : ''}

                    <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#1e40af;font-size:13px;line-height:1.6;"><strong>Next Steps:</strong> Review the feedback and prepare for your next interview round.</p>
                    </div>

                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Regards,<br><strong>Progrentures Training Team</strong></p>
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

    await transporter.sendMail(mailOptions);
    console.log(`✅ Interview result email sent to ${studentEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Interview result email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Aptitude Test Result Email
exports.sendAptitudeResultEmail = async ({
  studentName,
  studentEmail,
  trainerName,
  roundNumber,
  score,
  result,
  remarks
}) => {
  try {
    const statusColor = result === 'pass' ? '#15803d' : '#dc2626';
    const statusBg = result === 'pass' ? '#dcfce7' : '#fee2e2';
    const resultText = result === 'pass' ? 'PASSED' : 'RESULTS PENDING';

    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `Aptitude Test Result - Round ${roundNumber} - Progrentures`,
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#7c3aed;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Aptitude Test Results</p>
                    <p style="margin:6px 0 0;color:#ede9fe;font-size:13px;">Progrentures Assessment</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#7c3aed;font-size:22px;line-height:1.35;">Aptitude Test - Round ${roundNumber}</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">Dear ${studentName},</p>
                    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">Your aptitude test has been evaluated. Here are your results.</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-collapse:collapse;margin:0 0 20px;">
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Round Number</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;">${roundNumber}</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Score</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;font-weight:700;font-size:16px;">${score}/100</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Status</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;">
                          <span style="display:inline-block;padding:4px 12px;background:${statusBg};color:${statusColor};border-radius:6px;font-size:12px;font-weight:700;">${resultText}</span>
                        </td>
                      </tr>
                    </table>

                    ${remarks ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#166534;font-size:13px;line-height:1.6;"><strong>Trainer's Remarks:</strong> ${remarks}</p>
                    </div>` : ''}

                    <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#1e40af;font-size:13px;line-height:1.6;"><strong>Feedback:</strong> Continue practicing aptitude problems to improve your speed and accuracy.</p>
                    </div>

                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Regards,<br><strong>Progrentures Training Team</strong></p>
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

    await transporter.sendMail(mailOptions);
    console.log(`✅ Aptitude result email sent to ${studentEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Aptitude result email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Assessment Result Email
exports.sendAssessmentResultEmail = async ({
  studentName,
  studentEmail,
  trainerName,
  assessmentType,
  score,
  status,
  feedback
}) => {
  try {
    const statusColor = status === 'pass' ? '#15803d' : '#dc2626';
    const statusBg = status === 'pass' ? '#dcfce7' : '#fee2e2';
    const statusText = status === 'pass' ? 'PASSED' : 'NEEDS IMPROVEMENT';

    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `Assessment Result - ${assessmentType} - Progrentures`,
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#2563eb;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Assessment Results</p>
                    <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Progrentures Evaluation</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#2563eb;font-size:22px;line-height:1.35;">Assessment: ${assessmentType}</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">Dear ${studentName},</p>
                    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">Your assessment has been completed and evaluated. Please review your results below.</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-collapse:collapse;margin:0 0 20px;">
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Assessment Type</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;">${assessmentType}</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Score</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;font-weight:700;font-size:16px;">${score}%</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Status</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;">
                          <span style="display:inline-block;padding:4px 12px;background:${statusBg};color:${statusColor};border-radius:6px;font-size:12px;font-weight:700;">${statusText}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Evaluated By</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;">${trainerName}</td>
                      </tr>
                    </table>

                    ${feedback ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#166534;font-size:13px;line-height:1.6;"><strong>Feedback:</strong> ${feedback}</p>
                    </div>` : ''}

                    <div style="background:#fef3c7;border:1px solid #fcd34d;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;"><strong>Note:</strong> Your trainer will review your progress and provide guidance for improvement.</p>
                    </div>

                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Regards,<br><strong>Progrentures Training Team</strong></p>
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

    await transporter.sendMail(mailOptions);
    console.log(`✅ Assessment result email sent to ${studentEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Assessment result email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Training Session Result Email
exports.sendTrainingResultEmail = async ({
  studentName,
  studentEmail,
  trainerName,
  date,
  attendance,
  engagementLevel,
  skillImprovementNote,
  trainerRemarks
}) => {
  try {
    const attendanceStatus = attendance === 'present' ? 'PRESENT' : 'ABSENT';
    const attendanceColor = attendance === 'present' ? '#15803d' : '#dc2626';
    const attendanceBg = attendance === 'present' ? '#dcfce7' : '#fee2e2';

    const mailOptions = {
      from: `"Team Progrentures" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `Training Session Report - Progrentures`,
      html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:#059669;padding:20px 28px;">
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px;">Training Session Report</p>
                    <p style="margin:6px 0 0;color:#d1fae5;font-size:13px;">Progrentures Training Program</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 16px;color:#059669;font-size:22px;line-height:1.35;">Your Training Session Report</h1>
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">Dear ${studentName},</p>
                    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">Here is your training session report evaluated by ${trainerName}.</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-collapse:collapse;margin:0 0 20px;">
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Session Date</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;">${new Date(date).toLocaleDateString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Attendance</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;">
                          <span style="display:inline-block;padding:4px 12px;background:${attendanceBg};color:${attendanceColor};border-radius:6px;font-size:12px;font-weight:700;">${attendanceStatus}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Engagement Level</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;font-weight:700;">${engagementLevel}/10</td>
                      </tr>
                      <tr>
                        <td style="width:180px;padding:12px 14px;border:1px solid #d1d5db;background:#f9fafb;color:#4b5563;font-size:13px;font-weight:600;">Trainer</td>
                        <td style="padding:12px 14px;border:1px solid #d1d5db;color:#111827;font-size:14px;">${trainerName}</td>
                      </tr>
                    </table>

                    ${skillImprovementNote ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#166534;font-size:13px;line-height:1.6;"><strong>Skill Improvement:</strong> ${skillImprovementNote}</p>
                    </div>` : ''}

                    ${trainerRemarks ? `<div style="background:#fef3c7;border:1px solid #fcd34d;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;"><strong>Trainer's Remarks:</strong> ${trainerRemarks}</p>
                    </div>` : ''}

                    <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:12px 14px;margin:0 0 20px;">
                      <p style="margin:0;color:#1e40af;font-size:13px;line-height:1.6;"><strong>Keep Learning:</strong> Continue to engage actively in training sessions for better skill development.</p>
                    </div>

                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Regards,<br><strong>Progrentures Training Team</strong></p>
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

    await transporter.sendMail(mailOptions);
    console.log(`✅ Training result email sent to ${studentEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Training result email failed:', error.message);
    return { success: false, error: error.message };
  }
};
