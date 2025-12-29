import { useState } from 'react';
import { adminAPI } from '../services/api';

function AddIntern({ onInternAdded }) {
  const [studentType, setStudentType] = useState('Internship');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    domain: '',
    joiningDate: '',
    endingDate: '',
    duration: '',
    gender: '',
    paymentDoneBy: '',
    dateOfPayment: '',
    transactionId: '',
    currentDesignation: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = {
        studentType,
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password
      };

      if (studentType === 'Internship') {
        submitData.domain = formData.domain;
        submitData.joiningDate = formData.joiningDate;
        submitData.endingDate = formData.endingDate;
        submitData.duration = formData.duration;
      } else if (studentType === 'SMS Program') {
        submitData.gender = formData.gender;
        submitData.paymentDoneBy = formData.paymentDoneBy;
        submitData.dateOfPayment = formData.dateOfPayment;
        submitData.transactionId = formData.transactionId;
        submitData.currentDesignation = formData.currentDesignation;
      }

      console.log('Submitting student data:', submitData);
      console.log('Token:', localStorage.getItem('token'));
      
      const response = await adminAPI.addIntern(submitData);
      
      if (response.data.success) {
        const intern = response.data.intern;
        const emailSent = response.data.emailSent;
        
        let successMsg = `✅ Student added successfully!\n\nID: ${intern.internId}\nName: ${intern.name}\nEmail: ${intern.email}\nType: ${intern.studentType}`;
        
        if (emailSent) {
          successMsg += `\n\n📧 Login credentials have been sent to ${intern.email}`;
        } else {
          successMsg += `\n\n⚠️ Warning: Email could not be sent. Please share credentials manually.`;
        }
        
        setSuccess(successMsg);
        
        setFormData({
          name: '',
          email: '',
          mobile: '',
          password: '',
          domain: '',
          joiningDate: '',
          endingDate: '',
          duration: '',
          gender: '',
          paymentDoneBy: '',
          dateOfPayment: '',
          transactionId: '',
          currentDesignation: ''
        });

        if (onInternAdded) {
          onInternAdded();
        }
        // If offer letter file selected, upload it and sync
        if (selectedFile) {
          try {
            const fd = new FormData();
            fd.append('file', selectedFile);
            fd.append('documentType', 'offerLetter');
            // server uses route param studentId; pass file as multipart
            const uploadResp = await adminAPI.uploadStudentDocument(intern.id, fd);
            if (uploadResp.data && uploadResp.data.success) {
              setSuccess((s) => s + '\n\n📎 Offer letter uploaded and synced.');
            } else {
              setError('Student added but failed to upload offer letter.');
            }
          } catch (uploadErr) {
            console.error('Upload error:', uploadErr);
            setError('Student added but offer letter upload failed.');
          }
        }
      }
    } catch (err) {
      console.error('Add student error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || 'Failed to add student. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1>Add New Student</h1>
        <p>Register a new student to the system</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <label>Student Type *</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="studentType"
                  value="Internship"
                  checked={studentType === 'Internship'}
                  onChange={(e) => setStudentType(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                Internship
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="studentType"
                  value="SMS Program"
                  checked={studentType === 'SMS Program'}
                  onChange={(e) => setStudentType(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                SMS Program
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter student's full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="form-group">
            <label>Mobile Number *</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Enter mobile number"
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Assign a password"
              required
              minLength="6"
            />
          </div>

          {studentType === 'Internship' && (
            <>
              <div className="form-group">
                <label>Internship Domain *</label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="e.g., Web Development, Data Science"
                  required
                />
              </div>

              <div className="form-group">
                <label>Joining Date *</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ending Date *</label>
                <input
                  type="date"
                  name="endingDate"
                  value={formData.endingDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Duration *</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 3 months, 6 months"
                  required
                />
              </div>

              <div className="form-group">
                <label>Internship Offer Letter (PDF) *</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
                <small>Upload the internship offer letter (PDF). This will sync with the student profile and certificates.</small>
              </div>
            </>
          )}

          {studentType === 'SMS Program' && (
            <>
              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Current Designation</label>
                <input
                  type="text"
                  name="currentDesignation"
                  value={formData.currentDesignation}
                  onChange={handleChange}
                  placeholder="e.g., Student, Graduate"
                />
              </div>

              <div className="form-group">
                <label>Payment Done By</label>
                <input
                  type="text"
                  name="paymentDoneBy"
                  value={formData.paymentDoneBy}
                  onChange={handleChange}
                  placeholder="Name of person who made payment"
                />
              </div>

              <div className="form-group">
                <label>Date of Payment</label>
                <input
                  type="date"
                  name="dateOfPayment"
                  value={formData.dateOfPayment}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Transaction ID</label>
                <input
                  type="text"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleChange}
                  placeholder="Enter transaction/payment ID"
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Adding Student...' : 'Add Student'}
          </button>
        </form>
      </div>
    </>
  );
}

export default AddIntern;
