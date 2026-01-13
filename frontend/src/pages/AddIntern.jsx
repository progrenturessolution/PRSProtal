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
    customDomain: '',
    joiningDate: '',
    duration: '',
    paymentDoneBy: '',
    dateOfPayment: '',
    transactionId: '',
    currentDesignation: ''
  });
  const [welcomeFile, setWelcomeFile] = useState(null);
  const [offerFile, setOfferFile] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
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

  const handleWelcomeFile = (e) => { setWelcomeFile(e.target.files[0] || null); setError(''); setSuccess(''); };
  const handleOfferFile = (e) => { setOfferFile(e.target.files[0] || null); setError(''); setSuccess(''); };
  const handlePaymentFile = (e) => { setPaymentFile(e.target.files[0] || null); setError(''); setSuccess(''); };

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
        const selectedDomain = formData.domain === 'Other' ? formData.customDomain : formData.domain;
        
        if (!selectedDomain || !formData.joiningDate || !formData.duration) {
          setError('Please fill in all required fields: Domain, Joining Date, and Duration');
          setLoading(false);
          return;
        }
        
        submitData.domain = selectedDomain;
        submitData.joiningDate = formData.joiningDate;
        submitData.duration = formData.duration;
        
        console.log('Internship data being sent:', {
          domain: submitData.domain,
          joiningDate: submitData.joiningDate,
          duration: submitData.duration
        });
      } else if (studentType === 'SMS Program') {
        submitData.paymentDoneBy = formData.paymentDoneBy;
        submitData.dateOfPayment = formData.dateOfPayment;
        submitData.transactionId = formData.transactionId;
        submitData.currentDesignation = formData.currentDesignation;
      }

      console.log('Submitting student data:', submitData);
      console.log('Token:', localStorage.getItem('token'));
      
      let response;

      // If SMS Program and files are selected, send multipart/form-data
      if (studentType === 'SMS Program') {
        // Require all three documents for SMS Program
        if (!welcomeFile || !offerFile || !paymentFile) {
          setError('Please upload Welcome Letter, Offer Letter and Payment Receipt (all required).');
          setLoading(false);
          return;
        }

        const fd = new FormData();
        // Append json fields
        Object.keys(submitData).forEach((k) => fd.append(k, submitData[k]));
        // Append files with field names expected by the server
        fd.append('welcomeLetter', welcomeFile);
        fd.append('offerLetter', offerFile);
        fd.append('paymentReceipt', paymentFile);

        response = await adminAPI.addIntern(fd);
      } else {
        response = await adminAPI.addIntern(submitData);
      }
      
      if (response.data.success) {
        const intern = response.data.intern;
        const emailSent = response.data.emailSent;
        
          let successMsg = `Student added successfully!\n\nID: ${intern.internId}\nName: ${intern.name}\nEmail: ${intern.email}\nType: ${intern.studentType}`;
        
        if (emailSent) {
          successMsg += `\n\nLogin credentials have been sent to ${intern.email}`;
        } else {
            successMsg += `\n\nWarning: Email could not be sent. Please share credentials manually.`;
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
        // clear files
        setWelcomeFile(null);
        setOfferFile(null);
        setPaymentFile(null);
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
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Domain</option>
                  <option value="Web Development">Web Development</option>
                  <option value="App Development">App Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Graphic Design">Graphic Design</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="Content Writing">Content Writing</option>
                  <option value="Business Development">Business Development</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Full Stack Development">Full Stack Development</option>
                  <option value="Frontend Development">Frontend Development</option>
                  <option value="Backend Development">Backend Development</option>
                  <option value="Mobile App Development">Mobile App Development</option>
                  <option value="Game Development">Game Development</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Project Management">Project Management</option>
                  <option value="Business Analytics">Business Analytics</option>
                  <option value="Other">Other (Type Manually)</option>
                </select>
              </div>

              {formData.domain === 'Other' && (
                <div className="form-group" style={{ animation: 'slideInForm 0.3s ease-out' }}>
                  <label>Enter Custom Domain *</label>
                  <input
                    type="text"
                    name="customDomain"
                    value={formData.customDomain || ''}
                    onChange={(e) => setFormData({...formData, customDomain: e.target.value})}
                    placeholder="Enter your custom domain"
                    required
                  />
                </div>
              )}

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
                    <input type="file" accept="application/pdf" onChange={handleOfferFile} />
                    <small>Upload the internship offer letter (PDF). This will sync with the student profile and certificates.</small>
              </div>
            </>
          )}

          {studentType === 'SMS Program' && (
            <>
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
                <input type="text" name="paymentDoneBy" value={formData.paymentDoneBy} onChange={handleChange} placeholder="Name of person who made payment" />
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
              <div className="form-group">
                <label>Upload Welcome Letter (PDF) *</label>
                <input type="file" accept="application/pdf" onChange={handleWelcomeFile} />
              </div>

              <div className="form-group">
                <label>Upload Internship Offer Letter (PDF) *</label>
                <input type="file" accept="application/pdf" onChange={handleOfferFile} />
              </div>

              <div className="form-group">
                <label>Upload Payment Receipt (PDF) *</label>
                <input type="file" accept="application/pdf" onChange={handlePaymentFile} />
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
