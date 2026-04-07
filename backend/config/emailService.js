const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const pickEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
};

const smtpHost = pickEnv('SMTP_HOST', 'EMAIL_HOST', 'MAIL_HOST') || 'smtp.gmail.com';
const smtpPort = Number(pickEnv('SMTP_PORT', 'EMAIL_PORT', 'MAIL_PORT') || 587);
const smtpSecure = String(pickEnv('SMTP_SECURE', 'EMAIL_SECURE', 'MAIL_SECURE') || 'false').toLowerCase() === 'true';
const smtpPoolEnabled = String(
  pickEnv('SMTP_POOL', 'EMAIL_POOL', 'MAIL_POOL')
  || (process.env.NODE_ENV === 'production' ? 'false' : 'true')
).toLowerCase() !== 'false';
const smtpMaxConnections = Number(pickEnv('SMTP_MAX_CONNECTIONS', 'EMAIL_MAX_CONNECTIONS') || 5);
const smtpMaxMessages = Number(pickEnv('SMTP_MAX_MESSAGES', 'EMAIL_MAX_MESSAGES') || 100);
const smtpConnectionTimeout = Number(pickEnv('SMTP_CONNECTION_TIMEOUT', 'EMAIL_CONNECTION_TIMEOUT') || 30000);
const smtpGreetingTimeout = Number(pickEnv('SMTP_GREETING_TIMEOUT', 'EMAIL_GREETING_TIMEOUT') || 30000);
const smtpSocketTimeout = Number(pickEnv('SMTP_SOCKET_TIMEOUT', 'EMAIL_SOCKET_TIMEOUT') || 60000);
const smtpVerifyOnStartup = String(pickEnv('SMTP_VERIFY_ON_STARTUP', 'EMAIL_VERIFY_ON_STARTUP') || (process.env.NODE_ENV === 'production' ? 'false' : 'true')).toLowerCase() === 'true';
const smtpAltPorts = pickEnv('SMTP_ALT_PORTS', 'EMAIL_ALT_PORTS')
  .split(',')
  .map((value) => Number(String(value).trim()))
  .filter((value) => Number.isFinite(value) && value > 0);
