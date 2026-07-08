import React, { useState, useEffect } from 'react';

export default function GdConductModal({ gd, onClose, onSave }) {
  const [evaluations, setEvaluations] = useState([]);

  useEffect(() => {
    if (!gd) return;
    // Build flat student list from gd groups
    const groups = gd.details?.groups || gd.details?.form?.groups || [];
    const students = [];
    (groups || []).forEach(g => {
      if (Array.isArray(g)) {
        g.forEach(s => students.push(s));
      } else if (g && Array.isArray(g.students)) {
        g.students.forEach(s => students.push(s));
      } else if (g && Array.isArray(g.members)) {
        g.members.forEach(s => students.push(s));
      }
    });
    const uniq = [];
    const seen = new Set();
    students.forEach((s, idx) => {
      const id = s && (s._id || s.internId || s.id) ? String(s._id || s.internId || s.id) : String(idx);
      if (!seen.has(id)) {
        seen.add(id);
        uniq.push({ id, internId: s?.internId || '-', name: s && s.name ? s.name : (s || '-'), email: s?.email || '-', mobile: s?.mobile || '-', raw: s });
      }
    });

    setEvaluations(uniq.map(s => ({ ...s, attendanceStatus: 'Present', score: '', remarks: '' })));
  }, [gd]);

  const updateEval = (id, field, value) => {
    setEvaluations(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSave = () => {
    try {
      // Persist to localStorage under gdEvaluations
      const raw = JSON.parse(localStorage.getItem('gdEvaluations') || '{}');
      raw[gd._id || gd.title || Date.now()] = {
        savedAt: new Date().toISOString(),
        evaluations,
        gdTitle: gd.title || gd.details?.form?.title || 'Group Discussion'
      };
      localStorage.setItem('gdEvaluations', JSON.stringify(raw));
    } catch (e) {
      console.error('Failed to save GD evaluations', e);
    }
    if (onSave) onSave(evaluations);
    onClose();
  };

  if (!gd) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '900px', maxHeight: '80vh', overflow: 'auto', background: '#fff', borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{gd.title || gd.details?.form?.title || 'Conduct Group Discussion'}</h3>
          <div>
            <button
              onClick={onClose}
              style={{
                marginRight: 8,
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '10px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Back
            </button>
            <button
              onClick={handleSave}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 8px 18px rgba(16, 185, 129, 0.22)'
              }}
            >
              Conduct GD
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>Date:</strong> {gd.details?.form?.date || gd.dateTime || '-'} &nbsp; <strong>Time:</strong> {gd.details?.form?.startTime || '-'}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table view-students-table">
            <thead>
              <tr><th>#</th><th>PSMS ID</th><th>Student</th><th>Email</th><th>Attendance</th><th>Score</th><th>Remarks</th></tr>
            </thead>
            <tbody>
              {evaluations.map((s, idx) => (
                <tr key={s.id}>
                  <td>{idx+1}</td>
                  <td>{s.internId}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>
                    <select value={s.attendanceStatus} onChange={(e) => updateEval(s.id, 'attendanceStatus', e.target.value)} style={{ padding: '6px 8px' }}>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </td>
                  <td>
                    <input type="text" value={s.score} onChange={(e) => updateEval(s.id, 'score', e.target.value)} placeholder="Score" style={{ width: 80, padding: '6px 8px' }} />
                  </td>
                  <td>
                    <input type="text" value={s.remarks} onChange={(e) => updateEval(s.id, 'remarks', e.target.value)} placeholder="Remarks" style={{ width: '100%', padding: '6px 8px' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
