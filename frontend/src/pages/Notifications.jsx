import { useState, useEffect } from 'react';
import { adminAPI, UPLOADS_BASE } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Notifications() {
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [notificationType, setNotificationType] = useState('');
  const [recipientType, setRecipientType] = useState('Student');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [fetchingNotifications, setFetchingNotifications] = useState(false);

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setFetchingNotifications(true);
    try {
      const response = await adminAPI.getAllNotifications();
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setFetchingNotifications(false);
    }
  };

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

  const handleRecipientTypeChange = (e) => {
    setRecipientType(e.target.value);
    setSelectedRecipients([]);
    setSelectedGroups([]);
    setSearchQuery('');
  };

  const handleIndividualRecipientChange = (recipientId) => {
    setSelectedRecipients((prev) => {
      if (prev.includes(recipientId)) {
        return prev.filter((id) => id !== recipientId);
      } else {
        return [...prev, recipientId];
      }
    });
  };

  const handleGroupChange = (groupType) => {
    setSelectedGroups((prev) => {
      if (prev.includes(groupType)) {
        return prev.filter((type) => type !== groupType);
      } else {
        return [...prev, groupType];
      }
    });
  };

  const handleSelectAllIndividuals = () => {
    if (recipientType === 'Student') {
      const filteredList = getFilteredRecipients();
      if (selectedRecipients.length === filteredList.length) {
        setSelectedRecipients([]);
      } else {
        setSelectedRecipients(filteredList.map((s) => s._id));
      }
    }
  };

  const getFilteredRecipients = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return recipientType === 'Student' ? students : trainers;
    }

    const list = recipientType === 'Student' ? students : trainers;
    return list.filter(item => {
      if (recipientType === 'Student') {
        return (
          item.name.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          item.internId.toLowerCase().includes(query) ||
          (item.domain && item.domain.toLowerCase().includes(query)) ||
          (item.currentDesignation && item.currentDesignation.toLowerCase().includes(query))
        );
      } else {
        return (
          item.name.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query)
        );
      }
    });
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
      const trimmedSubject = subject.trim();
      const trimmedMessage = message.trim();

      // Validation
      if (!notificationType) {
        setError('Notification type is required');
        setLoading(false);
        return;
      }

      if (!trimmedSubject) {
        setError('Subject is required');
        setLoading(false);
        return;
      }

      if (!trimmedMessage) {
        setError('Message is required');
        setLoading(false);
        return;
      }

      if (notificationType === 'Individual' && selectedRecipients.length === 0) {
        setError('Please select at least one recipient');
        setLoading(false);
        return;
      }

      if (notificationType === 'Group' && selectedGroups.length === 0) {
        setError('Please select at least one group');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('notificationType', notificationType);
      formData.append('recipientType', recipientType);
      formData.append('subject', trimmedSubject);
      formData.append('message', trimmedMessage);

      if (notificationType === 'Individual') {
        formData.append('recipientIds', JSON.stringify(selectedRecipients));
      } else if (notificationType === 'Group') {
        formData.append('selectedGroups', JSON.stringify(selectedGroups));
      }

      if (file) {
        formData.append('attachment', file);
      }

      const response = await adminAPI.createNotification(formData);
      
      if (response.data.success) {
        setSuccess('Notification sent successfully!');
        // Reset form
        setNotificationType('');
        setSubject('');
        setMessage('');
        setFile(null);
        setSelectedRecipients([]);
        setSelectedGroups([]);
        if (document.getElementById('fileInput')) {
          document.getElementById('fileInput').value = '';
        }
        // Fetch recent notifications to show the new one
        fetchNotifications();
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
                  required
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
                  required
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
                  required
                  style={{ marginRight: '8px' }}
                />
                All Users
              </label>
            </div>
          </div>

          {/* Recipient Type (if Individual or Group) */}
          {notificationType && notificationType !== 'All' && (
            <div className="form-group">
              <label>Recipient Type *</label>
              <select
                value={recipientType}
                onChange={handleRecipientTypeChange}
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
                <option value="Trainer">Employees</option>
              </select>
            </div>
          )}

          {/* Individual Recipient Selection with Checkboxes */}
          {notificationType === 'Individual' && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', marginBottom: '0' }}>
                  Select Recipients * ({selectedRecipients.length} selected)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllIndividuals}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: '#324158',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(50, 65, 88, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {selectedRecipients.length === getFilteredRecipients().length && getFilteredRecipients().length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Search Input */}
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Search by name, email, ID, domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '2px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#1f2937',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                  }}
                />
              </div>

              <div
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: '450px',
                  overflowY: 'auto',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                {getFilteredRecipients().length > 0 ? (
                  <div>
                    {getFilteredRecipients().map((item) => (
                      <label
                        key={item._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 12px',
                          margin: '4px 0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: selectedRecipients.includes(item._id) ? '#eff6ff' : '#ffffff',
                          border: selectedRecipients.includes(item._id) ? '1px solid #bfdbfe' : '1px solid transparent',
                          transition: 'all 0.2s ease',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedRecipients.includes(item._id)) {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedRecipients.includes(item._id)) {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRecipients.includes(item._id)}
                          onChange={() => handleIndividualRecipientChange(item._id)}
                          style={{
                            width: '18px',
                            height: '18px',
                            minWidth: '18px',
                            cursor: 'pointer',
                            accentColor: '#3b82f6'
                          }}
                        />
                        {recipientType === 'Student' ? (
                          <>
                            <span style={{ marginLeft: '10px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                              {item.internId}
                            </span>
                            <span style={{ marginLeft: '8px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                              {item.name}
                            </span>
                            {item.domain && (
                              <span style={{ marginLeft: '8px', fontSize: '13px', color: '#6b7280', padding: '2px 6px', background: '#f3f4f6', borderRadius: '4px' }}>
                                {item.domain}
                              </span>
                            )}
                            <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#9ca3af' }}>
                              {item.email}
                            </span>
                          </>
                        ) : (
                          <>
                            <span style={{ marginLeft: '10px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                              {item.name}
                            </span>
                            <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#9ca3af' }}>
                              {item.email}
                            </span>
                          </>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', textAlign: 'center', margin: '30px 0', fontSize: '14px' }}>
                    {searchQuery ? `No ${recipientType.toLowerCase()}s found matching "${searchQuery}"` : `No ${recipientType.toLowerCase()}s available`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Group Selection with Checkboxes */}
          {notificationType === 'Group' && (
            <div className="form-group">
              <label style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', marginBottom: '12px', display: 'block' }}>
                Select Groups to Notify * ({selectedGroups.length} selected)
              </label>
              <div
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 12px',
                    margin: '4px 0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: selectedGroups.includes('SMS Program') ? '#f0fdf4' : '#ffffff',
                    border: selectedGroups.includes('SMS Program') ? '1px solid #bbf7d0' : '1px solid transparent',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedGroups.includes('SMS Program')) {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedGroups.includes('SMS Program')) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes('SMS Program')}
                    onChange={() => handleGroupChange('SMS Program')}
                    style={{
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      cursor: 'pointer',
                      accentColor: '#22c55e'
                    }}
                  />
                  <span style={{ marginLeft: '10px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                    SMS Program Students
                  </span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 12px',
                    margin: '4px 0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: selectedGroups.includes('Internship') ? '#fef3c7' : '#ffffff',
                    border: selectedGroups.includes('Internship') ? '1px solid #fcd34d' : '1px solid transparent',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedGroups.includes('Internship')) {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedGroups.includes('Internship')) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes('Internship')}
                    onChange={() => handleGroupChange('Internship')}
                    style={{
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      cursor: 'pointer',
                      accentColor: '#f59e0b'
                    }}
                  />
                  <span style={{ marginLeft: '10px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                    Internship Students
                  </span>
                </label>
                {recipientType === 'Trainer' && (
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 12px',
                      margin: '4px 0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedGroups.includes('All Trainers') ? '#fce7f3' : '#ffffff',
                      border: selectedGroups.includes('All Trainers') ? '1px solid #fbcfe8' : '1px solid transparent',
                      transition: 'all 0.2s ease',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedGroups.includes('All Trainers')) {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedGroups.includes('All Trainers')) {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes('All Trainers')}
                      onChange={() => handleGroupChange('All Trainers')}
                      style={{
                        width: '18px',
                        height: '18px',
                        minWidth: '18px',
                        cursor: 'pointer',
                        accentColor: '#ec4899'
                      }}
                    />
                    <span style={{ marginLeft: '10px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                      All Trainers
                    </span>
                  </label>
                )}
              </div>
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
              background: loading ? '#94a3b8' : '#314158',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: loading ? 'none' : '0 4px 12px rgba(49, 65, 88, 0.22)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <LoadingSpinner text="Sending..." inline size="sm" />
            ) : (
              'Send Notification'
            )}
          </button>
        </form>
      </div>

      {/* Recent Notifications */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Recent Notifications</h3>
          <button 
            type="button" 
            onClick={fetchNotifications} 
            disabled={fetchingNotifications}
            style={{
              padding: '6px 12px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              color: '#374151',
              transition: 'all 0.2s ease'
            }}
          >
            {fetchingNotifications ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {fetchingNotifications && notifications.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <LoadingSpinner text="Fetching notifications..." />
          </div>
        ) : notifications.filter(notif => notif.notificationType === 'General/Announcement').length === 0 ? (
          <div style={{ padding: '30px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', margin: 0 }}>No announcements found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {notifications
              .filter(notif => notif.notificationType === 'General/Announcement')
              .slice(0, 5)
              .map((notif) => {
              const dateObj = new Date(notif.createdAt);
              const dateStr = dateObj.toLocaleDateString();
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div 
                  key={notif._id} 
                  style={{
                    padding: '16px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '15px', fontWeight: 600 }}>
                        {notif.title}
                      </h4>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: notif.notificationType === 'General/Announcement' ? '#f0fdf4' : notif.notificationType === 'Interview' ? '#eff6ff' : notif.notificationType === 'Test/Assessment' ? '#fef2f2' : '#f5f5f5',
                        color: notif.notificationType === 'General/Announcement' ? '#166534' : notif.notificationType === 'Interview' ? '#1e40af' : notif.notificationType === 'Test/Assessment' ? '#991b1b' : '#404040',
                        border: '1px solid currentColor'
                      }}>
                        {notif.notificationType}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        background: '#f8fafc',
                        color: '#64748b',
                        border: '1px solid #e2e8f0'
                      }}>
                        To: {notif.sendTo} {notif.recipientModel ? `(${notif.recipientModel})` : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {dateStr} at {timeStr}
                    </span>
                  </div>
                  
                  <p style={{ margin: '8px 0', color: '#475569', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {notif.message}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #f1f5f9' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Sent by: {notif.createdBy?.name || 'Admin'}
                    </span>
                    {notif.attachment?.filename && (
                      <a
                        href={`${UPLOADS_BASE}/uploads/notifications/${notif.attachment.filename}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '13px',
                          color: '#314158',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        📎 View Attachment
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default Notifications;
