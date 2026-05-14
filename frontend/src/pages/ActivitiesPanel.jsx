import { useEffect, useState } from "react";
import "./ActivityManagement.css";

export default function ActivitiesPanel({ onNavigate }) {
  const [activities, setActivities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recentActivities") || "[]");
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const onStorage = () => {
      try {
        setActivities(JSON.parse(localStorage.getItem("recentActivities") || "[]"));
      } catch (e) {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function markCompleted(idx) {
    const copy = [...activities];
    copy[idx] = { ...copy[idx], status: "Completed" };
    setActivities(copy);
    localStorage.setItem("recentActivities", JSON.stringify(copy));
  }

  return (
    <div>
      <div className="premium-page-header">
        <div className="header-left">
          <h1>Scheduled Activities</h1>
          <p className="header-subtitle">All scheduled interviews, GDs and assessments</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => onNavigate && onNavigate('activity-management')}>Create New</button>
        </div>
      </div>

      <div className="premium-card" style={{ marginTop: 12 }}>
        <div className="premium-card-header"><h2>Activities</h2></div>
        <div style={{ padding: 12 }}>
          {activities.length === 0 && <div>No scheduled activities.</div>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {activities.map((a, idx) => (
              <li key={idx} style={{ padding: 12, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{a.type} • {a.title}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{a.dateTime} · By {a.createdBy} · <strong>{a.status}</strong></div>
                  {a.details?.form?.interviewer && <div style={{ marginTop: 6 }}>Interviewer: {a.details.form.interviewer}</div>}
                </div>
                <div>
                  {a.status !== 'Completed' && <button className="btn-ghost" onClick={() => markCompleted(idx)}>Mark Completed</button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
