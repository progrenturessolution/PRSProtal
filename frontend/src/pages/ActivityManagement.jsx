import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from 'react-dom';
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
        // Load existing activities from localStorage (do not clear on mount)
        const [activities, setActivities] = useState(() => {
          try { return JSON.parse(localStorage.getItem('recentActivities') || '[]'); } catch (e) { return []; }
        });

        // Persist activities to localStorage whenever they change
        useEffect(() => { try { localStorage.setItem('recentActivities', JSON.stringify(activities)); } catch (e) {} }, [activities]);

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
        const [gdForm, setGdForm] = useState({ title: '', date: '', startTime: '09:00', groupMode: 'Auto', groupSize: 5, interviewer: '', otherInterviewerName: '' });
        const [gdGroups, setGdGroups] = useState([]);
        const [gdSelectedGroups, setGdSelectedGroups] = useState([]);
        const gdTitleRef = useRef(null);
        const assignTitleRef = useRef(null);
          const interviewDateRef = useRef(null);
          const interviewTimeRef = useRef(null);
          const interviewPerGapRef = useRef(null);
          const interviewerOtherRef = useRef(null);

          const gdDateRef = useRef(null);
          const gdTimeRef = useRef(null);
          const gdGroupSizeRef = useRef(null);
          const gdInterviewerOtherRef = useRef(null);
          const assessInterviewerOtherRef = useRef(null);
        const assignDescRef = useRef(null);
        const assessTitleRef = useRef(null);
        const assessDescRef = useRef(null);
        const assessDateRef = useRef(null);
        const assessTimeRef = useRef(null);
        const assessDurationRef = useRef(null);
        const assessLinkRef = useRef(null);
        const assignDateRef = useRef(null);
        const assignTimeRef = useRef(null);
        const assignDueDateRef = useRef(null);
        const assignDueTimeRef = useRef(null);

        const [assessStep, setAssessStep] = useState(1);
        const [assessForm, setAssessForm] = useState({ type: 'Technical', title: '', description: '', date: '', time: '09:00', duration: 60, link: '', interviewer: '', otherInterviewerName: '' });
        const [assessSelected, setAssessSelected] = useState([]);
        const [assignStep, setAssignStep] = useState(1);
        const [assignForm, setAssignForm] = useState({ title: '', description: '', date: '', time: '09:00', dueDate: '', dueTime: '09:00', interviewer: '', otherInterviewerName: '' });
        const [assignSelected, setAssignSelected] = useState([]);

        function openFlow(flow) { setActiveFlow(flow); setModalOpen(true); }

        function normalizeInterviewDate(rawDate) {
          const value = String(rawDate || '').trim();
          if (!value) return '';
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
          const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
          if (match) {
            const [, day, month, year] = match;
            return `${year}-${month}-${day}`;
          }
          return '';
        }

        // Simple helpers to add activities locally (keeps backend intact for real calls)
        function pushActivity(a) { setActivities(prev => [a, ...prev].slice(0, 40)); }

        function toggleStudent(id) { setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }

        function generateSlots(formValues = interviewForm) {
          const { date, startTime, perGap } = formValues;
          if (!date || !startTime) {
            alert('Please select an interview date and start time first.');
            return;
          }
          if (!selectedStudents.length) {
            alert('Please select at least one student before generating the schedule.');
            return;
          }
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

        function handleInterviewGenerate() {
          const date = normalizeInterviewDate(interviewDateRef && interviewDateRef.current ? interviewDateRef.current.value : interviewForm.date);
          const startTime = interviewTimeRef && interviewTimeRef.current ? interviewTimeRef.current.value : interviewForm.startTime;
          const perGap = interviewPerGapRef && interviewPerGapRef.current ? Number(interviewPerGapRef.current.value) : interviewForm.perGap;
          const otherInterviewerName = interviewerOtherRef && interviewerOtherRef.current ? interviewerOtherRef.current.value : interviewForm.otherInterviewerName;
          const nextForm = { ...interviewForm, date, startTime, perGap, otherInterviewerName };
          setInterviewForm(nextForm);
          generateSlots(nextForm);
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
          // Prepare interviewer info similar to interview flow
          let trainerId = null;
          let interviewerName = null;
          const title = gdTitleRef && gdTitleRef.current ? gdTitleRef.current.value : gdForm.title;
          const date = gdDateRef && gdDateRef.current ? gdDateRef.current.value : gdForm.date;
          const startTime = gdTimeRef && gdTimeRef.current ? gdTimeRef.current.value : gdForm.startTime;
          const groupSize = gdGroupSizeRef && gdGroupSizeRef.current ? Number(gdGroupSizeRef.current.value) : gdForm.groupSize;
          const otherInterviewerName = gdInterviewerOtherRef && gdInterviewerOtherRef.current ? gdInterviewerOtherRef.current.value : gdForm.otherInterviewerName;
          if (gdForm.interviewer && gdForm.interviewer !== '__other') {
            trainerId = gdForm.interviewer;
            const selectedTrainer = trainers.find(t => String(t.id) === String(gdForm.interviewer));
            interviewerName = selectedTrainer ? selectedTrainer.name : null;
          } else if (gdForm.interviewer === '__other') {
            interviewerName = otherInterviewerName || null;
          }

          // Attempt backend call (not implemented in every API) then update UI
          const activity = { type: 'GD', title: title || 'Group Discussion', dateTime: `${date} ${startTime}`, createdBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Admin', status: 'Scheduled', details: { form: { ...gdForm, title, date, startTime, groupSize, otherInterviewerName, trainerId, interviewerName }, groups: gdGroups } };

          // Validate interviewer when backend present (mirror interview flow)
          if (adminAPI && adminAPI.createGd && !trainerId && !interviewerName) {
            alert('Please select or enter an interviewer before scheduling the GD.');
            return;
          }

          // If backend API exists, call it (placeholder)
          if (adminAPI && adminAPI.createGd) {
            adminAPI.createGd({ ...gdForm, title, date, startTime, groupSize, otherInterviewerName, groups: gdGroups, trainerId, interviewerName }).then(() => {
              pushActivity(activity);
              alert('GD scheduled successfully.');
            }).catch(() => {
              pushActivity(activity);
              alert('GD scheduled locally. Backend sync failed, but the schedule was saved in the UI.');
            });
          } else {
            pushActivity(activity);
            alert('GD scheduled successfully.');
          }
          // Also persist a lightweight scheduled GD to localStorage so other connected clients (interns/trainers) can pick it up when the backend integration is missing.
          try {
            const existing = JSON.parse(localStorage.getItem('scheduledGDs') || '[]');
            existing.unshift(activity);
            localStorage.setItem('scheduledGDs', JSON.stringify(existing.slice(0, 200)));
          } catch (e) { /* ignore storage errors */ }

          setActiveFlow(null); setModalOpen(false); setGdStep(1); setGdGroups([]);
        }

        function saveAssessment() {
          alert('Scheduling assessment...');
          // Prepare interviewer info
          let trainerId = null;
          let interviewerName = null;
          const otherInterviewerName = assessInterviewerOtherRef && assessInterviewerOtherRef.current ? assessInterviewerOtherRef.current.value : assessForm.otherInterviewerName;
          if (assessForm.interviewer && assessForm.interviewer !== '__other') {
            trainerId = assessForm.interviewer;
            const selectedTrainer = trainers.find(t => String(t.id) === String(assessForm.interviewer));
            interviewerName = selectedTrainer ? selectedTrainer.name : null;
          } else if (assessForm.interviewer === '__other') {
            interviewerName = otherInterviewerName || null;
          }

          const payload = { ...assessForm, assigned: assessSelected, trainerId, interviewerName };
          const activity = { type: 'Assessment', title: assessForm.title || assessForm.type, dateTime: `${assessForm.date} ${assessForm.time}`, createdBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Admin', status: 'Scheduled', details: { form: { ...assessForm, otherInterviewerName, trainerId, interviewerName }, assigned: assessSelected } };

          if (adminAPI && adminAPI.createAssessment) {
            adminAPI.createAssessment(payload).then(() => {
              pushActivity(activity);
              alert('Assessment scheduled successfully.');
            }).catch(() => {
              pushActivity(activity);
              alert('Assessment scheduled locally. Backend sync failed, but the schedule was saved in the UI.');
            });
          } else {
            pushActivity(activity);
            alert('Assessment scheduled successfully.');
          }

          setActiveFlow(null); setModalOpen(false); setAssessStep(1); setAssessSelected([]); setAssessForm({ type: 'Technical', title: '', description: '', date: '', time: '09:00', duration: 60, link: '', interviewer: '', otherInterviewerName: '' }); setSearch('');
        }

        function handleAssessNext() {
          const title = assessTitleRef && assessTitleRef.current ? assessTitleRef.current.value : '';
          const description = assessDescRef && assessDescRef.current ? assessDescRef.current.value : '';
          const date = assessDateRef && assessDateRef.current ? assessDateRef.current.value : assessForm.date;
          const time = assessTimeRef && assessTimeRef.current ? assessTimeRef.current.value : assessForm.time;
          const duration = assessDurationRef && assessDurationRef.current ? Number(assessDurationRef.current.value) : assessForm.duration;
          const link = assessLinkRef && assessLinkRef.current ? assessLinkRef.current.value : assessForm.link;
          setAssessForm(f => ({ ...f, title, description, date, time, duration, link }));
          setAssessStep(2);
        }

        function handleGdGenerate() {
          const title = gdTitleRef && gdTitleRef.current ? gdTitleRef.current.value : '';
          const date = gdDateRef && gdDateRef.current ? gdDateRef.current.value : gdForm.date;
          const startTime = gdTimeRef && gdTimeRef.current ? gdTimeRef.current.value : gdForm.startTime;
          const groupSize = gdGroupSizeRef && gdGroupSizeRef.current ? Number(gdGroupSizeRef.current.value) : gdForm.groupSize;
          const otherInterviewerName = gdInterviewerOtherRef && gdInterviewerOtherRef.current ? gdInterviewerOtherRef.current.value : gdForm.otherInterviewerName;
          setGdForm(f => ({ ...f, title, date, startTime, groupMode: f.groupMode, groupSize, otherInterviewerName }));
          setTimeout(() => { if (typeof createGdGroups === 'function') createGdGroups(); }, 0);
        }

        function handleGdManualCreate() {
          const title = gdTitleRef && gdTitleRef.current ? gdTitleRef.current.value : '';
          const date = gdDateRef && gdDateRef.current ? gdDateRef.current.value : gdForm.date;
          setGdForm(f => ({ ...f, title, date }));
          setTimeout(() => {
            if (gdSelectedGroups.length){
              const created = gdSelectedGroups.map(gid => {
                const g = groups.find(x => String(x._id||x.id) === String(gid));
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
                return members;
              }).filter(Boolean);
              setGdGroups(created);
              setGdSelectedGroups([]);
              setGdStep(4);
            } else alert('Select at least one group to include in GD');
          }, 0);
        }

        function saveAssignment() {
          alert('Scheduling assignment...');
          // Prepare interviewer info
          let trainerId = null;
          let interviewerName = null;
          if (assignForm.interviewer && assignForm.interviewer !== '__other') {
            trainerId = assignForm.interviewer;
            const selectedTrainer = trainers.find(t => String(t.id) === String(assignForm.interviewer));
            interviewerName = selectedTrainer ? selectedTrainer.name : null;
          } else if (assignForm.interviewer === '__other') {
            interviewerName = assignForm.otherInterviewerName || null;
          }

          const payload = { ...assignForm, assigned: assignSelected, trainerId, interviewerName };

          const activity = { type: 'Assignment', title: assignForm.title || 'Assignment', dateTime: `${assignForm.date || assignForm.dueDate} ${assignForm.time || assignForm.dueTime}`, createdBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Admin', status: 'Scheduled', details: { form: { ...assignForm, trainerId, interviewerName }, assigned: assignSelected } };

          if (adminAPI && adminAPI.scheduleAssignment) {
            adminAPI.scheduleAssignment(payload).then(() => {
              pushActivity(activity);
              alert('Assignment scheduled successfully.');
            }).catch(() => {
              pushActivity(activity);
              alert('Assignment scheduled locally. Backend sync failed, but the schedule was saved in the UI.');
            });
          } else {
            pushActivity(activity);
            alert('Assignment scheduled successfully.');
          }

          setActiveFlow(null); setModalOpen(false); setAssignStep(1); setAssignSelected([]); setAssignForm({ title: '', description: '', date: '', time: '09:00', dueDate: '', dueTime: '09:00', interviewer: '', otherInterviewerName: '' }); setSearch('');
        }

        function handleAssignNext() {
          const title = assignTitleRef && assignTitleRef.current ? assignTitleRef.current.value : '';
          const description = assignDescRef && assignDescRef.current ? assignDescRef.current.value : '';
          const date = assignDateRef && assignDateRef.current ? assignDateRef.current.value : assignForm.date;
          const time = assignTimeRef && assignTimeRef.current ? assignTimeRef.current.value : assignForm.time;
          const dueDate = assignDueDateRef && assignDueDateRef.current ? assignDueDateRef.current.value : assignForm.dueDate;
          const dueTime = assignDueTimeRef && assignDueTimeRef.current ? assignDueTimeRef.current.value : assignForm.dueTime;
          setAssignForm(f => ({ ...f, title, description, date, time, dueDate, dueTime }));
          setAssignStep(2);
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
        const FlowModal = useMemo(() => function FlowModal({ flow, ctx }) {
          if (!flow) return null;
          const {
            setModalOpen,
            students,
            trainers,
            groups,
            interviewForm,
            setInterviewForm,
            interviewStep,
            setInterviewStep,
            selectedStudents,
            setSelectedStudents,
            generatedSlots,
            setGeneratedSlots,
            search,
            setSearch,
            gdForm,
            setGdForm,
            gdStep,
            setGdStep,
            gdGroups,
            setGdGroups,
            gdSelectedGroups,
            setGdSelectedGroups,
            gdTitleRef,
            gdDateRef,
            gdTimeRef,
            gdGroupSizeRef,
            gdInterviewerOtherRef,
            assessForm,
            setAssessForm,
            assessStep,
            setAssessStep,
            assessSelected,
            setAssessSelected,
            assessTitleRef,
            assessDescRef,
            assessDateRef,
            assessTimeRef,
            assessDurationRef,
            assessLinkRef,
            assessInterviewerOtherRef,
            assignForm,
            setAssignForm,
            assignStep,
            setAssignStep,
            assignSelected,
            setAssignSelected,
            assignTitleRef,
            assignDescRef,
            assignDateRef,
            assignTimeRef,
            assignDueDateRef,
            assignDueTimeRef,
            interviewerOtherRef,
            handleInterviewGenerate,
            saveInterviewSchedule,
            handleGdGenerate,
            handleGdManualCreate,
            saveGd,
            handleAssessNext,
            saveAssessment,
            handleAssignNext,
            saveAssignment,
          } = ctx;
          // Intentionally not auto-focusing inputs here to avoid stealing focus
          // during user typing. Focus is managed by the browser/user interaction.

          const modalRef = useRef(null);

          useEffect(() => {
            const modalEl = modalRef.current;
            if (!modalEl) return;

            let lastFocused = null;
            let pointerDown = false;

            function onPointerDown() { pointerDown = true; }
            function onPointerUp() { setTimeout(() => { pointerDown = false; }, 0); }

            function onFocusIn(e) {
              const t = e.target;
              if (modalEl.contains(t) && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
                lastFocused = t;
              }
            }

            function onKeyDown(e) {
              if (modalEl.contains(e.target)) {
                // Prevent outside handlers from reacting to typing inside modal
                e.stopPropagation();
              }
            }

            function onKeyUp(e) {
              if (modalEl.contains(e.target)) {
                e.stopPropagation();
              }
            }

            document.addEventListener('pointerdown', onPointerDown, true);
            document.addEventListener('pointerup', onPointerUp, true);
            document.addEventListener('focusin', onFocusIn, true);
            document.addEventListener('keydown', onKeyDown, true);
            document.addEventListener('keyup', onKeyUp, true);

            return () => {
              document.removeEventListener('pointerdown', onPointerDown, true);
              document.removeEventListener('pointerup', onPointerUp, true);
              document.removeEventListener('focusin', onFocusIn, true);
              document.removeEventListener('keydown', onKeyDown, true);
              document.removeEventListener('keyup', onKeyUp, true);
            };
          }, []);

          return (
            <div className="nm-modal" ref={modalRef}>
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
                        <input
                          ref={interviewDateRef}
                          type="date"
                          value={interviewForm.date}
                          onChange={e => setInterviewForm(f => ({ ...f, date: e.target.value }))}
                        />
                      </div>
                      <div className="nm-form-row">
                        <label>Start Time</label>
                        <input
                          ref={interviewTimeRef}
                          type="time"
                          value={interviewForm.startTime}
                          onChange={e => setInterviewForm(f => ({ ...f, startTime: e.target.value }))}
                        />
                      </div>
                      <div className="nm-form-row">
                        <label>Per Interview (mins)</label>
                        <input
                          ref={interviewPerGapRef}
                          type="number"
                          value={interviewForm.perGap}
                          onChange={e => setInterviewForm(f => ({ ...f, perGap: Number(e.target.value) || 0 }))}
                        />
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
                          <input
                            ref={interviewerOtherRef}
                            value={interviewForm.otherInterviewerName}
                            onChange={e => setInterviewForm(f => ({ ...f, otherInterviewerName: e.target.value }))}
                            placeholder="Enter interviewer name"
                          />
                        </div>
                      )}
                    </div>

                    {interviewStep === 1 && (
                      <div className="nm-form-actions">
                        <button className="nm-btn-ghost" onClick={() => setInterviewStep(2)}>Next → Select Students</button>
                        <button className="nm-btn-primary" style={{ display: 'none' }} onClick={() => {}}> </button>
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
                          <button className="nm-btn-primary" onClick={() => handleInterviewGenerate()}>Generate Schedule</button>
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
                        <div className="nm-form-grid">
                          <div className="nm-form-row">
                            <label>GD Title</label>
                            <input
                              ref={gdTitleRef}
                              value={gdForm.title}
                              onChange={e => setGdForm(f => ({ ...f, title: e.target.value }))}
                              placeholder="GD Topic / Title"
                              onMouseDown={e => e.stopPropagation()}
                              onClick={e => e.stopPropagation()}
                              onKeyDown={e => e.stopPropagation()}
                              onKeyUp={e => e.stopPropagation()}
                            />
                          </div>

                          <div className="nm-form-row">
                            <label>Date</label>
                            <input
                              ref={gdDateRef}
                              type="date"
                              value={gdForm.date}
                              onChange={e => setGdForm(f => ({ ...f, date: e.target.value }))}
                            />
                          </div>

                          <div className="nm-form-row">
                            <label>Start Time</label>
                            <input
                              ref={gdTimeRef}
                              type="time"
                              value={gdForm.startTime}
                              onChange={e => setGdForm(f => ({ ...f, startTime: e.target.value }))}
                            />
                          </div>

                          <div className="nm-form-row">
                            <label>Group Mode</label>
                            <select value={gdForm.groupMode} onChange={e => setGdForm(f => ({ ...f, groupMode: e.target.value }))}>
                              <option value="Auto">Auto Group</option>
                              <option value="Manual">Manual</option>
                            </select>
                          </div>

                          {gdForm.groupMode === 'Auto' && (
                            <div className="nm-form-row">
                              <label>Group Size</label>
                              <input
                                ref={gdGroupSizeRef}
                                type="number"
                                value={gdForm.groupSize}
                                onChange={e => setGdForm(f => ({ ...f, groupSize: Number(e.target.value) || 0 }))}
                              />
                            </div>
                          )}

                          <div className="nm-form-row">
                            <label>Interviewer</label>
                            <select value={gdForm.interviewer} onChange={e => setGdForm(f => ({ ...f, interviewer: e.target.value }))}>
                              <option value="">Select interviewer</option>
                              {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              <option value="__other">Other...</option>
                            </select>
                          </div>
                          {gdForm.interviewer === '__other' && (
                            <div className="nm-form-row">
                              <label>Interviewer Name</label>
                              <input ref={gdInterviewerOtherRef} defaultValue={gdForm.otherInterviewerName} placeholder="Enter interviewer name" />
                            </div>
                          )}

                          {gdForm.groupMode === 'Manual' && (
                            <div className="nm-form-row" style={{ gridColumn: '1 / -1' }}>
                              <label>Select Existing Groups</label>
                              <div style={{ maxHeight:200, overflow:'auto', border:'1px solid #eef6ff', padding:8, borderRadius:6 }}>
                                {groups.length === 0 && <div className="nm-muted">No groups found. Create groups in Group Management first.</div>}
                                {groups.map(g => {
                                  const gid = g._id||g.id;
                                  const label = g.groupName||g.name||g.title||g.groupNumber||`Group ${gid}`;
                                  return (
                                    <div key={gid} style={{ display:'flex', justifyContent:'space-between', padding:6 }}>
                                      <div>{label} <small style={{opacity:0.7}}>({Array.isArray(g.students)?g.students.length: (Array.isArray(g.studentIds)?g.studentIds.length:0)} members)</small></div>
                                      <div><input type="checkbox" checked={gdSelectedGroups.map(String).includes(String(gid))} onChange={() => {
                                        setGdSelectedGroups(prev => prev.map(String).includes(String(gid)) ? prev.filter(x=>String(x)!==String(gid)) : [...prev, gid]);
                                      }} /></div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="nm-form-actions">
                          <button className="nm-btn-ghost" onClick={() => setGdStep(1)}>← Back</button>
                          {gdForm.groupMode === 'Auto' ? (
                            <button className="nm-btn-primary" onClick={() => handleGdGenerate()}>Generate Groups</button>
                          ) : (
                            <button className="nm-btn-primary" onClick={() => handleGdManualCreate()}>Create Group</button>
                          )}
                        </div>
                      </div>
                    )}

                    {gdStep === 4 && (
                      <div>
                        <h4>Preview Groups</h4>
                        <div style={{ maxHeight: 320, overflow:'auto', borderTop:'1px solid #f1f5f9', marginTop:8 }}>
                          {gdGroups.length === 0 && <div className="nm-muted">No groups created yet.</div>}
                          {gdGroups.map((g, idx) => (
                            <div key={idx} style={{ padding:8, borderBottom:'1px solid #f1f5f9' }}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <strong>Group {idx+1}</strong>
                                <div>{g.length} members</div>
                              </div>
                              <ul style={{ marginTop:8 }}>{g.map(s => <li key={s.id}>{s.name}</li>)}</ul>
                            </div>
                          ))}
                        </div>
                        <div className="nm-form-actions">
                          <button className="nm-btn-ghost" onClick={() => setGdStep(1)}>← Back</button>
                          <button className="nm-btn-primary" onClick={() => saveGd()}>Save & Notify</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {flow === 'assessment' && (
                  <div>
                    {assessStep === 1 && (
                      <div>
                        <div className="nm-form-grid">
                          <div className="nm-form-row">
                            <label>Assessment Type</label>
                            <select value={assessForm.type} onChange={e => setAssessForm(f => ({ ...f, type: e.target.value }))}>
                              <option value="Technical">Technical</option>
                              <option value="Coding">Coding</option>
                              <option value="Aptitude">Aptitude</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="nm-form-row">
                            <label>Assessment Title</label>
                            <input ref={assessTitleRef} value={assessForm.title} onChange={e => setAssessForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Technical Round 1" onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()} />
                          </div>

                          <div className="nm-form-row">
                            <label>Description</label>
                            <textarea ref={assessDescRef} value={assessForm.description} onChange={e => setAssessForm(f => ({ ...f, description: e.target.value }))} placeholder="Assessment details and instructions" style={{ minHeight: '80px', fontFamily: 'inherit', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }} onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()} />
                          </div>

                          <div className="nm-form-row">
                            <label>Date</label>
                            <input ref={assessDateRef} type="date" value={assessForm.date} onChange={e => setAssessForm(f => ({ ...f, date: e.target.value }))} />
                          </div>

                          <div className="nm-form-row">
                            <label>Start Time</label>
                            <input ref={assessTimeRef} type="time" value={assessForm.time} onChange={e => setAssessForm(f => ({ ...f, time: e.target.value }))} />
                          </div>

                          <div className="nm-form-row">
                            <label>Duration (minutes)</label>
                            <input ref={assessDurationRef} type="number" value={assessForm.duration} onChange={e => setAssessForm(f => ({ ...f, duration: Number(e.target.value) || 0 }))} min="15" step="15" />
                          </div>

                          <div className="nm-form-row">
                            <label>Assessment Link / URL</label>
                            <input ref={assessLinkRef} type="url" value={assessForm.link} onChange={e => setAssessForm(f => ({ ...f, link: e.target.value }))} placeholder="https://example.com/assessment" />
                          </div>

                          <div className="nm-form-row">
                            <label>Interviewer</label>
                            <select value={assessForm.interviewer || ''} onChange={e => setAssessForm(f => ({ ...f, interviewer: e.target.value }))}>
                              <option value="">Select interviewer (optional)</option>
                              {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              <option value="__other">Other...</option>
                            </select>
                          </div>

                          <div className="nm-form-row" style={{ display: assessForm.interviewer === '__other' ? 'block' : 'none' }}>
                            <label>Interviewer Name</label>
                            <input ref={assessInterviewerOtherRef} defaultValue={assessForm.otherInterviewerName || ''} placeholder="Enter interviewer name" />
                          </div>
                        </div>

                        <div className="nm-form-actions">
                          <button className="nm-btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                          <button className="nm-btn-primary" onClick={() => handleAssessNext()}>Next → Select Students</button>
                        </div>
                      </div>
                    )}

                    {assessStep === 2 && (
                      <div>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Select Existing Group (Optional)</label>
                          <select onChange={e => { const gid = e.target.value; if (!gid) return; const g = groups.find(x => String(x._id || x.id) === String(gid)); if (g) { let ids = []; if (Array.isArray(g.students) && g.students.length) { ids = g.students.map(s => s._id || s.id || s); } else if (Array.isArray(g.studentIds)) { ids = g.studentIds; } setAssessSelected(ids); } }} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                            <option value="">-- Select Group (auto-select members) --</option>
                            {groups.map(g => <option key={g._id || g.id} value={g._id || g.id}>{g.groupName || g.name || g.title || g.groupNumber || `Group ${g._id || g.id}`}</option>)}
                          </select>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <input className="nm-search" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
                        </div>

                        <div style={{ maxHeight: '240px', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px' }}>
                          {students.length === 0 ? <div className="nm-muted">No students found</div> : students.filter(s => !search || (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.psmsId || '').toLowerCase().includes(search.toLowerCase())).map(s => (
                            <div key={s.id} className="nm-student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ flex: 1 }}>
                                {s.name}
                                {s.psmsId && <div style={{ fontSize: '12px', color: '#9ca3af' }}>ID: {s.psmsId}</div>}
                              </div>
                              <div>
                                <input type="checkbox" checked={assessSelected.map(String).includes(String(s.id))} onChange={() => setAssessSelected(prev => prev.map(String).includes(String(s.id)) ? prev.filter(x => String(x) !== String(s.id)) : [...prev, s.id])} />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="nm-form-actions" style={{ marginTop: '16px' }}>
                          <button className="nm-btn-ghost" onClick={() => setAssessStep(1)}>← Back</button>
                          <button className="nm-btn-primary" onClick={() => saveAssessment()} disabled={assessSelected.length === 0}>Save & Send Assessment ({assessSelected.length} student{assessSelected.length !== 1 ? 's' : ''})</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {flow === 'assignment' && (
                  <div>
                    {assignStep === 1 && (
                      <div>
                        <div className="nm-form-grid">
                          <div className="nm-form-row">
                            <label>Assignment Title</label>
                            <input ref={assignTitleRef} value={assignForm.title} onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Project Deliverable 1" onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()} />
                          </div>

                          <div className="nm-form-row">
                            <label>Description</label>
                            <textarea ref={assignDescRef} value={assignForm.description} onChange={e => setAssignForm(f => ({ ...f, description: e.target.value }))} placeholder="Assignment details and instructions" style={{ minHeight: '80px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }} onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()} />
                          </div>

                          <div className="nm-form-row"><label>Assign Date</label><input ref={assignDateRef} type="date" defaultValue={assignForm.date} /></div>
                          <div className="nm-form-row"><label>Assign Time</label><input ref={assignTimeRef} type="time" defaultValue={assignForm.time} /></div>
                          <div className="nm-form-row"><label>Due Date</label><input ref={assignDueDateRef} type="date" defaultValue={assignForm.dueDate} /></div>
                          <div className="nm-form-row"><label>Due Time</label><input ref={assignDueTimeRef} type="time" defaultValue={assignForm.dueTime} /></div>

                          <div className="nm-form-row">
                            <label>Interviewer</label>
                            <select value={assignForm.interviewer || ''} onChange={e => setAssignForm(f => ({ ...f, interviewer: e.target.value }))}>
                              <option value="">Select interviewer (optional)</option>
                              {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              <option value="__other">Other...</option>
                            </select>
                          </div>

                          <div className="nm-form-row" style={{ display: assignForm.interviewer === '__other' ? 'block' : 'none' }}>
                            <label>Interviewer Name</label>
                            <input value={assignForm.otherInterviewerName || ''} onChange={e => setAssignForm(f => ({ ...f, otherInterviewerName: e.target.value }))} placeholder="Enter interviewer name" />
                          </div>
                        </div>

                        <div className="nm-form-actions">
                          <button className="nm-btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                          <button className="nm-btn-primary" onClick={() => handleAssignNext()}>Next → Select Students</button>
                        </div>
                      </div>
                    )}

                    {assignStep === 2 && (
                      <div>
                        <div style={{ marginBottom: '12px' }}><input className="nm-search" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} /></div>

                        <div style={{ maxHeight: '240px', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px' }}>
                          {students.length === 0 ? <div className="nm-muted">No students found</div> : students.filter(s => !search || (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.psmsId || '').toLowerCase().includes(search.toLowerCase())).map(s => (
                            <div key={s.id} className="nm-student-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ flex: 1 }}>{s.name}{s.psmsId && <div style={{ fontSize: '12px', color: '#9ca3af' }}>ID: {s.psmsId}</div>}</div>
                              <div><input type="checkbox" checked={assignSelected.map(String).includes(String(s.id))} onChange={() => setAssignSelected(prev => prev.map(String).includes(String(s.id)) ? prev.filter(x => String(x) !== String(s.id)) : [...prev, s.id])} /></div>
                            </div>
                          ))}
                        </div>

                        <div className="nm-form-actions" style={{ marginTop: '16px' }}>
                          <button className="nm-btn-ghost" onClick={() => setAssignStep(1)}>← Back</button>
                          <button className="nm-btn-primary" onClick={() => saveAssignment()} disabled={assignSelected.length === 0}>Save & Schedule ({assignSelected.length} student{assignSelected.length !== 1 ? 's' : ''})</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }, []);

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

            {modalOpen && createPortal(
              <div className="nm-modal-overlay" onClick={() => setModalOpen(false)}>
                <div
                  onClick={e => e.stopPropagation()}
                  onMouseDownCapture={e => e.stopPropagation()}
                  onPointerDownCapture={e => e.stopPropagation()}
                  onKeyDownCapture={e => e.stopPropagation()}
                  onKeyUpCapture={e => e.stopPropagation()}
                >
                  <FlowModal
                    flow={activeFlow}
                    ctx={{
                      setModalOpen,
                      students,
                      trainers,
                      groups,
                      interviewForm,
                      setInterviewForm,
                      interviewStep,
                      setInterviewStep,
                      selectedStudents,
                      setSelectedStudents,
                      generatedSlots,
                      setGeneratedSlots,
                      search,
                      setSearch,
                      gdForm,
                      setGdForm,
                      gdStep,
                      setGdStep,
                      gdGroups,
                      setGdGroups,
                      gdSelectedGroups,
                      setGdSelectedGroups,
                      gdTitleRef,
                      gdDateRef,
                      gdTimeRef,
                      gdGroupSizeRef,
                      gdInterviewerOtherRef,
                      assessForm,
                      setAssessForm,
                      assessStep,
                      setAssessStep,
                      assessSelected,
                      setAssessSelected,
                      assessTitleRef,
                      assessDescRef,
                      assessDateRef,
                      assessTimeRef,
                      assessDurationRef,
                      assessLinkRef,
                      assessInterviewerOtherRef,
                      assignForm,
                      setAssignForm,
                      assignStep,
                      setAssignStep,
                      assignSelected,
                      setAssignSelected,
                      assignTitleRef,
                      assignDescRef,
                      assignDateRef,
                      assignTimeRef,
                      assignDueDateRef,
                      assignDueTimeRef,
                      interviewerOtherRef,
                      handleInterviewGenerate,
                      saveInterviewSchedule,
                      handleGdGenerate,
                      handleGdManualCreate,
                      saveGd,
                      handleAssessNext,
                      saveAssessment,
                      handleAssignNext,
                      saveAssignment,
                    }}
                  />
                </div>
              </div>,
              document.body
            )}
          </div>
        );
      }
