import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function Certificates() {
  const [students, setStudents] = useState([]);
  const [category, setCategory] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [documentType, setDocumentType] = useState('offerLetter');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await adminAPI.getAllInterns();
      if (response.data.success) {
        setStudents(response.data.interns);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type (PDF, DOC, DOCX, JPG, PNG)
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.');
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB.');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      setError('Please select a student.');
      return;
    }

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      // multer on backend expects field name 'file'
      formData.append('file', file);
      formData.append('documentType', documentType);

      // Upload using studentId route param
      const response = await adminAPI.uploadStudentDocument(selectedStudent, formData);
      
      if (response.data.success) {
        setMessage('Certificate uploaded successfully!');
        setFile(null);
        setSelectedStudent('');
        // Reset file input
        const inp = document.getElementById('fileInput');
        if (inp) inp.value = '';
        // Refresh students list to reflect uploaded doc
        fetchStudents();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1>Certificates Management</h1>
        <p>Upload and manage student certificates and documents</p>
      </div>

      {/* Upload Form */}
      <div className="card">
        <h3>Upload Certificate/Document</h3>
        
        {error && (
          <div className="error-message" style={{ marginTop: '15px' }}>
            {error}
          </div>
        )}
        
        {message && (
          <div className="success-message" style={{ marginTop: '15px' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpload} style={{ marginTop: '20px' }}>
          {/* Category */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: '0 0 200px' }}>
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="All">All</option>
                <option value="Internship">Internship</option>
                <option value="SMS Program">SMS Program</option>
              </select>
            </div>
          </div>
          {/* Student Selection */}
          <div className="form-group">
            <label>Select Student *</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="">Choose a student...</option>
              {students
                .filter(s => (category === 'All' || s.studentType === category))
                .map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.internId} - {student.name} ({student.email})
                  </option>
                ))}
            </select>
          </div>

          {/* Document Type */}
          <div className="form-group">
            <label>Document Type *</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="offerLetter">Offer Letter</option>
              <option value="welcomeLetter">Welcome Letter</option>
              <option value="paymentReceipt">Payment Receipt</option>
              <option value="otherCertificates">Other Certificates</option>
            </select>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label>Select File *</label>
            <input
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max size: 5MB)
            </small>
          </div>

          {/* Upload Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#ccc' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            {loading ? 'Uploading...' : 'Upload Certificate'}
          </button>
        </form>
      </div>

      {/* Student Documents Overview */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Recent Uploads</h3>
        <p style={{ color: '#666', marginTop: '10px' }}>
          View and manage uploaded certificates for all students.
        </p>
        <div style={{ marginTop: '20px', padding: '20px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>
            📋 Document management features coming soon!
          </p>
        </div>
      </div>
    </>
  );
}

export default Certificates;
