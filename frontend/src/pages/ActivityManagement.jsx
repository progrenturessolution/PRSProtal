import { useState, useEffect, useMemo } from "react";
import { adminAPI } from "../services/api";
import "./ActivityManagement.css";

const mockStudents = Array.from({ length: 30 }).map((_, i) => ({
  id: i + 1,
  name: `Student ${i + 1}`,
  psmsId: `PSMS${1000 + i + 1}`,
}));

function ActionCard({ title, onClick }) {
  return (
    <div className="premium-action-card admin-clickable-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="action-card-icon blue" />
      <div className="action-card-content">
        <h3>{title}</h3>
      </div>
      <button className="action-card-btn" onClick={onClick}>
        Open
      </button>
    </div>
  );
}

function RecentActivities({ activities }) {
  return (
    <div className="premium-card">
      <div className="premium-card-header">
        <h2>Recent Activities</h2>
      </div>
      <div style={{ padding: 12 }}>
        {activities.length === 0 && <div>No recent activities.</div>}
        <ul className="recent-list">
          {activities.map((a, idx) => (
            <li key={idx}>
              <div style={{ fontWeight: 700 }}>{a.type} — {a.title}</div>
              <div className="meta">{a.dateTime} · By {a.createdBy} · {a.status}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ActivityManagement({ onNavigate }) {
  const [activities, setActivities] = useState(() => {
    try {
      const raw = localStorage.getItem("recentActivities") || "[]";
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("recentActivities", JSON.stringify(activities));
  }, [activities]);

  // Fetch students, trainers, groups from API
  const [students, setStudents] = useState(mockStudents);
  const [trainers, setTrainers] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [sResp, tResp, gResp] = await Promise.allSettled([
          adminAPI.getAllInterns(),
          adminAPI.getAllTrainers(),
          adminAPI.getGroups(),
        ]);

        if (mounted) {
          if (sResp.status === 'fulfilled' && sResp.value.data) {
            // normalize interns -> { id, name, psmsId }
            const mapped = sResp.value.data.interns || sResp.value.data.data || sResp.value.data;
            const interns = Array.isArray(mapped)
              ? mapped.map((it, idx) => ({ id: it._id || it.id || idx + 1, name: it.name || it.email || `${it.firstName || ''} ${it.lastName || ''}`.trim(), psmsId: it.psmsId || it.psms_id || it.registrationId || `PSMS${idx + 1}` }))
              : mockStudents;
            setStudents(interns);
          }

          if (tResp.status === 'fulfilled' && tResp.value.data) {
            const mappedT = tResp.value.data.trainers || tResp.value.data.data || tResp.value.data;
            const trainerList = Array.isArray(mappedT)
              ? mappedT.map((tr, idx) => ({ id: tr._id || tr.id || idx + 1, name: tr.name || tr.email || tr.fullName || `Trainer ${idx + 1}` }))
              : [];
            setTrainers(trainerList);
          }

          if (gResp.status === 'fulfilled' && gResp.value.data) {
            const mappedG = gResp.value.data.groups || gResp.value.data.data || gResp.value.data;
            const groupList = Array.isArray(mappedG) ? mappedG : [];
            setGroups(groupList);
          }
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => { mounted = false };
  }, []);

  const [activeFlow, setActiveFlow] = useState(null); // 'interview' | 'gd' | 'assessment'
  const [modalOpen, setModalOpen] = useState(false);

  /* Interview flow state */
  const [interviewStep, setInterviewStep] = useState(1);
  const [interviewForm, setInterviewForm] = useState({
    interviewType: "HR",
    mode: "Individual",
    date: "",
    startTime: "09:00",
    perGap: 15,
    interviewer: "",
  });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [search, setSearch] = useState("");

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => (s.name || '').toLowerCase().includes(q) || (s.psmsId || '').toLowerCase().includes(q));
  }, [search, students]);

  function toggleStudent(id) {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function generateSlots() {
    // Simple slot generation: start at date+startTime, add perGap minutes per student
    const { date, startTime, perGap } = interviewForm;
    if (!date || !startTime) return [];
    const [h, m] = startTime.split(":").map(Number);
    const base = new Date(date);
    base.setHours(h, m, 0, 0);
    const slots = selectedStudents.map((sid, idx) => {
      const slotStart = new Date(base.getTime() + idx * perGap * 60000);
      const student = students.find(s => s.id === sid) || { name: "Unknown", psmsId: "-" };
      return {
        slotNo: idx + 1,
        time: slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        studentName: student.name,
        psmsId: student.psmsId,
        studentId: sid,
      };
    });
    setGeneratedSlots(slots);
    setInterviewStep(4);
  }

  function saveInterviewSchedule() {
    // Find the trainer ID from the selected interviewer
    let trainerId = null;
    if (interviewForm.interviewer && interviewForm.interviewer !== '__other') {
      const selectedTrainer = trainers.find(t => t.name === interviewForm.interviewer);
      trainerId = selectedTrainer ? selectedTrainer.id : null;
    }

    if (!trainerId) {
      alert("Please select a valid interviewer");
      return;
    }

    // Prepare payload for API
    const payload = {
      studentIds: selectedStudents,
      trainerId,
      interviewType: interviewForm.interviewType,
      mode: interviewForm.mode,
      date: interviewForm.date,
      startTime: interviewForm.startTime,
      perGap: interviewForm.perGap
    };

    // Call API to schedule interviews
    adminAPI.scheduleInterview(payload)
      .then(response => {
        if (response.data.success) {
          // Add to activity log
          const activity = {
            type: "Interview",
            title: `${interviewForm.interviewType} Interview (${interviewForm.mode})`,
            dateTime: `${interviewForm.date} ${interviewForm.startTime}`,
            createdBy: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).email : "Admin",
            status: "Scheduled",
            details: { form: { ...interviewForm }, slots: generatedSlots },
          };
          setActivities(prev => [activity, ...prev].slice(0, 20));

          // Show success message
          alert(`${response.data.message}\nStudents will see their scheduled interviews in their dashboard.`);

          // Reset form
          setActiveFlow(null);
          setInterviewStep(1);
          setSelectedStudents([]);
          setGeneratedSlots([]);
          setSelectedGroupId(null);
          setInterviewForm({
            interviewType: "HR",
            mode: "Individual",
            date: "",
            startTime: "09:00",
            perGap: 15,
            interviewer: "",
          });
        }
      })
      .catch(error => {
        console.error("Schedule interview error:", error);
        alert(`Error scheduling interview: ${error.response?.data?.message || error.message}`);
      });
  }

  /* GD flow state */
  const [gdStep, setGdStep] = useState(1);
  const [gdForm, setGdForm] = useState({ title: "", date: "", startTime: "09:00", groupMode: "Auto", groupSize: 5 });
  const [gdGroups, setGdGroups] = useState([]);

  function createGdGroups() {
    const students = mockStudents.slice(0, 20); // demo: first 20
    if (gdForm.groupMode === "Auto") {
      const size = Number(gdForm.groupSize) || 5;
      const groups = [];
      for (let i = 0; i < students.length; i += size) {
        groups.push(students.slice(i, i + size));
      }
      setGdGroups(groups);
    }
    setGdStep(4);
  }

  function saveGd() {
    const activity = {
      type: "GD",
      title: gdForm.title || "Group Discussion",
      dateTime: `${gdForm.date} ${gdForm.startTime}`,
      createdBy: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).email : "Admin",
      status: "Scheduled",
      details: { form: gdForm, groups: gdGroups },
    };
    setActivities(prev => [activity, ...prev].slice(0, 20));
    setActiveFlow(null);
    setGdStep(1);
    setGdGroups([]);
  }

  /* Assessment flow state */
  const [assessStep, setAssessStep] = useState(1);
  const [assessForm, setAssessForm] = useState({ type: "Technical", title: "", description: "", date: "", time: "09:00", duration: 60, link: "" });
  const [assessSelected, setAssessSelected] = useState([]);

  function saveAssessment() {
    const activity = {
      type: "Assessment",
      title: assessForm.title || assessForm.type,
      dateTime: `${assessForm.date} ${assessForm.time}`,
      createdBy: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).email : "Admin",
      status: "Scheduled",
      details: { form: assessForm, assigned: assessSelected },
    };
    setActivities(prev => [activity, ...prev].slice(0, 20));
    setActiveFlow(null);
    setAssessStep(1);
    setAssessSelected([]);
  }

  function renderInterviewFlow() {
    return (
      <div>
        <div className="premium-card-header"><h2>Schedule Interview — Step {interviewStep}</h2></div>
        <div className="activity-controls">
          {interviewStep === 1 && (
            <div>
              <label>Interview Type</label>
              <select value={interviewForm.interviewType} onChange={e => setInterviewForm(f => ({ ...f, interviewType: e.target.value }))}>
                <option>HR</option>
                <option>PI</option>
                <option>Technical</option>
              </select>

              <label>Mode</label>
              <select value={interviewForm.mode} onChange={e => setInterviewForm(f => ({ ...f, mode: e.target.value }))}>
                <option>Individual</option>
                <option>Group</option>
              </select>

              <label>Date</label>
              <input type="date" value={interviewForm.date} onChange={e => setInterviewForm(f => ({ ...f, date: e.target.value }))} />

              <label>Start Time</label>
              <input type="time" value={interviewForm.startTime} onChange={e => setInterviewForm(f => ({ ...f, startTime: e.target.value }))} />

              <label>Per Interview Time Gap (minutes)</label>
              <input type="number" value={interviewForm.perGap} onChange={e => setInterviewForm(f => ({ ...f, perGap: Number(e.target.value) }))} />

              <label>Interviewer</label>
              <select value={interviewForm.interviewer || ""} onChange={e => setInterviewForm(f => ({ ...f, interviewer: e.target.value }))}>
                <option value="">-- Select interviewer (or choose Other) --</option>
                {trainers.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
                <option value="__other">Other...</option>
              </select>
              {interviewForm.interviewer === '__other' && (
                <input placeholder="Interviewer name" value={interviewForm.interviewerOther || ''} onChange={e => setInterviewForm(f => ({ ...f, interviewerOther: e.target.value }))} />
              )}

              {/* Group selection when mode is Group */}
              {interviewForm.mode === 'Group' && (
                <div style={{ marginTop: 8 }}>
                  <label>Select Group</label>
                  <select value={selectedGroupId || ''} onChange={e => setSelectedGroupId(e.target.value || null)}>
                    <option value="">-- Select a group --</option>
                    {groups.map(g => (
                      <option key={g._id || g.id} value={g._id || g.id}>{g.name || g.title || `Group ${g._id || g.id}`}</option>
                    ))}
                  </select>
                  <div style={{ marginTop: 8 }}>
                    <button className="btn-primary" onClick={() => {
                      if (!selectedGroupId) return;
                      const g = groups.find(x => (x._id || x.id) === selectedGroupId);
                      if (g) {
                        // try to extract member ids
                        let ids = [];
                        if (Array.isArray(g.students) && g.students.length) {
                          ids = g.students.map(s => s._id || s.id || s);
                        } else if (Array.isArray(g.members) && g.members.length) {
                          ids = g.members.map(s => s._id || s.id || s);
                        } else if (Array.isArray(g.studentIds) && g.studentIds.length) {
                          ids = g.studentIds;
                        }
                        setSelectedStudents(ids);
                        setInterviewStep(2);
                      }
                    }}>Select Group</button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => setInterviewStep(2)}>Next → Select Students</button>
              </div>
            </div>
          )}

          {interviewStep === 2 && (
            <div>
              <div className="form-row" style={{ marginBottom: 8 }}>
                <input className="search-input" placeholder="Search students" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="student-list" style={{ maxHeight: 260, overflow: 'auto', border: '1px solid #f1f5f9', padding: 8 }}>
                {filteredStudents.map(s => (
                  <div key={s.id} className="student-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 6 }}>
                    <div>{s.name} • {s.psmsId}</div>
                    <div>
                      <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => setInterviewStep(1)}>← Back</button>
                <button className="btn-primary" style={{ marginLeft: 8 }} onClick={() => generateSlots()}>Generate Schedule</button>
              </div>
            </div>
          )}

          {interviewStep === 4 && (
            <div>
              <h3>Preview Slots</h3>
              <div style={{ maxHeight: 320, overflow: 'auto', border: '1px solid #f1f5f9' }}>
                <table className="activity-table slot-table">
                  <thead><tr><th>Slot No.</th><th>Time</th><th>Student</th><th>PSMS ID</th><th>Actions</th></tr></thead>
                  <tbody>
                    {generatedSlots.map((s, i) => (
                      <tr key={i}>
                        <td>{s.slotNo}</td>
                        <td>{s.time}</td>
                        <td>{s.studentName}</td>
                        <td>{s.psmsId}</td>
                        <td>
                          <button className="btn-ghost" onClick={() => setGeneratedSlots(prev => prev.filter(x => x.studentId !== s.studentId))}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => setInterviewStep(2)}>← Back</button>
                <button className="btn-primary" style={{ marginLeft: 8 }} onClick={() => { saveInterviewSchedule(); setModalOpen(false); }}>Confirm & Save</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderGdFlow() {
    return (
      <div>
        <div className="premium-card-header"><h2>Schedule GD — Step {gdStep}</h2></div>
        <div className="activity-controls">
          {gdStep === 1 && (
            <div>
              <label>GD Title</label>
              <input value={gdForm.title} onChange={e => setGdForm(f => ({ ...f, title: e.target.value }))} />
              <label>Date</label>
              <input type="date" value={gdForm.date} onChange={e => setGdForm(f => ({ ...f, date: e.target.value }))} />
              <label>Start Time</label>
              <input type="time" value={gdForm.startTime} onChange={e => setGdForm(f => ({ ...f, startTime: e.target.value }))} />
              <label>Group Mode</label>
              <select value={gdForm.groupMode} onChange={e => setGdForm(f => ({ ...f, groupMode: e.target.value }))}>
                <option value="Auto">Auto Group</option>
                <option value="Manual">Manual</option>
              </select>
              <label>Group Size (for Auto)</label>
              <input type="number" value={gdForm.groupSize} onChange={e => setGdForm(f => ({ ...f, groupSize: Number(e.target.value) }))} />
              <div style={{ marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => setGdStep(2)}>Next → Create Groups</button>
              </div>
            </div>
          )}

          {gdStep === 2 && (
            <div>
              <p>Auto-create groups or select manual grouping (demo uses first 20 students)</p>
              <button className="btn-primary" onClick={() => createGdGroups()}>Generate Groups</button>
              <div style={{ marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => setGdStep(1)}>← Back</button>
              </div>
            </div>
          )}

          {gdStep === 4 && (
            <div>
              <h3>Preview Groups</h3>
              {gdGroups.map((g, idx) => (
                <div key={idx} className="group-card" style={{ padding: 12, marginBottom: 8 }}>
                  <strong>Group {idx + 1}</strong>
                  <ul>
                    {g.map(s => <li key={s.id}>{s.name} • {s.psmsId}</li>)}
                  </ul>
                </div>
              ))}
              <div>
                <button className="btn-ghost" onClick={() => setGdStep(2)}>← Back</button>
                <button className="btn-primary" style={{ marginLeft: 8 }} onClick={() => { saveGd(); setModalOpen(false); }}>Save & Notify</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderAssessmentFlow() {
    return (
      <div>
        <div className="premium-card-header"><h2>Schedule Assessment — Step {assessStep}</h2></div>
        <div className="activity-controls">
          {assessStep === 1 && (
            <div>
              <label>Assessment Type</label>
              <select value={assessForm.type} onChange={e => setAssessForm(f => ({ ...f, type: e.target.value }))}>
                <option>Technical</option>
                <option>Coding</option>
                <option>Aptitude</option>
                <option>Other</option>
              </select>
              <label>Title</label>
              <input value={assessForm.title} onChange={e => setAssessForm(f => ({ ...f, title: e.target.value }))} />
              <label>Description</label>
              <input value={assessForm.description} onChange={e => setAssessForm(f => ({ ...f, description: e.target.value }))} />
              <label>Date</label>
              <input type="date" value={assessForm.date} onChange={e => setAssessForm(f => ({ ...f, date: e.target.value }))} />
              <label>Time</label>
              <input type="time" value={assessForm.time} onChange={e => setAssessForm(f => ({ ...f, time: e.target.value }))} />
              <label>Duration (minutes)</label>
              <input type="number" value={assessForm.duration} onChange={e => setAssessForm(f => ({ ...f, duration: Number(e.target.value) }))} />
              <label>Assessment Link</label>
              <input value={assessForm.link} onChange={e => setAssessForm(f => ({ ...f, link: e.target.value }))} />
              <div style={{ marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => setAssessStep(2)}>Next → Select Students</button>
              </div>
            </div>
          )}

          {assessStep === 2 && (
            <div>
              <input className="search-input" placeholder="Search students" value={search} onChange={e => setSearch(e.target.value)} />
              <div className="student-list" style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #f1f5f9', padding: 8 }}>
                {filteredStudents.map(s => (
                  <div key={s.id} className="student-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 6 }}>
                    <div>{s.name} • {s.psmsId}</div>
                    <div>
                      <input type="checkbox" checked={assessSelected.includes(s.id)} onChange={() => setAssessSelected(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => setAssessStep(1)}>← Back</button>
                <button className="btn-primary" style={{ marginLeft: 8 }} onClick={() => { saveAssessment(); setModalOpen(false); }}>Save & Notify</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="activity-page">
      <div className="premium-page-header">
        <div className="header-left">
          <h1>Activity Management</h1>
          <p className="header-subtitle">Assign and schedule interviews, GDs and assessments</p>
        </div>
      </div>

      <div className="premium-action-grid" style={{ marginBottom: 20 }}>
        <ActionCard title="Assign Task" onClick={() => { onNavigate && onNavigate("create-task"); }} />
        <ActionCard title="Schedule Interviews" onClick={() => { setActiveFlow("interview"); setInterviewStep(1); setModalOpen(true); }} />
        <ActionCard title="Schedule GD Round" onClick={() => { setActiveFlow("gd"); setGdStep(1); setModalOpen(true); }} />
        <ActionCard title="Schedule Assessment" onClick={() => { setActiveFlow("assessment"); setAssessStep(1); setModalOpen(true); }} />
      </div>

      <div className="activity-grid">
        <div>
          <div className="premium-card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Ready</div>
            <div style={{ color: '#64748b' }}>Click an action card to open its scheduling flow.</div>
          </div>
        </div>

        <div>
          <RecentActivities activities={activities} />
        </div>
      </div>

      {modalOpen && activeFlow && (
        <div className="activity-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="activity-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{activeFlow === 'interview' ? 'Schedule Interview' : activeFlow === 'gd' ? 'Schedule GD' : 'Schedule Assessment'}</h3>
              <div>
                <button className="btn-ghost" onClick={() => setModalOpen(false)}>Close</button>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              {activeFlow === 'interview' && renderInterviewFlow()}
              {activeFlow === 'gd' && renderGdFlow()}
              {activeFlow === 'assessment' && renderAssessmentFlow()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
