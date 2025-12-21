import { useState } from 'react';
import { adminAPI } from '../services/api';

function AddIntern({ onInternAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminAPI.addIntern(formData);
      
      if (response.data.success) {
        const intern = response.data.intern;
        const emailSent = response.data.emailSent;
        
        let successMsg = `✅ Intern added successfully!\n\nIntern ID: ${intern.internId}\nName: ${intern.name}\nEmail: ${intern.email}`;
        
        if (emailSent) {
          successMsg += `\n\n📧 Login credentials have been sent to ${intern.email}`;
        } else {
          successMsg += `\n\n⚠️ Warning: Email could not be sent. Please share credentials manually.`;
        }
        
        setSuccess(successMsg);
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: ''
        });

        // Notify parent component to refresh stats
        if (onInternAdded) {
          onInternAdded();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add intern. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1>Add New Intern</h1>
        <p>Register a new intern to the system</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter intern's full name"
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

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Adding Intern...' : 'Add Intern'}
          </button>
        </form>
      </div>
    </>
  );
}

export default AddIntern;
