const fs = require('fs');
const Certificate = require('../models/Certificate');
const Intern = require('../models/Intern');

const removeFileIfExists = async (filepath) => {
  if (!filepath) return;

  try {
    await fs.promises.access(filepath, fs.constants.F_OK);
    await fs.promises.unlink(filepath);
  } catch (error) {
    // Ignore missing files; rethrow unexpected errors.
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

// Assign multiple certificates to a student (5-day expiry)
const assignCertificates = async (req, res) => {
  try {
    const { studentId } = req.body;
    const files = req.files;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one certificate file' });
    }

    const student = await Intern.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Parse optional per-file names sent as JSON array string
    let names = [];
    try {
      names = JSON.parse(req.body.names || '[]');
    } catch {
      names = [];
    }

    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

    const docs = files.map((f, i) => ({
      studentId,
      name: (names[i] && names[i].trim()) ? names[i].trim() : f.originalname.replace(/\.[^.]+$/, ''),
      filename: f.filename,
      filepath: f.path,
      expiresAt
    }));

    const created = await Certificate.insertMany(docs);

    res.status(201).json({
      success: true,
      message: `${created.length} certificate(s) assigned successfully`,
      certificates: created
    });
  } catch (err) {
    console.error('Assign certificates error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all active (non-expired) assigned certificates
const getCertificates = async (req, res) => {
  try {
    const certs = await Certificate
      .find({ expiresAt: { $gt: new Date() } })
      .populate('studentId', 'name internId email studentType')
      .sort({ createdAt: -1 });

    res.json({ success: true, certificates: certs });
  } catch (err) {
    console.error('Get certificates error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get certificates for a specific student (intern-facing)
const getStudentCertificates = async (req, res) => {
  try {
    const studentId = req.user.id;
    const certs = await Certificate
      .find({ studentId, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 });

    res.json({ success: true, certificates: certs });
  } catch (err) {
    console.error('Get student certificates error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Manually revoke / delete a certificate
const deleteCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Remove file from disk without blocking the event loop.
    await removeFileIfExists(cert.filepath);

    await Certificate.deleteOne({ _id: cert._id });

    res.json({ success: true, message: 'Certificate revoked and deleted' });
  } catch (err) {
    console.error('Delete certificate error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cleanup all expired certificates — called by the server on startup and hourly
const cleanupExpiredCertificates = async () => {
  try {
    const expired = await Certificate.find({ expiresAt: { $lte: new Date() } });

    await Promise.all(
      expired.map((cert) => removeFileIfExists(cert.filepath))
    );

    if (expired.length > 0) {
      await Certificate.deleteMany({ expiresAt: { $lte: new Date() } });
      console.log(`🗑️  Cleaned up ${expired.length} expired certificate(s)`);
    }
  } catch (err) {
    console.error('Certificate cleanup error:', err);
  }
};

module.exports = {
  assignCertificates,
  getCertificates,
  getStudentCertificates,
  deleteCertificate,
  cleanupExpiredCertificates
};
