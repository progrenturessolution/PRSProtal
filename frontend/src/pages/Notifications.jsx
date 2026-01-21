import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function Notifications() {
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [notificationType, setNotificationType] = useState('Individual');
  const [recipientType, setRecipientType] = useState('Student');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const studentsResponse = await adminAPI.getAllInterns();
      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.interns);
      }

      // Fetch trainers when trainer API is available
      // const trainersResponse = await adminAPI.getAllTrainers();
      // if (trainersResponse.data.success) {
      //   setTrainers(trainersResponse.data.trainers);
      // }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size should be less than 10MB.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('notificationType', notificationType);
      formData.append('recipientType', recipientType);
      formData.append('subject', subject);
      formData.append('message', message);

      if (notificationType === 'Individual') {
        formData.append('recipientId', selectedRecipient);
      } else if (notificationType === 'Group') {
        formData.append('groupType', recipientType);
      }

      if (file) {
        formData.append('attachment', file);
      }

      // Note: This endpoint needs to be implemented in the backend
      const response = await adminAPI.createNotification(formData);
      
      if (response.data.success) {
        setSuccess('Notification sent successfully!');
        // Reset form
        setSubject('');
        setMessage('');
        setFile(null);
        setSelectedRecipient('');
        document.getElementById('fileInput').value = '';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1>Notifications</h1>
        <p>Send notifications to students and trainers</p>
      </div>

      <div className="card">
        <h3>Create New Notification</h3>
        
        {error && (
          <div className="error-message" style={{ marginTop: '15px' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message" style={{ marginTop: '15px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          {/* Notification Type */}
          <div className="form-group">
            <label>Notification Type *</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="notificationType"
                  value="Individual"
                  checked={notificationType === 'Individual'}
                  onChange={(e) => setNotificationType(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                Individual
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="notificationType"
                  value="Group"
                  checked={notificationType === 'Group'}
                  onChange={(e) => setNotificationType(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                Group
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="notificationType"
                  value="All"
                  checked={notificationType === 'All'}
                  onChange={(e) => setNotificationType(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                All Users
              </label>
            </div>
          </div>

          {/* Recipient Type (if Individual or Group) */}
          {notificationType !== 'All' && (
            <div className="form-group">
              <label>Recipient Type *</label>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              >
                <option value="Student">Students</option>
                <option value="Trainer">Trainers</option>
              </select>
            </div>
          )}

          {/* Individual Recipient Selection */}
          {notificationType === 'Individual' && (
            <div className="form-group">
              <label>Select Recipient *</label>
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              >
                <option value="">Choose a recipient...</option>
                {recipientType === 'Student' &&
                  students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.internId} - {student.name} ({student.email})
                    </option>
                  ))}
                {recipientType === 'Trainer' &&
                  trainers.map((trainer) => (
                    <option key={trainer._id} value={trainer._id}>
                      {trainer.name} ({trainer.email})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div className="form-group">
            <label>Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter notification subject"
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Message */}
          <div className="form-group">
            <label>Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              required
              rows={6}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* File Attachment (Optional) */}
          <div className="form-group">
            <label>Attachment (Optional)</label>
            <input
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              Max size: 10MB
            </small>
          </div>

          {/* Send Button */}
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
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>

      {/* Recent Notifications */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Recent Notifications</h3>
        <div style={{ marginTop: '20px', padding: '20px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>
             Notification history will be displayed here.
          </p>
        </div>
      </div>
    </>
  );
}

export default Notifications;