const smtpTlsServername = pickEnv('SMTP_TLS_SERVERNAME', 'EMAIL_TLS_SERVERNAME') || smtpHost;
const emailMaxRetries = Number(pickEnv('EMAIL_MAX_RETRIES', 'SMTP_MAX_RETRIES') || 2);
const emailRetryDelayMs = Number(pickEnv('EMAIL_RETRY_DELAY_MS', 'SMTP_RETRY_DELAY_MS') || 1500);
const PRS_LOGIN_URL = 'https://prs-protal.vercel.app/';
const PRS_COMPANY_NAME = 'Progrentures™ Solution Pvt. Ltd.';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildEmailShell = ({
  title,
  subtitle = 'PRS Portal',
  intro = [],
  detailRows = [],
  noticeBlocks = [],
  bodyHtml = '',
  closing = `Regards,<br><strong>${PRS_COMPANY_NAME}</strong>`,
  footerNote = 'This is an automated service email. Please do not reply to this message.',
}) => {
  const introHtml = intro.map((item) => `<p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.75;">${item}</p>`).join('');
  const rowsHtml = detailRows.length > 0
    ? `<div style="margin:0 0 16px;">${detailRows.map(({ label, value }) => `<p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.75;"><strong>${label}:</strong> ${value}</p>`).join('')}</div>`
    : '';
  const noticesHtml = noticeBlocks.map((block) => `<p style="margin:0 0 10px;color:#374151;font-size:14px;line-height:1.75;">${block.html}</p>`).join('');

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.75;max-width:640px;margin:0 auto;padding:20px;">
      <p style="margin:0 0 4px;color:#111827;font-size:18px;font-weight:700;">${PRS_COMPANY_NAME}</p>
      <p style="margin:0 0 14px;color:#6b7280;font-size:13px;">${subtitle}</p>
      <h1 style="margin:0 0 16px;color:#111827;font-size:22px;line-height:1.35;">${title}</h1>
      ${introHtml}
      ${rowsHtml}
      ${noticesHtml}
      ${bodyHtml}
      <p style="margin:16px 0 0;color:#374151;font-size:14px;line-height:1.75;">${closing}</p>
      <p style="margin:18px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">${footerNote}</p>
    </div>
  `;
};

const emailAuth = {
  user: pickEnv('EMAIL_USER', 'SMTP_USER', 'MAIL_USER'),
  pass: pickEnv('EMAIL_PASS', 'SMTP_PASS', 'EMAIL_PASSWORD', 'SMTP_PASSWORD', 'MAIL_PASS', 'MAIL_PASSWORD').replace(/\s/g, '')
};

const createTransporter = ({ host, port, secure, pool }) => nodemailer.createTransport({
  host,
  port,
  secure,
  pool,
  maxConnections: smtpMaxConnections,
  maxMessages: smtpMaxMessages,
  connectionTimeout: smtpConnectionTimeout,
  greetingTimeout: smtpGreetingTimeout,
  socketTimeout: smtpSocketTimeout,
  auth: emailAuth,
  tls: {
    servername: smtpTlsServername,
    rejectUnauthorized: false
  }
});

const transportConfigCandidates = [];
const registerTransportConfig = ({ port, secure, pool }) => {
  if (!Number.isFinite(port) || port <= 0) return;
  const key = `${port}-${secure ? 'secure' : 'starttls'}`;
  if (transportConfigCandidates.some((item) => item.key === key)) return;
  transportConfigCandidates.push({
    key,
    host: smtpHost,
    port,
    secure,
    pool
  });
};

registerTransportConfig({
  port: smtpPort,
  secure: smtpSecure,
  pool: smtpPoolEnabled
});

registerTransportConfig({
  port: smtpPort === 465 ? 587 : 465,
  secure: !smtpSecure,
  pool: false
});

for (const altPort of smtpAltPorts) {
  registerTransportConfig({
    port: altPort,
    secure: altPort === 465,
    pool: false
  });
}

const transporterCandidates = transportConfigCandidates.map((config) => createTransporter(config));

// Log email configuration status
if (emailAuth.user && emailAuth.pass) {
  console.log('📧 Email service configured for:', emailAuth.user, `via ${smtpHost}:${smtpPort}`);
  console.log(`📧 SMTP pool: ${smtpPoolEnabled ? 'enabled' : 'disabled'} | maxConnections=${smtpMaxConnections} | retries=${emailMaxRetries}`);
  console.log(`📧 SMTP verify on startup: ${smtpVerifyOnStartup ? 'enabled' : 'disabled'}`);
  console.log(`📧 SMTP candidates: ${transportConfigCandidates.map((item) => `${item.host}:${item.port} secure=${item.secure}`).join(' | ')}`);
} else {
  console.log('⚠️ Email credentials not configured in .env file');
  console.log('   EMAIL_USER/SMTP_USER:', emailAuth.user ? 'SET' : 'MISSING');
  console.log('   EMAIL_PASS/SMTP_PASS:', emailAuth.pass ? 'SET' : 'MISSING');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableEmailError = (error) => {
  if (!error) return false;
  const retryableCodes = new Set([
    'ETIMEDOUT',
    'ECONNECTION',
    'ECONNRESET',
    'EAI_AGAIN',
    'ESOCKET',
    'EMESSAGE'
  ]);

  if (retryableCodes.has(error.code)) return true;

  const smtpResponseCode = Number(error.responseCode);
  return Number.isFinite(smtpResponseCode) && smtpResponseCode >= 400 && smtpResponseCode < 500;
};

const sendMailWithRetry = async (mailOptions) => {
  let lastError;

  for (let attempt = 1; attempt <= emailMaxRetries + 1; attempt++) {
    for (let transporterIndex = 0; transporterIndex < transporterCandidates.length; transporterIndex++) {
      const activeTransporter = transporterCandidates[transporterIndex];
      try {
        return await activeTransporter.sendMail(mailOptions);
      } catch (error) {
        lastError = error;
        const retryable = isRetryableEmailError(error);
        const isLastTransporter = transporterIndex === transporterCandidates.length - 1;

        console.error(
          `❌ Email send attempt ${attempt} via transport ${transporterIndex + 1}/${transporterCandidates.length} failed for ${mailOptions?.to}:`,
          error.message,
          `(Code: ${error.code}, ResponseCode: ${error.responseCode})`
        );

        if (!retryable || !isLastTransporter) {
          continue;
        }
      }
    }

    const hasNextAttempt = attempt <= emailMaxRetries;
    if (!hasNextAttempt) {
      throw lastError;
    }

    const delayMs = emailRetryDelayMs * attempt;
    console.log(`⏳ Retrying email to ${mailOptions?.to} in ${delayMs}ms...`);
    await sleep(delayMs);
  }

  throw lastError;
};

if (emailAuth.user && emailAuth.pass) {
  if (smtpVerifyOnStartup) {
    transporterCandidates.forEach((candidate, index) => {
      const transportMeta = transportConfigCandidates[index];
      candidate.verify((error) => {
        if (error) {
          console.error(`❌ SMTP verify failed for transport ${index + 1} (${transportMeta.host}:${transportMeta.port}, secure=${transportMeta.secure}):`, error.message);
          return;
        }
        console.log(`✅ SMTP transport ${index + 1} (${transportMeta.host}:${transportMeta.port}, secure=${transportMeta.secure}) is ready to accept emails`);
      });
    });
  } else {
    console.log('ℹ️ SMTP verify on startup is disabled');
  }
}

// Send welcome email to new intern
exports.sendInternCredentials = async (internName, internEmail, internId, password) => {
  try {
    console.log(`🚀 [sendInternCredentials] Starting email send to ${internEmail} for intern ${internId}`);
    const mailOptions = {
      from: `"${PRS_COMPANY_NAME}" <${emailAuth.user}>`,
      to: internEmail,
      subject: 'Your PRS Account Credentials – PRS Portal',
      text: `Dear ${internName},

Welcome to ${PRS_COMPANY_NAME}.

Your account has been created successfully.

User ID: ${internId}
Temporary Password: ${password}
Login Here: ${PRS_LOGIN_URL}

Security Notice: Keep your credentials confidential and update your password after your first login.

Next Step: After logging in, please explore your dashboard and access your assigned program details, certifications, and resources.
      `.trim(),
      html: buildEmailShell({
        subtitle: 'Internship Account Credentials',
        title: 'Your PRS Account Credentials – PRS Portal',
        intro: [
          `Dear ${escapeHtml(internName)},`,
          'This is to inform you that your account has been successfully created.',
          'You can now log in to your dashboard using the credentials below:',
        ],
        detailRows: [
          { label: 'User ID', value: escapeHtml(internId) },
          { label: 'Temporary Password', value: escapeHtml(password) },
          { label: 'Login Here', value: `<a href="${PRS_LOGIN_URL}" style="color:#2563eb;text-decoration:none;">${PRS_LOGIN_URL}</a>` },
        ],
        noticeBlocks: [
          { background: '#eff6ff', border: '#bfdbfe', color: '#1e40af', html: '<strong>Security Notice:</strong> Keep your credentials confidential and update your password after your first login.' },
          { background: '#f0fdf4', border: '#bbf7d0', color: '#166534', html: 'Next Step: After logging in, please explore your dashboard and access your assigned program details, certifications, and resources.' },
        ],
      })
    };

    await sendMailWithRetry(mailOptions);
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
    console.log(`🚀 [sendRepresentativeCredentials] Starting email send to ${repEmail}`);
    const mailOptions = {
      from: `"${PRS_COMPANY_NAME}" <${emailAuth.user}>`,
      to: repEmail,
      subject: 'Your PRS Account Credentials – PRS Portal',
      text: `Dear ${repName},

This is to inform you that your account has been successfully created.

User ID: ${repEmail}
Temporary Password: ${password}
Login Here: ${PRS_LOGIN_URL}

Security Notice: Keep your credentials confidential and update your password after your first login.

Next Step: After logging in, please explore your dashboard and access your assigned program details, certifications, and resources.
      `.trim(),
      html: buildEmailShell({
        subtitle: 'Representative Account Credentials',
        title: 'Your PRS Account Credentials – PRS Portal',
        intro: [
          `Dear ${escapeHtml(repName)},`,
          'This is to inform you that your account has been successfully created.',
          'You can now log in to your dashboard using the credentials below:',
        ],
        detailRows: [
          { label: 'User ID', value: escapeHtml(repEmail) },
          { label: 'Temporary Password', value: escapeHtml(password) },
          { label: 'Login Here', value: `<a href="${PRS_LOGIN_URL}" style="color:#2563eb;text-decoration:none;">${PRS_LOGIN_URL}</a>` },
        ],
        noticeBlocks: [
          { background: '#eff6ff', border: '#bfdbfe', color: '#1e40af', html: '<strong>Security Notice:</strong> Keep your credentials confidential and update your password after your first login.' },
          { background: '#f0fdf4', border: '#bbf7d0', color: '#166534', html: 'Next Step: After logging in, please explore your dashboard and access your assigned program details, certifications, and resources.' },
        ],
      })
    };

    await sendMailWithRetry(mailOptions);
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
    console.log(`🚀 [sendTrainerCredentials] Starting email send to ${trainerEmail}`);
    const mailOptions = {
      from: `"${PRS_COMPANY_NAME}" <${emailAuth.user}>`,
      to: trainerEmail,
      subject: 'Your PRS Account Credentials – PRS Portal',
      text: `Dear ${trainerName},

This is to inform you that your account has been successfully created.

User ID: ${trainerEmail}
Temporary Password: ${password}
Login Here: ${PRS_LOGIN_URL}

Security Notice: Keep your credentials confidential and update your password after your first login.

Next Step: After logging in, please explore your dashboard and access your assigned program details, certifications, and resources.
      `.trim(),
      html: buildEmailShell({
        subtitle: 'Trainer Account Credentials',
        title: 'Your PRS Account Credentials – PRS Portal',
        intro: [
          `Dear ${escapeHtml(trainerName)},`,
          'This is to inform you that your account has been successfully created.',
          'You can now log in to your dashboard using the credentials below:',
        ],
        detailRows: [
          { label: 'User ID', value: escapeHtml(trainerEmail) },
          { label: 'Temporary Password', value: escapeHtml(password) },
          { label: 'Login Here', value: `<a href="${PRS_LOGIN_URL}" style="color:#2563eb;text-decoration:none;">${PRS_LOGIN_URL}</a>` },
        ],
        noticeBlocks: [
          { background: '#eff6ff', border: '#bfdbfe', color: '#1e40af', html: '<strong>Security Notice:</strong> Keep your credentials confidential and update your password after your first login.' },
          { background: '#f0fdf4', border: '#bbf7d0', color: '#166534', html: 'Next Step: After logging in, please explore your dashboard and access your assigned program details, certifications, and resources.' },
        ],
      })
    };

    await sendMailWithRetry(mailOptions);
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

    const attachments = Array.isArray(certificateFiles)
      ? certificateFiles
          .filter((file) => file && file.filepath && file.filename)
          .map((file) => ({
            filename: file.filename,
            path: path.resolve(file.filepath),
            contentDisposition: 'attachment'
          }))
      : [];

    const mailOptions = {
      from: `"Team Progrentures" <${emailAuth.user}>`,
      to: internEmail,
      subject: 'Certificate Assignment Notice – PRS Portal',
      text: `Dear ${internName},

This is to inform you that certificate(s) have been assigned to your account.

Assigned Certificates:
${namesListText}

Please login to your dashboard and open the Certificates section to view and download your certificates.
${formattedExpiry ? `\nNote: Access may expire on ${formattedExpiry}.` : ''}
      `.trim(),
      attachments,
      html: buildEmailShell({
        subtitle: 'Certificate Assignment Notice',
        title: 'Your Certificates Are Ready – PRS Portal',
        intro: [
          `Dear ${escapeHtml(internName)},`,
          'This is to inform you that certificate(s) have been assigned to your account.',
        ],
        bodyHtml: `
          <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.75;"><strong>Assigned Certificates:</strong></p>
          ${certificateNames.length > 0 ? certificateNames.map((name, index) => `<p style="margin:0 0 6px;color:#374151;font-size:14px;line-height:1.75;">${index + 1}. ${escapeHtml(name)}</p>`).join('') : '<p style="margin:0 0 6px;color:#374151;font-size:14px;line-height:1.75;">Your assigned certificate(s) are now available in your account.</p>'}
        `,
        noticeBlocks: [
          { background: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', html: `<strong>Action Required:</strong> Please login and open the Certificates section to view and download your certificates.${certificateFiles.length > 0 ? ' The assigned certificate file(s) are also attached with this email for direct download.' : ''}` },
          formattedExpiry ? { background: '#fff7ed', border: '#fed7aa', color: '#9a3412', html: `<strong>Note:</strong> Access may expire on ${formattedExpiry}.` } : null,
        ].filter(Boolean),
      })
    };

    try {
      await sendMailWithRetry(mailOptions);
    } catch (error) {
      if (attachments.length === 0) {
        throw error;
      }

      console.error(
        `⚠️ Certificate assignment email with attachments failed for ${internEmail}, retrying without attachments:`,
        error.message
      );

      await sendMailWithRetry({
        ...mailOptions,
        attachments: []
      });
    }

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
      from: `"Team Progrentures" <${emailAuth.user}>`,
      to: internEmail,
      subject: 'New Task Assignment – PRS Portal',
      text: `Dear ${internName},

You have been assigned a new internship task.

Task Title: ${taskTitle}
Description: ${taskDescription}
Deadline: ${formattedDeadline}
Task Type: ${isTeamTask ? 'Team Task' : 'Individual Task'}

${isTeamTask ? `Team Members:\n${teamListText}\n` : ''}

Please sign in to your dashboard to review details and update progress.
${taskDocument ? '\nThe task PDF/document has been attached to this email.' : ''}
      `.trim(),
      attachments: taskDocument ? [{
        filename: taskDocument.filename,
        path: path.resolve(taskDocument.filepath),
        contentDisposition: 'attachment'
      }] : [],
      html: buildEmailShell({
        subtitle: 'Task Assignment',
        title: 'New Task Assignment – PRS Portal',
        intro: [
          `Dear ${escapeHtml(internName)},`,
          'You have been assigned a new internship task.',
        ],
        detailRows: [
          { label: 'Task Title', value: escapeHtml(taskTitle) },
          { label: 'Description', value: escapeHtml(taskDescription) },
          { label: 'Deadline', value: escapeHtml(formattedDeadline) },
          { label: 'Task Type', value: escapeHtml(isTeamTask ? 'Team Task' : 'Individual Task') },
        ],
        bodyHtml: isTeamTask ? `
          <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.75;"><strong>Team Members:</strong></p>
          ${teamMembers.length > 0 ? teamMembers.map((member, index) => `<p style="margin:0 0 6px;color:#374151;font-size:14px;line-height:1.75;">${index + 1}. ${escapeHtml(member.name)}${member.internId ? ` (${escapeHtml(member.internId)})` : ''}</p>`).join('') : '<p style="margin:0 0 6px;color:#374151;font-size:14px;line-height:1.75;">No additional team members listed.</p>'}
        ` : '',
        noticeBlocks: [
          { background: '#ecfdf5', border: '#a7f3d0', color: '#065f46', html: '<strong>Action Required:</strong> Please sign in to your dashboard and update progress regularly.' },
          taskDocument ? { background: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', html: '<strong>Attachment:</strong> Task PDF/document is attached with this email.' } : null,
        ].filter(Boolean),
      })
    };

    await sendMailWithRetry(mailOptions);
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
    console.log(`🚀 [sendEmail] Starting email send to ${to}`);
    const mailOptions = {
      from: `"Team Progrentures" <${emailAuth.user}>`,
      to,
      subject,
      html: buildEmailShell({
        title: subject,
        subtitle: 'PRS Portal Notification',
        bodyHtml: html,
      })
    };

    await sendMailWithRetry(mailOptions);
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
      from: `"Team Progrentures" <${emailAuth.user}>`,
      to: trainerEmail,
      subject: 'Students Assigned to You – PRS Portal',
      text: `Dear ${trainerName},

This is to inform you that ${studentsList.length} student(s) have been assigned to you for mentoring and training.

Please login to your Trainer Portal to view complete student details and start mentoring.
      `.trim(),
      html: buildEmailShell({
        subtitle: 'Trainer Assignment',
        title: 'Students Assigned to You – PRS Portal',
        intro: [
          `Dear ${escapeHtml(trainerName)},`,
          `This is to inform you that ${studentsList.length} student(s) have been assigned to you for mentoring and training.`,
        ],
        detailRows: [],
        bodyHtml: studentsList.length > 0 ? `<p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.75;"><strong>Student Details:</strong></p>${studentsList.map((student, index) => `<p style="margin:0 0 6px;color:#374151;font-size:14px;line-height:1.75;">${index + 1}. ${escapeHtml(student.name || 'N/A')}${student.internId ? ` (${escapeHtml(student.internId)})` : ''}${student.email ? ` - ${escapeHtml(student.email)}` : ''}</p>`).join('')}` : '<p style="margin:0 0 6px;color:#374151;font-size:14px;line-height:1.75;">No student details available.</p>',
        noticeBlocks: [
          { background: '#eff6ff', border: '#bfdbfe', color: '#1e40af', html: '<strong>Action Required:</strong> Login to your Trainer Portal to view complete student details and start mentoring.' },
        ],
      })
    };

    await sendMailWithRetry(mailOptions);
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
      from: `"Team Progrentures" <${emailAuth.user}>`,
      to: studentEmail,
      subject: 'Trainer Assignment – PRS Portal',
      text: `Dear ${studentName},

You have been assigned a dedicated trainer/mentor for your internship journey.

Trainer Details:
Name: ${trainerName}
Email: ${trainerEmail}
Mobile: ${trainerMobile || 'N/A'}

Next Step: Reach out to your trainer to introduce yourself and understand your training plan.
      `.trim(),
      html: buildEmailShell({
        subtitle: 'Trainer Assignment',
        title: 'Your Trainer Has Been Assigned – PRS Portal',
        intro: [
          `Dear ${escapeHtml(studentName)},`,
          'You have been assigned a dedicated trainer/mentor for your internship journey.',
        ],
        detailRows: [
          { label: 'Trainer Name', value: escapeHtml(trainerName) },
          { label: 'Email', value: escapeHtml(trainerEmail) },
          { label: 'Mobile', value: escapeHtml(trainerMobile || 'N/A') },
        ],
        noticeBlocks: [
          { background: '#ecfdf5', border: '#bbf7d0', color: '#166534', html: '<strong>Next Steps:</strong> Reach out to your trainer to introduce yourself and understand your training plan.' },
        ],
      })
    };

    await sendMailWithRetry(mailOptions);
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
    const levelSummary = [
      { label: 'Interview Type', value: interviewType },
      { label: 'Attempt Number', value: attemptNumber },
      { label: 'Communication Level', value: `${communicationLevel}/10` },
      { label: 'Confidence Level', value: `${confidenceLevel}/10` },
      { label: 'Clarity Level', value: `${clarityLevel}/10` },
      { label: 'Overall Level', value: `${overallLevel}/10` },
      { label: 'Level Crossed', value: levelCrossed ? 'YES' : 'NO' },
    ];

    const mailOptions = {
      from: `"Team Progrentures" <${emailAuth.user}>`,
      to: studentEmail,
      subject: `Interview Result - ${interviewType} (Attempt ${attemptNumber}) - PRS Portal`,
      html: buildEmailShell({
        subtitle: 'Interview Results',
        title: `Interview Result: ${interviewType} – PRS Portal`,
        intro: [
          `Dear ${escapeHtml(studentName)},`,
          `Your interview has been evaluated by ${escapeHtml(trainerName)}. Please find your detailed feedback below.`,
        ],
        detailRows: levelSummary.map((item) => ({ label: item.label, value: escapeHtml(item.value) })),
        noticeBlocks: [
          remarks ? { background: '#f0fdf4', border: '#bbf7d0', color: '#166534', html: `<strong>Trainer's Remarks:</strong> ${escapeHtml(remarks)}` } : null,
          { background: '#eff6ff', border: '#bfdbfe', color: '#1e40af', html: '<strong>Next Steps:</strong> Review the feedback and prepare for your next interview round.' },
        ].filter(Boolean),
      })
    };

    await sendMailWithRetry(mailOptions);
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
      from: `"Team Progrentures" <${emailAuth.user}>`,
      to: studentEmail,
      subject: `Aptitude Test Result - Round ${roundNumber} - PRS Portal`,
      html: buildEmailShell({
        subtitle: 'Aptitude Test Results',
        title: `Aptitude Test - Round ${roundNumber} – PRS Portal`,
        intro: [
          `Dear ${escapeHtml(studentName)},`,
          'Your aptitude test has been evaluated. Here are your results.',
        ],
        detailRows: [
          { label: 'Round Number', value: escapeHtml(roundNumber) },
          { label: 'Score', value: `${escapeHtml(score)}/100` },
          { label: 'Status', value: `<span style="display:inline-block;padding:4px 12px;background:${statusBg};color:${statusColor};border-radius:6px;font-size:12px;font-weight:700;">${resultText}</span>` },
        ],
        noticeBlocks: [
          remarks ? { background: '#f0fdf4', border: '#bbf7d0', color: '#166534', html: `<strong>Trainer's Remarks:</strong> ${escapeHtml(remarks)}` } : null,
          { background: '#eff6ff', border: '#bfdbfe', color: '#1e40af', html: '<strong>Feedback:</strong> Continue practicing aptitude problems to improve your speed and accuracy.' },
        ].filter(Boolean),
      })
    };

    await sendMailWithRetry(mailOptions);
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
      from: `"Team Progrentures" <${emailAuth.user}>`,
      to: studentEmail,
      subject: `Assessment Result - ${assessmentType} - PRS Portal`,
      html: buildEmailShell({
        subtitle: 'Assessment Results',
        title: `Assessment: ${assessmentType} – PRS Portal`,
        intro: [
          `Dear ${escapeHtml(studentName)},`,
          'Your assessment has been completed and evaluated. Please review your results below.',
        ],
        detailRows: [
          { label: 'Assessment Type', value: escapeHtml(assessmentType) },
          { label: 'Score', value: `${escapeHtml(score)}%` },
          { label: 'Status', value: `<span style="display:inline-block;padding:4px 12px;background:${statusBg};color:${statusColor};border-radius:6px;font-size:12px;font-weight:700;">${statusText}</span>` },
          { label: 'Evaluated By', value: escapeHtml(trainerName) },
        ],
        noticeBlocks: [
          feedback ? { background: '#f0fdf4', border: '#bbf7d0', color: '#166534', html: `<strong>Feedback:</strong> ${escapeHtml(feedback)}` } : null,
          { background: '#fef3c7', border: '#fcd34d', color: '#92400e', html: '<strong>Note:</strong> Your trainer will review your progress and provide guidance for improvement.' },
        ].filter(Boolean),
      })
    };

    await sendMailWithRetry(mailOptions);
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
      subject: `Training Session Report - PRS Portal`,
      html: buildEmailShell({
        subtitle: 'Training Session Report',
        title: 'Your Training Session Report – PRS Portal',
        intro: [
          `Dear ${escapeHtml(studentName)},`,
          `Here is your training session report evaluated by ${escapeHtml(trainerName)}.`,
        ],
        detailRows: [
          { label: 'Session Date', value: new Date(date).toLocaleDateString('en-IN') },
          { label: 'Attendance', value: `<span style="display:inline-block;padding:4px 12px;background:${attendanceBg};color:${attendanceColor};border-radius:6px;font-size:12px;font-weight:700;">${attendanceStatus}</span>` },
          { label: 'Engagement Level', value: `${escapeHtml(engagementLevel)}/10` },
          { label: 'Trainer', value: escapeHtml(trainerName) },
        ],
        noticeBlocks: [
          skillImprovementNote ? { background: '#f0fdf4', border: '#bbf7d0', color: '#166534', html: `<strong>Skill Improvement:</strong> ${escapeHtml(skillImprovementNote)}` } : null,
          trainerRemarks ? { background: '#fef3c7', border: '#fcd34d', color: '#92400e', html: `<strong>Trainer's Remarks:</strong> ${escapeHtml(trainerRemarks)}` } : null,
          { background: '#eff6ff', border: '#bfdbfe', color: '#1e40af', html: '<strong>Keep Learning:</strong> Continue to engage actively in training sessions for better skill development.' },
        ].filter(Boolean),
      })
    };

    await sendMailWithRetry(mailOptions);
    console.log(`✅ Training result email sent to ${studentEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Training result email failed:', error.message);
    return { success: false, error: error.message };
  }
};

