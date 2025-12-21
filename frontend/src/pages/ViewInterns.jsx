import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function ViewInterns({ onInternDeleted }) {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getAllInterns();
      console.log('Interns response:', response.data);
      
      if (response.data.success && response.data.interns) {
        setInterns(response.data.interns);
      } else {
        setInterns([]);
      }
    } catch (err) {
      console.error('Error fetching interns:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to fetch interns. Please check if you are logged in.');
      setInterns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await adminAPI.deleteIntern(id);
      setInterns(interns.filter(intern => intern._id !== id));
      alert('Intern deleted successfully');
      
      // Notify parent to refresh stats
      if (onInternDeleted) {
        onInternDeleted();
      }
    } catch (err) {
      alert('Failed to delete intern');
      console.error(err);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'completed' : 'active';
    
    try {
      await adminAPI.updateInternStatus(id, newStatus);
      setInterns(interns.map(intern => 
        intern._id === id ? { ...intern, status: newStatus } : intern
      ));
    } catch (err) {
      alert('Failed to update status');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="content-header">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1>All Interns</h1>
        <p>Manage and view all registered interns</p>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          marginBottom: '20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px',
          fontWeight: 500
        }}>
          ❌ {error}
        </div>
      )}

      <div className="card">
        {interns.length === 0 ? (
          <div className="empty-state">
            <p>No interns found. Add your first intern to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Intern ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interns.map((intern) => (
                  <tr key={intern._id}>
                    <td>
                      <span className="intern-id-badge">{intern.internId}</span>
                    </td>
                    <td>{intern.name}</td>
                    <td>{intern.email}</td>
                    <td>
                      <button
                        className={`status-badge status-${intern.status}`}
                        onClick={() => handleStatusChange(intern._id, intern.status)}
                        title="Click to toggle status"
                      >
                        {intern.status === 'active' ? '✓ Active' : '✓ Completed'}
                      </button>
                    </td>
                    <td>{new Date(intern.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="delete-btn-small"
                        onClick={() => handleDelete(intern._id, intern.name)}
                        title="Delete intern"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default ViewInterns;
