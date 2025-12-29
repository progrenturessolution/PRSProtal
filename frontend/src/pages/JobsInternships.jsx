import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function JobsInternships() {
  const [postings, setPostings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    opportunityType: 'Job',
    title: '',
    company: '',
    location: '',
    domain: '',
    eligibility: '',
    description: '',
    requirements: '',
    applicationLink: '',
    applicationInstructions: '',
    deadline: '',
    salary: ''
  });

  useEffect(() => {
    fetchPostings();
  }, []);

  const fetchPostings = async () => {
    try {
      // Note: This endpoint needs to be implemented in the backend
      const response = await adminAPI.getJobPostings();
      if (response.data.success) {
        setPostings(response.data.postings);
      }
    } catch (error) {
      console.error('Failed to fetch job postings:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminAPI.createJobPosting(formData);
      
      if (response.data.success) {
        setSuccess('✅ Job/Internship posting created successfully!');
        setFormData({
          opportunityType: 'Job',
          title: '',
          company: '',
          location: '',
          domain: '',
          eligibility: '',
          description: '',
          requirements: '',
          applicationLink: '',
          applicationInstructions: '',
          deadline: '',
          salary: ''
        });
        setShowForm(false);
        fetchPostings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create posting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1>Jobs & Internship Updates</h1>
        <p>Post and manage job openings and internship opportunities</p>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          {showForm ? '✖ Cancel' : '➕ Post New Opportunity'}
        </button>
      </div>

      {/* Create Posting Form */}
      {showForm && (
        <div className="card">
          <h3>Post New Opportunity</h3>
          
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
            {/* Opportunity Type */}
            <div className="form-group">
              <label>Opportunity Type *</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="opportunityType"
                    value="Job"
                    checked={formData.opportunityType === 'Job'}
                    onChange={handleChange}
                    style={{ marginRight: '8px' }}
                  />
                  Job Opening
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="opportunityType"
                    value="Internship"
                    checked={formData.opportunityType === 'Internship'}
                    onChange={handleChange}
                    style={{ marginRight: '8px' }}
                  />
                  Internship
                </label>
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label>Job/Internship Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Full Stack Developer, Data Analyst Intern"
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

            {/* Company */}
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter company name"
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

            {/* Location & Domain */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Remote, Bangalore, Hybrid"
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

              <div className="form-group">
                <label>Domain *</label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="e.g., Web Development, Data Science"
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
            </div>

            {/* Salary & Deadline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Salary/Stipend</label>
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="e.g., ₹5,00,000 - ₹8,00,000 per annum"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div className="form-group">
                <label>Application Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Eligibility */}
            <div className="form-group">
              <label>Eligibility Criteria *</label>
              <input
                type="text"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                placeholder="e.g., B.Tech/M.Tech, 2024 Graduates"
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

            {/* Description */}
            <div className="form-group">
              <label>Job Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter detailed job/internship description"
                required
                rows={4}
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

            {/* Requirements */}
            <div className="form-group">
              <label>Requirements/Skills *</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="List required skills and qualifications (one per line)"
                required
                rows={4}
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

            {/* Application Link */}
            <div className="form-group">
              <label>Application Link</label>
              <input
                type="url"
                name="applicationLink"
                value={formData.applicationLink}
                onChange={handleChange}
                placeholder="https://company.com/apply"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Application Instructions */}
            <div className="form-group">
              <label>Application Instructions</label>
              <textarea
                name="applicationInstructions"
                value={formData.applicationInstructions}
                onChange={handleChange}
                placeholder="How to apply, contact details, etc."
                rows={3}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? '#ccc' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              {loading ? 'Posting...' : 'Post Opportunity'}
            </button>
          </form>
        </div>
      )}

      {/* Posted Opportunities */}
      <div className="card">
        <h3>Recent Postings</h3>
        {postings.length === 0 ? (
          <div style={{ marginTop: '20px', padding: '20px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280' }}>
              💼 No job postings yet. Create your first posting above!
            </p>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {postings.map((posting) => (
              <div
                key={posting._id}
                style={{
                  padding: '15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}
              >
                <h4>{posting.title}</h4>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  {posting.company} • {posting.location} • {posting.domain}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default JobsInternships;
