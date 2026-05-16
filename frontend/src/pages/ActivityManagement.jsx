import { useState, useEffect, useMemo } from "react";
import { adminAPI } from "../services/api";
import "./ActivityManagement.css";

// Removed dummy student data; real interns will be loaded from the API

function ActionCard({ title, subtitle = "", onClick }) {
  return (
    <div className="premium-action-card admin-clickable-card action-card-modern" onClick={onClick} role="button" tabIndex={0}>
      <div className="action-card-left">
        <div className="action-card-icon blue" />
        <div className="action-card-content">
          <h3>{title}</h3>
          {subtitle && <p className="action-card-desc">{subtitle}</p>}
        </div>
      </div>
      <div className="action-card-right">
        <button className="action-card-btn" onClick={onClick}>
          Open
        </button>
      </div>
    </div>
  );
}

export default function ActivityManagement({ onNavigate }) {
        // Minimal state preserved for backend interactions; UI rewritten from scratch below
        // Start with no activities; clear any previously saved activities so user can add new data
        const [activities, setActivities] = useState([]);

        useEffect(() => {
          try { localStorage.removeItem('recentActivities'); } catch (e) {}
        }, []);

        // Persist new activities going forward
        useEffect(() => { localStorage.setItem('recentActivities', JSON.stringify(activities)); }, [activities]);

        const [students, setStudents] = useState([]);
        const [trainers, setTrainers] = useState([]);
        const [groups, setGroups] = useState([]);
        useEffect(() => { 
          let mounted = true;
          (async () => {
            try {
                const [sResp, tResp, gResp] = await Promise.allSettled([adminAPI.getAllInterns(), adminAPI.getAllTrainers(), adminAPI.getGroups()]);
                if (mounted) {
                  if (sResp.status === 'fulfilled' && sResp.value?.data) {
                    const mapped = sResp.value.data.interns || sResp.value.data.data || sResp.value.data;
                    const interns = Array.isArray(mapped) ? mapped.map((it, idx) => ({ id: it._id||it.id||idx+1, name: it.name||it.email||`${it.firstName||''} ${it.lastName||''}`.trim(), psmsId: it.psmsId||it.psms_id||it.registrationId||'' })) : [];
                    setStudents(interns);
                  }

                  if (tResp.status === 'fulfilled' && tResp.value?.data) {
                    const mappedT = tResp.value.data.trainers || tResp.value.data.data || tResp.value.data;
                    const trainerList = Array.isArray(mappedT) ? mappedT.map((tr, idx) => ({ id: tr._id||tr.id||idx+1, name: tr.name||tr.email||tr.fullName||'' })) : [];
                    setTrainers(trainerList.filter(x => x.name));
                  }

                  if (gResp.status === 'fulfilled' && gResp.value?.data) {
                    const mappedG = gResp.value.data.groups || gResp.value.data.data || gResp.value.data;
                    setGroups(Array.isArray(mappedG) ? mappedG : []);
                  }
                }
              } catch (e) {}
          })();
          return () => { mounted = false };
        }, []);

        // UI state for tabs and modal
        const [tab, setTab] = useState('overview');
        const [modalOpen, setModalOpen] = useState(false);
        const [activeFlow, setActiveFlow] = useState(null);

        const stats = useMemo(() => {
          const upcoming = activities.filter(a => a.status === 'Scheduled').length;
          const completed = activities.filter(a => a.status === 'Completed').length;
          const openTasks = activities.filter(a => a.type === 'Task' && a.status !== 'Completed').length;
          return { upcoming, completed, openTasks };
        }, [activities]);

        /* --- flow states (basic, to restore previous behavior) --- */
        const [interviewStep, setInterviewStep] = useState(1);
        const [interviewForm, setInterviewForm] = useState({ interviewType: 'HR', mode: 'Individual', groupId: '', date: '', startTime: '09:00', perGap: 15, interviewer: '', otherInterviewerName: '' });
        const [selectedStudents, setSelectedStudents] = useState([]);
        const [generatedSlots, setGeneratedSlots] = useState([]);
        const [search, setSearch] = useState('');

        const [gdStep, setGdStep] = useState(1);
        const [gdForm, setGdForm] = useState({ title: '', date: '', startTime: '09:00', groupMode: 'Auto', groupSize: 5 });
        const [gdGroups, setGdGroups] = useState([]);

        const [assessStep, setAssessStep] = useState(1);
        const [assessForm, setAssessForm] = useState({ type: 'Technical', title: '', description: '', date: '', time: '09:00', duration: 60, link: '' });
        const [assessSelected, setAssessSelected] = useState([]);

        function openFlow(flow) { setActiveFlow(flow); setModalOpen(true); }

        // Simple helpers to add activities locally (keeps backend intact for real calls)
        function pushActivity(a) { setActivities(prev => [a, ...prev].slice(0, 40)); }

        function toggleStudent(id) { setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }

        function generateSlots() {
          const { date, startTime, perGap } = interviewForm;
          if (!date || !startTime) return;
          const [h, m] = startTime.split(':').map(Number);
          const base = new Date(date);
          base.setHours(h, m, 0, 0);
          const slots = selectedStudents.map((sid, idx) => {
            const slotStart = new Date(base.getTime() + idx * perGap * 60000);
            const student = students.find(s => s.id === sid) || { name: '', psmsId: '' };
            return { slotNo: idx+1, time: slotStart.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), studentName: student.name, psmsId: student.psmsId, studentId: sid };
          });
          setGeneratedSlots(slots);
          setInterviewStep(4);
        }

        function removeSlot(studentId) {
          setGeneratedSlots(prev => prev.filter(s => s.studentId !== studentId));
        }

        function editSlotTime(index, newTime) {
          setGeneratedSlots(prev => prev.map((s,i) => i===index ? { ...s, time: newTime } : s));
        }

        function saveInterviewSchedule() {
          // Prepare trainer/interviewer info
          let trainerId = null;
          let interviewerName = null;
          if (interviewForm.interviewer && interviewForm.interviewer !== '__other') {
            // interviewer now holds trainer id
            trainerId = interviewForm.interviewer;
            const selectedTrainer = trainers.find(t => String(t.id) === String(interviewForm.interviewer));
            interviewerName = selectedTrainer ? selectedTrainer.name : null;
          } else if (interviewForm.interviewer === '__other') {
            interviewerName = interviewForm.otherInterviewerName || null;
          }

          const payload = { studentIds: selectedStudents, trainerId, interviewerName, interviewType: interviewForm.interviewType, mode: interviewForm.mode, date: interviewForm.date, startTime: interviewForm.startTime, perGap: interviewForm.perGap };

          // Validate interviewer when backend present
          if (adminAPI && adminAPI.scheduleInterview && !trainerId && !interviewerName) {
            alert('Please select or enter an interviewer before scheduling.');
            return;
          }

          if (adminAPI && adminAPI.scheduleInterview) {
            adminAPI.scheduleInterview(payload).then(response => {
              if (response.data?.success) {
                const activity = { type: 'Interview', title: `${interviewForm.interviewType} Interview (${interviewForm.mode})`, dateTime: `${interviewForm.date} ${interviewForm.startTime}`, createdBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Admin', status: 'Scheduled', details: { form: { ...interviewForm }, slots: generatedSlots } };
                pushActivity(activity);
                alert(response.data.message || 'Interview scheduled');
                setActiveFlow(null); setModalOpen(false);
              }
            }).catch(err => { console.error(err); alert('Error scheduling interview: '+(err.response?.data?.message || err.message)); });
          } else {
            const activity = { type: 'Interview', title: `${interviewForm.interviewType} Interview (${interviewForm.mode})`, dateTime: `${interviewForm.date} ${interviewForm.startTime}`, createdBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Admin', status: 'Scheduled', details: { form: { ...interviewForm }, slots: generatedSlots } };
            pushActivity(activity);
            setActiveFlow(null); setModalOpen(false);
          }

          // reset local form
          setInterviewStep(1); setSelectedStudents([]); setGeneratedSlots([]); setInterviewForm({ interviewType: 'HR', mode: 'Individual', groupId: '', date: '', startTime: '09:00', perGap: 15, interviewer: '', otherInterviewerName: '' });
        }

        function createGdGroups() {
          const list = students.slice(0, 20);
          if (gdForm.groupMode === 'Auto') {
            const size = Number(gdForm.groupSize) || 5; const groups = [];
            for (let i=0;i<list.length;i+=size) groups.push(list.slice(i, i+size));
            setGdGroups(groups);
          }
          setGdStep(4);
        }

        function saveGd() {
          // Attempt backend call (not implemented in every API) then update UI
          const activity = { type: 'GD', title: gdForm.title || 'Group Discussion', dateTime: `${gdForm.date} ${gdForm.startTime}`, createdBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Admin', status: 'Scheduled', details: { form: gdForm, groups: gdGroups } };
          // If backend API exists, call it (placeholder)
          if (adminAPI && adminAPI.createGd) {
            adminAPI.createGd({ ...gdForm, groups: gdGroups }).then(() => { pushActivity(activity); }).catch(() => { pushActivity(activity); });
          } else pushActivity(activity);
          setActiveFlow(null); setModalOpen(false); setGdStep(1); setGdGroups([]);
        }

        function saveAssessment() {
          const activity = { type: 'Assessment', title: assessForm.title || assessForm.type, dateTime: `${assessForm.date} ${assessForm.time}`, createdBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Admin', status: 'Scheduled', details: { form: assessForm, assigned: assessSelected } };
          if (adminAPI && adminAPI.createAssessment) {
            adminAPI.createAssessment({ ...assessForm, assigned: assessSelected }).then(() => pushActivity(activity)).catch(() => pushActivity(activity));
          } else pushActivity(activity);
          setActiveFlow(null); setModalOpen(false); setAssessStep(1); setAssessSelected([]);
        }

        /* --- New visual components inside the file --- */
        function StatCard({ value, label, tone='Primary' }) {
          return (
            <div className="nm-stat-card">
              <div className="nm-stat-left">
                <div className="nm-stat-value">{value}</div>
                <div className="nm-stat-label">{label}</div>
              </div>
              <div className="nm-stat-ico">{tone==='Primary' ? '★' : '•'}</div>
            </div>
          );
        }

        function ActionPill({ title, desc, onClick }) {
          return (
            <button className="nm-action-pill" onClick={onClick}>
              <div className="nm-pill-left">
                <div className="nm-pill-ico">➤</div>
                <div>
                  <div className="nm-pill-title">{title}</div>
                  <div className="nm-pill-desc">{desc}</div>
                </div>
              </div>
              <div className="nm-pill-cta">Open</div>
            </button>
          );
        }

                          
        function ActivitiesList({ items }) {
          return (
            <div className="nm-activities">
              {items.length === 0 && <div className="nm-empty">No activities yet.</div>}
              {items.map((a, i) => (
                <div className="nm-activity-item" key={i}>
                  <div className="nm-activity-left">{(a.type||'?')[0]}</div>
                  <div className="nm-activity-main">
                    <div className="nm-activity-title">{a.title || a.type}</div>
                    <div className="nm-activity-meta">{a.dateTime} • {a.createdBy} <span className="nm-chip">{a.status}</span></div>
                  </div>
                </div>
              ))}
            </div>
          );
        }

        function RecentActivityTicker({ items, interval = 3000 }) {
          const [idx, setIdx] = useState(0);
          useEffect(() => {
            if (!items || items.length === 0) return;
            setIdx(0);
            const t = setInterval(() => setIdx(i => (i + 1) % items.length), interval);
            return () => clearInterval(t);
          }, [items, interval]);

          if (!items || items.length === 0) return <div className="nm-empty">No recent activity.</div>;
          const a = items[idx];
          // derive interviewer, primary student, and time from activity details
          // If `interviewer` is stored as trainer id, resolve to trainer name
          let interviewer = '';
          const rawInterviewer = a.details?.form?.interviewer;
          if (rawInterviewer) {
            const t = trainers.find(x => String(x.id) === String(rawInterviewer));
            interviewer = t ? t.name : rawInterviewer;
          }
          interviewer = interviewer || a.details?.form?.interviewerName || a.details?.form?.otherInterviewerName || a.createdBy || '';
          let studentLabel = '';
          if (Array.isArray(a.details?.slots) && a.details.slots.length) {
            const s = a.details.slots[0];
            studentLabel = `${s.studentName || ''}${s.psmsId ? ' • '+s.psmsId : ''}`.trim();
          } else if (a.details?.assigned && a.details.assigned.length) {
            const s = a.details.assigned[0];
            studentLabel = s.name || String(s);
          }
          const when = a.dateTime || (a.details?.form?.date ? `${a.details.form.date} ${a.details.form.startTime||a.details.form.time||''}` : '');
          const statusText = (a.status || '').toLowerCase();
          const badgeClass = statusText.includes('sched') || statusText.includes('schedule') ? 'nm-badge-scheduled' : statusText.includes('complete') || statusText.includes('done') ? 'nm-badge-completed' : 'nm-badge-neutral';
          const showBadge = !!a.status && !(statusText.includes('sched') || statusText.includes('schedule'));

          return (
            <div className="nm-ticker">
              <div className="nm-ticker-item" key={idx}>
                <div className="nm-mini-card">
                  <div className="nm-mini-left">{(a.type||'?')[0]}</div>
                  <div className="nm-mini-body">
                    <div className="nm-mini-title">{a.title || a.type}</div>
                    <div className="nm-mini-row"><strong>Interviewer</strong>: {interviewer || '—'}</div>
                    <div className="nm-mini-row"><strong>Student</strong>: {studentLabel || '—'}</div>
                    <div className="nm-mini-row"><strong>When</strong>: {when || '—'}</div>
                  </div>
                  {showBadge && <div className={"nm-mini-badge "+badgeClass}>{a.status}</div>}
                </div>
              </div>
            </div>
          );
        }

        /* Minimal flow modal content placeholder — opens existing flows when requested */
        function FlowModal({ flow }) {
          if (!flow) return null;
          return (
            <div className="nm-modal">
              <div className="nm-modal-header">
                <div>
                  <h3>{flow === 'interview' ? 'Schedule Interview' : flow === 'gd' ? 'Schedule Group Discussion' : 'Schedule Assessment'}</h3>
                  <div className="nm-modal-sub">A compact, guided form will appear here (keeps backend behavior).</div>
                </div>
                <div>
                  <button className="nm-close" onClick={() => setModalOpen(false)}>Close</button>
                </div>
              </div>
              <div style={{ padding: 18 }}>
                {flow === 'interview' && (
                  <div>
                    <div className="nm-form-grid">
                      <div className="nm-form-row">
                        <label>Interview Type</label>
                        <select value={interviewForm.interviewType} onChange={e => setInterviewForm(f => ({ ...f, interviewType: e.target.value }))}>
                          <option>HR</option>
                          <option>PI</option>
                          <option>Technical</option>
                        </select>
                      </div>
                      <div className="nm-form-row">
                        <label>Mode</label>
                        <select value={interviewForm.mode} onChange={e => setInterviewForm(f => ({ ...f, mode: e.target.value, groupId: '' }))}>
                          <option>Individual</option>
                          <option>Group</option>
                        </select>
                      </div>
                      {interviewForm.mode === 'Group' && (
                        <div className="nm-form-row">
                          <label>Select Group</label>
                          <select value={interviewForm.groupId || ''} onChange={e => {
                            const gid = e.target.value;
                            setInterviewForm(f => ({ ...f, groupId: gid }));
                            if (!gid) { setSelectedStudents([]); return; }
                            const g = groups.find(x => String(x._id||x.id) === String(gid));
                            if (!g) { setSelectedStudents([]); return; }
                            let ids = [];
                            if (Array.isArray(g.students) && g.students.length) {
                              if (typeof g.students[0] === 'object') ids = g.students.map(s => s._id||s.id||s);
                              else ids = g.students.slice();
                            } else if (Array.isArray(g.studentIds) && g.studentIds.length) ids = g.studentIds.slice();
                            const normalized = ids.map(idVal => {
                              const found = students.find(s => String(s.id) === String(idVal) || String(s.id) === String(idVal._id) || String(s.id) === String(idVal.id));
                              return found ? found.id : idVal;
                            });
                            setSelectedStudents(normalized);
                          }}>
                            <option value="">-- Select Group --</option>
                                  {groups.map(g => <option key={g._id||g.id} value={g._id||g.id}>{g.groupName||g.name||g.title||g.groupNumber||`Group ${g._id||g.id}`}</option>)}
                          </select>
                        </div>
                      )}

                      <div className="nm-form-row">
                        <label>Date</label>
                        <input type="date" value={interviewForm.date} onChange={e => setInterviewForm(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div className="nm-form-row">
                        <label>Start Time</label>
                        <input type="time" value={interviewForm.startTime} onChange={e => setInterviewForm(f => ({ ...f, startTime: e.target.value }))} />
                      </div>
                      <div className="nm-form-row">
                        <label>Per Interview (mins)</label>
                        <input type="number" value={interviewForm.perGap} onChange={e => setInterviewForm(f => ({ ...f, perGap: Number(e.target.value) }))} />
                      </div>
                      <div className="nm-form-row">
                        <label>Interviewer</label>
                        <select value={interviewForm.interviewer} onChange={e => setInterviewForm(f => ({ ...f, interviewer: e.target.value }))}>
                          <option value="">Select interviewer</option>
                          {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          <option value="__other">Other...</option>
                        </select>
                      </div>
                      {interviewForm.interviewer === '__other' && (
                        <div className="nm-form-row">
                          <label>Interviewer Name</label>
                          <input value={interviewForm.otherInterviewerName} onChange={e => setInterviewForm(f => ({ ...f, otherInterviewerName: e.target.value }))} placeholder="Enter interviewer name" />
                        </div>
                      )}
                    </div>

                    {interviewStep === 1 && (
                      <div className="nm-form-actions">
                        <button className="nm-btn-ghost" onClick={() => setInterviewStep(2)}>Next → Select Students</button>
                      </div>
                    )}

                    {interviewStep === 2 && (
                      <div>
                        <div style={{ marginTop:8 }}>
                          <input className="nm-search" placeholder="Search students" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>

                        {interviewForm.mode === 'Group' && interviewForm.groupId && (() => {
                          const g = groups.find(x => String(x._id||x.id) === String(interviewForm.groupId));
                          let members = [];
                          if (g) {
                            if (Array.isArray(g.students) && g.students.length) {
                              members = g.students.map(s => {
                                if (typeof s === 'object') return { id: s._id||s.id, name: s.name||s.fullName||s.email||String(s._id||s.id), psmsId: s.internId||s.psmsId||s.registrationId||s.mobile||'' };
                                const found = students.find(st => String(st.id) === String(s));
                                return found ? { id: found.id, name: found.name, psmsId: found.psmsId } : { id: s, name: String(s), psmsId: '' };
                              });
                            } else if (Array.isArray(g.studentIds) && g.studentIds.length) {
                              members = g.studentIds.map(id => {
                                const found = students.find(st => String(st.id) === String(id));
                                return found ? { id: found.id, name: found.name, psmsId: found.psmsId } : { id, name: String(id), psmsId: '' };
                              });
                            }
                          }
                          return (
                            <div style={{ marginTop:8, padding:8, border:'1px dashed #e6eef8', borderRadius:6 }}>
                              <div style={{ fontWeight:700 }}>Group Members ({members.length})</div>
                              <div style={{ maxHeight:180, overflow:'auto', marginTop:6 }}>
                                {members.length === 0 && <div className="nm-muted">No members found in this group.</div>}
                                {members.map((m, idx) => (
                                  <div key={String(m.id||idx)} className="nm-student-row">
                                    <div>{m.name}{m.psmsId ? ' • '+m.psmsId : ''}</div>
                                    <div>
                                      <input type="checkbox" checked={selectedStudents.map(String).includes(String(m.id))} onChange={() => toggleStudent(m.id)} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Hide full student list when a group is selected to avoid duplicate entries */}
                        {!(interviewForm.mode === 'Group' && interviewForm.groupId) && (
                          <div className="nm-student-list" style={{ marginTop:8 }}>
                            {students.filter(s => !search || (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.psmsId || '').toLowerCase().includes(search.toLowerCase())).map(s => (
                              <div key={s.id} className="nm-student-row">
                                <div>{s.name} • {s.psmsId}</div>
                                <div><input type="checkbox" checked={selectedStudents.map(String).includes(String(s.id))} onChange={() => toggleStudent(s.id)} /></div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="nm-form-actions">
                          <button className="nm-btn-ghost" onClick={() => setInterviewStep(1)}>← Back</button>
                          <button className="nm-btn-primary" onClick={() => generateSlots()}>Generate Schedule</button>
                        </div>
                      </div>
                    )}

                    {interviewStep === 4 && (
                      <div>
                        <h4>Preview Slots</h4>
                        <div style={{ maxHeight: 260, overflow:'auto', borderTop:'1px solid #f1f5f9', marginTop:8 }}>
                          <table className="nm-table">
                            <thead><tr><th>Slot</th><th>Time</th><th>Student</th><th>Actions</th></tr></thead>
                            <tbody>
                              {generatedSlots.map((s,i) => (
                                <tr key={i}>
                                  <td>{s.slotNo}</td>
                                  <td>
                                    <input value={s.time} onChange={e => editSlotTime(i, e.target.value)} style={{ border:'none', background:'transparent', padding:6, borderRadius:6 }} />
                                  </td>
                                  <td>{s.studentName} • {s.psmsId}</td>
                                  <td>
                                    <button className="nm-btn-ghost" onClick={() => removeSlot(s.studentId)}>Remove</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="nm-form-actions">
                          <button className="nm-btn-ghost" onClick={() => setInterviewStep(2)}>← Back</button>
                          <button className="nm-btn-primary" onClick={() => saveInterviewSchedule()}>Confirm & Save</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {flow === 'gd' && (
                  <div>
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
                        {gdForm.groupMode === 'Auto' && (
                          <>
                            <label>Group Size</label>
                            <input type="number" value={gdForm.groupSize} onChange={e => setGdForm(f => ({ ...f, groupSize: Number(e.target.value) }))} />
                            <div style={{ marginTop:12 }}><button className="nm-btn-primary" onClick={() => createGdGroups()}>Generate Groups</button></div>
                          </>
                        )}
                        {gdForm.groupMode === 'Manual' && (
                          <>
                            <p>Select students and click <strong>Create Group</strong></p>
                            <div style={{ maxHeight:200, overflow:'auto' }}>
                              {students.map(s => (
                                <div key={s.id} style={{ display:'flex', justifyContent:'space-between', padding:6 }}>
                                  <div>{s.name} • {s.psmsId}</div>
                                  <div><input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} /></div>
                                </div>
                              ))}
                            </div>
                            <div style={{ marginTop:8 }}>
                              <button className="nm-btn-primary" onClick={() => { if (selectedStudents.length){ const groupMembers = students.filter(x => selectedStudents.includes(x.id)); setGdGroups(prev=>[...prev, groupMembers]); setSelectedStudents([]); setGdStep(4); } }}>Create Group</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {gdStep === 4 && (
                      <div>
                        <h4>Preview Groups</h4>
                        {gdGroups.map((g, idx) => (<div key={idx} style={{ padding:8, borderBottom:'1px solid #f1f5f9' }}><strong>Group {idx+1}</strong><ul>{g.map(s => <li key={s.id}>{s.name}</li>)}</ul></div>))}
                        <div style={{ marginTop:12 }}><button className="nm-btn-primary" onClick={() => saveGd()}>Save & Notify</button></div>
                      </div>
                    )}
                  </div>
                )}

                {flow === 'assessment' && (
                  <div>
                    {assessStep === 1 && (
                      <div>
                        <label>Type</label>
                        <select value={assessForm.type} onChange={e => setAssessForm(f => ({ ...f, type: e.target.value }))}><option>Technical</option><option>Coding</option><option>Aptitude</option><option>Other</option></select>
                        <label>Title</label>
                        <input value={assessForm.title} onChange={e => setAssessForm(f => ({ ...f, title: e.target.value }))} />
                        <label>Date</label>
                        <input type="date" value={assessForm.date} onChange={e => setAssessForm(f => ({ ...f, date: e.target.value }))} />
                        <label>Assign To</label>
                        <select onChange={e => { const v = e.target.value; if (v === '__group'){ setAssessSelected([]); } else { setAssessSelected([]); } }}>
                          <option value="__individual">Individual Students</option>
                          <option value="__group">Group / Batch</option>
                        </select>
                        <div style={{ marginTop:12 }}><button className="nm-btn-primary" onClick={() => setAssessStep(2)}>Next → Select Students</button></div>
                      </div>
                    )}

                    {assessStep === 2 && (
                      <div>
                        <div style={{ marginBottom:8 }}>
                          <label>Or select a Group</label>
                          <select onChange={e => {
                            const gid = e.target.value;
                            if (!gid) return;
                            const g = groups.find(x => (x._id||x.id)==gid);
                            if (g) {
                              let ids = [];
                              if (Array.isArray(g.students) && g.students.length) ids = g.students.map(s=>s._id||s.id||s);
                              else if (Array.isArray(g.studentIds)) ids = g.studentIds;
                              setAssessSelected(ids);
                            }
                          }}>
                            <option value="">-- Select Group (optional) --</option>
                            {groups.map(g => <option key={g._id||g.id} value={g._id||g.id}>{g.groupName||g.name||g.title||g.groupNumber||`Group ${g._id||g.id}`}</option>)}
                          </select>
                        </div>
                        <div style={{ maxHeight:240, overflow:'auto' }}>{students.map(s => (<div key={s.id} style={{ display:'flex', justifyContent:'space-between', padding:6 }}><div>{s.name}</div><div><input type="checkbox" checked={assessSelected.includes(s.id)} onChange={() => setAssessSelected(prev => prev.includes(s.id)?prev.filter(x=>x!==s.id):[...prev,s.id])} /></div></div>))}</div>
                        <div style={{ marginTop:12 }}><button className="nm-btn-primary" onClick={() => saveAssessment()}>Save & Notify</button></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="nm-page">
            <header className="nm-header">
              <div>
                <h1 className="nm-title">Activity Management</h1>
                <p className="nm-sub">Fresh modern UI — redesigned from scratch.</p>
              </div>
              <div className="nm-actions-right">
                <button className="nm-btn-ghost" onClick={() => setTab('overview')}>Overview</button>
                <button className="nm-btn-ghost" onClick={() => setTab('schedule')}>Schedule</button>
                <button className="nm-btn-ghost" onClick={() => setTab('activities')}>Activities</button>
              </div>
            </header>

            <section className="nm-stats">
              <StatCard value={students.length} label="Interns" />
              <StatCard value={activities.length} label="Recent Activities" tone="Secondary" />
              <StatCard value={activities.filter(a=>a.type==='Task' && a.status!=='Completed').length} label="Open Tasks" />
            </section>

            <main className="nm-main">
              <aside className="nm-left">
                <div className="nm-panel">
                  <h3>Quick Actions</h3>
                  <ActionPill title="Assign Task" desc="Create and assign tasks" onClick={() => onNavigate && onNavigate('create-task')} />
                  <ActionPill title="Schedule Interview" desc="One-to-one or group" onClick={() => openFlow('interview')} />
                  <ActionPill title="Schedule GD" desc="Create groups & schedule" onClick={() => openFlow('gd')} />
                  <ActionPill title="Schedule Assessment" desc="Assign test links" onClick={() => openFlow('assessment')} />
                </div>
              </aside>

              <section className="nm-center">
                {tab === 'overview' && (
                  <div className="nm-panel">
                    <h3>Overview</h3>
                    <p className="nm-muted">Snapshot of activities and scheduling performance.</p>
                    <div style={{ marginTop: 14 }}>
                      <div className="nm-grid">
                        <div className="nm-card big">Upcoming: <strong>{stats.upcoming}</strong></div>
                        <div className="nm-card big">Completed: <strong>{stats.completed}</strong></div>
                        <div className="nm-card">Avg. Response Time: <strong>—</strong></div>
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'schedule' && (
                  <div className="nm-panel">
                    <h3>Schedule</h3>
                    <p className="nm-muted">Use quick actions to begin scheduling. This UI is a clean starting point.</p>
                    <div style={{ marginTop: 12 }}>
                      <div className="nm-card">
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div style={{ fontWeight:700 }}>Create Schedule</div>
                          <div className="nm-tag">New</div>
                        </div>
                        <div style={{ marginTop:10 }}>
                          <p className="nm-muted">Start by choosing an action on the left to create schedules backed by real data.</p>
                          <div style={{ marginTop:8 }}>
                            <button className="nm-btn-primary" onClick={() => openFlow('interview')}>Start Interview Flow</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'activities' && (
                  <div className="nm-panel">
                    <h3>Recent Activities</h3>
                    <ActivitiesList items={activities} />
                  </div>
                )}
              </section>

              <aside className="nm-right">
                <div className="nm-panel">
                  <h4>Recent Activity</h4>
                  <RecentActivityTicker items={activities.slice(0,8)} interval={3500} />
                </div>
              </aside>
            </main>

            {modalOpen && <div className="nm-modal-overlay" onClick={() => setModalOpen(false)}><div onClick={e=>e.stopPropagation()}><FlowModal flow={activeFlow} /></div></div>}
          </div>
        );
      }
