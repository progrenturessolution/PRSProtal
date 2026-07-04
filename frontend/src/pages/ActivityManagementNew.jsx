import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { adminAPI } from '../services/api';
import './ActivityManagementNew.css';

function IconCard({ title, onClick }) {
  return (
    <button className="am-card" onClick={onClick}>
      <div className="am-card-title">{title}</div>
    </button>
  );
}

export default function ActivityManagementNew() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showGDModal, setShowGDModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [editActivity, setEditActivity] = useState(null);
  const [actionMenuPos, setActionMenuPos] = useState(null);
  const [viewActivity, setViewActivity] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Interview form
  const [interviewForm, setInterviewForm] = useState({ interviewType: 'HR', mode: 'Individual', date: '', startTime: '09:00', perGap: 15, interviewer: '' });
  const [interviewSelectedStudents, setInterviewSelectedStudents] = useState([]);
  const [activeInterviewGroupId, setActiveInterviewGroupId] = useState('');
  const [activeGdGroupId, setActiveGdGroupId] = useState('');
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [editingInterviewActivityId, setEditingInterviewActivityId] = useState(null);

  const [editingGdActivityId, setEditingGdActivityId] = useState(null);

  // GD form
  const [gdForm, setGdForm] = useState({ title: '', date: '', startTime: '09:00', groupMode: 'Auto', groupSize: 5, interviewer: '' });
  const [gdGroups, setGdGroups] = useState([]);

  // Assessment form
  const [assessForm, setAssessForm] = useState({ type: 'Technical', title: '', description: '', date: '', time: '09:00', duration: 60, link: '', interviewer: '' });
  const [assessSelected, setAssessSelected] = useState([]);
  const [activeAssessGroupId, setActiveAssessGroupId] = useState('');
  const [editingAssessActivityId, setEditingAssessActivityId] = useState(null);

  const filteredActivities = activities.filter((activity) => {
    if (activityFilter === 'all') return true;
    const normalizedType = String(activity.type || '').toLowerCase();
    return normalizedType.includes(activityFilter);
  });

  useEffect(() => { fetchActivities(); fetchStudents(); fetchTrainers(); fetchGroups(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!openActionMenu) return;
      if (
        e.target.closest("[data-menu]") ||
        e.target.closest("[data-menu-toggle]")
      )
        return;
      setOpenActionMenu(null);
      setActionMenuPos(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener('scroll', handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('scroll', handleClickOutside, true);
    };
  }, [openActionMenu]);

  async function fetchActivities() {
    setLoading(true);
    try {
      const res = await adminAPI.getActivities({ limit: 20 });
      if (res.data?.success) setActivities(res.data.activities || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchStudents() {
    try {
      const res = await adminAPI.getAllInterns();
      if (res.data?.success) {
        const mapped = res.data.interns || res.data.data || res.data;
        setStudents(Array.isArray(mapped) ? mapped : []);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchTrainers() {
    try {
      const res = await adminAPI.getAllTrainers();
      if (res.data?.success) {
        const mapped = res.data.trainers || res.data.data || res.data;
        setTrainers(Array.isArray(mapped) ? mapped : []);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchGroups() {
    try {
      const res = await adminAPI.getGroups();
      if (res.data?.success) {
        const mapped = res.data.groups || res.data.data || res.data;
        setGroups(Array.isArray(mapped) ? mapped : []);
      }
    } catch (e) { console.error(e); }
  }

  function toggleStudent(id, setSelected = setSelectedStudents) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleInterviewStudent(id) {
    setInterviewSelectedStudents((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  }

  function getGroupMemberList(group) {
    const members = Array.isArray(group?.students) ? group.students : [];
    return members.filter(Boolean);
  }

  function getGroupMemberId(member) {
    return String(member?._id || member?.id || member);
  }

  function getGroupLabel(group) {
    return group?.groupName || group?.groupNumber || 'Unnamed Group';
  }

  function getInterviewGroupLabel() {
    if (!activeInterviewGroupId) return '-';
    const group = groups.find((item) => String(item._id || item.id || item.groupNumber || item.groupName) === String(activeInterviewGroupId));
    return group ? getGroupLabel(group) : 'Selected Group';
  }

  function handleInterviewModeChange(mode) {
    setInterviewForm((prev) => ({ ...prev, mode }));
    setInterviewSelectedStudents([]);
    setActiveInterviewGroupId('');
    setGeneratedSlots([]);
  }

  function handleInterviewGroupSelect(group) {
    const groupId = String(group._id || group.id || group.groupNumber || group.groupName);
    const memberIds = getGroupMemberList(group).map((member) => getGroupMemberId(member));
    setActiveInterviewGroupId(groupId);
    setInterviewSelectedStudents(memberIds);
    setGeneratedSlots([]);
  }

  function handleGdGroupSelect(group) {
    const groupId = String(group._id || group.id || group.groupNumber || group.groupName);
    const memberIds = getGroupMemberList(group).map((member) => getGroupMemberId(member));
    setActiveGdGroupId(groupId);
    setSelectedStudents(memberIds);
    setGdGroups([]);
  }

  function generateInterviewSlots() {
    if (!interviewForm.date || !interviewForm.startTime) { alert('Select date and start time'); return; }
    if (!interviewSelectedStudents.length) { alert('Select at least one student'); return; }
    const [h,m] = interviewForm.startTime.split(':').map(Number);
    const base = new Date(interviewForm.date);
    base.setHours(h,m,0,0);
    const slots = interviewSelectedStudents.map((sid, idx) => {
      const student = students.find((item) => String(item._id || item.id) === String(sid));
      return {
        slotNo: idx + 1,
        time: new Date(base.getTime() + idx * interviewForm.perGap * 60000).toTimeString().slice(0, 5),
        studentId: sid,
        studentName: student?.name || '',
        psmsId: student?.internId || '',
        interviewerName: getTrainerLabel(interviewForm.interviewer),
        interviewMode: getInterviewModeLabel(),
        groupName: interviewForm.mode === 'Group' ? getInterviewGroupLabel() : '-',
        interviewType: interviewForm.interviewType,
      };
    });
    setGeneratedSlots(slots);
  }

  function generateAssessmentSlots() {
    if (!assessForm.date || !assessForm.time) { alert('Select date and time'); return; }
    if (!assessSelected.length) { alert('Select at least one student'); return; }
    const [h,m] = assessForm.time.split(':').map(Number);
    const base = new Date(assessForm.date);
    base.setHours(h,m,0,0);
    const slots = assessSelected.map((sid, idx) => {
      const student = students.find((item) => String(item._id || item.id) === String(sid));
      return {
        slotNo: idx + 1,
        time: new Date(base.getTime() + idx * assessForm.duration * 60000).toTimeString().slice(0,5),
        studentId: sid,
        studentName: student?.name || '',
        psmsId: student?.internId || '',
        interviewerName: getTrainerLabel(assessForm.interviewer),
        assessmentType: assessForm.type,
        link: assessForm.link || '',
      };
    });
    setGeneratedSlots(slots);
  }

  async function saveInterviewSchedule() {
    try {
      if (interviewForm.mode === 'Group' && !activeInterviewGroupId) {
        alert('Select a group first');
        return;
      }
      const allowedInterviewTypes = ['HR', 'PI', 'Technical'];
      const interviewTypeToSend = allowedInterviewTypes.includes(interviewForm.interviewType) ? interviewForm.interviewType : 'HR';
      const payload = { studentIds: interviewSelectedStudents, trainerId: interviewForm.interviewer || null, interviewerName: interviewForm.interviewer || '', interviewType: interviewTypeToSend, mode: interviewForm.mode, date: interviewForm.date, startTime: interviewForm.startTime, perGap: interviewForm.perGap };
      if (interviewForm.mode === 'Group') {
        payload.groupId = activeInterviewGroupId;
        payload.groupIds = [activeInterviewGroupId];
      }
      const isEditingInterviewActivity = Boolean(editingInterviewActivityId);
      const res = isEditingInterviewActivity
        ? await adminAPI.updateActivity(editingInterviewActivityId, {
            type: 'Interview',
            title: `${interviewTypeToSend} Interview (${interviewForm.mode})`,
            dateTime: `${interviewForm.date}T${interviewForm.startTime}:00`,
            status: 'Scheduled',
            details: {
              trainerId: payload.trainerId,
              interviewerId: payload.trainerId,
              interviewerName: payload.interviewerName,
              studentIds: payload.studentIds,
              assigned: payload.studentIds,
              mode: payload.mode,
              interviewType: payload.interviewType,
              date: payload.date,
              startTime: payload.startTime,
              perGap: payload.perGap,
              groupId: payload.groupId || '',
            },
          })
        : await adminAPI.scheduleInterview(payload);

      if (res.data?.success) {
        alert(res.data.message || (isEditingInterviewActivity ? 'Activity updated' : 'Scheduled'));
        if (isEditingInterviewActivity && String(viewActivity?._id) === String(editingInterviewActivityId)) {
          setViewActivity(res.data.activity || null);
        }
        setShowInterviewModal(false);
        setInterviewSelectedStudents([]);
        setActiveInterviewGroupId('');
        setGeneratedSlots([]);
        setEditingInterviewActivityId(null);
        fetchActivities();
      } else {
        // show backend message when present
        // eslint-disable-next-line no-console
        console.error('Schedule interview failed response:', res);
        alert(res.data?.message || 'Failed to schedule');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Schedule interview error:', e?.response || e.message || e);
      const msg = e?.response?.data?.message || e?.message || 'Failed to schedule';
      alert(msg);
    }
  }

  function createGdGroups() {
    // If admin selected an existing group, preview that group's members as a single group
    if (activeGdGroupId) {
      const found = groups.find(g => String(g._id || g.id || g.groupNumber || g.groupName) === String(activeGdGroupId));
      const memberList = found ? getGroupMemberList(found) : [];
      setGdGroups([memberList]);
      return;
    }

    const list = selectedStudents.length ? students.filter(s => selectedStudents.includes(String(s._id||s.id))) : students.slice(0, 50);
    const size = Number(gdForm.groupSize) || 5;
    const out = [];
    for (let i=0;i<list.length;i+=size) out.push(list.slice(i, i+size));
    setGdGroups(out);
  }

  async function saveGd() {
    try {
      // enforce group selection OR manual student selection
      if (!activeGdGroupId && selectedStudents.length === 0) {
        alert('Please select a group or choose students manually before saving the GD.');
        return;
      }
      const payloadDetails = { form: gdForm, groups: gdGroups, interviewerId: gdForm.interviewer || '', interviewerName: getTrainerLabel(gdForm.interviewer), assigned: selectedStudents, mode: 'Group', groupId: activeGdGroupId || '' };
      const activityPayload = { type: 'GD', title: gdForm.title || 'Group Discussion', dateTime: gdForm.date ? `${gdForm.date}T${gdForm.startTime||'00:00'}:00` : undefined, status: 'Scheduled', details: payloadDetails };
      const isEditing = Boolean(editingGdActivityId);
      const res = isEditing
        ? await adminAPI.updateActivity(editingGdActivityId, { title: activityPayload.title, dateTime: activityPayload.dateTime, status: activityPayload.status, type: activityPayload.type, details: activityPayload.details })
        : await adminAPI.createActivity(activityPayload);

      if (res.data?.success) {
        alert(isEditing ? 'Activity updated' : 'GD scheduled');
        setShowGDModal(false);
        setGdGroups([]);
        setSelectedStudents([]);
        setEditingGdActivityId(null);
        if (isEditing && String(viewActivity?._id) === String(editingGdActivityId)) {
          setViewActivity(res.data.activity || null);
        }
        fetchActivities();
      } else {
        console.error('Save GD failed response:', res);
        alert(res.data?.message || 'Failed to save GD');
      }
    } catch (e) { console.error('Save GD error:', e); alert('Failed to save GD'); }
  }
  async function saveAssessment() {
    try {
      const details = { form: assessForm, assigned: assessSelected, trainerId: assessForm.interviewer || '', interviewerName: getTrainerLabel(assessForm.interviewer) };
      if (activeAssessGroupId) details.mode = 'Group';
      if (activeAssessGroupId) details.groupId = activeAssessGroupId;

      const activityPayload = { type: 'Assessment', title: assessForm.title || `${assessForm.type} Assessment`, dateTime: assessForm.date ? `${assessForm.date}T${assessForm.time||'00:00'}:00` : undefined, status: 'Scheduled', details };
      const isEditing = Boolean(editingAssessActivityId);
      let res;
      if (isEditing) {
        res = await adminAPI.updateActivity(editingAssessActivityId, { title: activityPayload.title, dateTime: activityPayload.dateTime, status: activityPayload.status, type: activityPayload.type, details: activityPayload.details });
      } else {
        // schedule-assessment endpoint expects a flattened payload (assigned, trainerId, type, title, description, date, time, link, groupId)
        const schedPayload = {
          assigned: assessSelected,
          trainerId: assessForm.interviewer || details.trainerId || '',
          type: assessForm.type || details.type || 'Assessment',
          title: assessForm.title || details.title || `${assessForm.type} Assessment`,
          description: assessForm.description || details.description || '',
          date: assessForm.date || undefined,
          time: assessForm.time || undefined,
          link: assessForm.link || undefined,
          groupId: activeAssessGroupId || details.groupId || undefined
        };
        res = await adminAPI.createAssessment(schedPayload);
      }

      if (res.data?.success) {
        alert(isEditing ? 'Activity updated' : 'Assessment scheduled');
        setShowAssessmentModal(false);
        setAssessSelected([]);
        setActiveAssessGroupId('');
        setEditingAssessActivityId(null);
        if (isEditing && String(viewActivity?._id) === String(editingAssessActivityId)) setViewActivity(res.data.activity || null);
        fetchActivities();
      } else {
        console.error('Save assessment failed response:', res);
        alert(res.data?.message || 'Failed to schedule assessment');
      }
    } catch (e) { console.error('Save assessment error:', e); alert('Failed to schedule assessment'); }
  }

  async function saveEditedActivity() {
    try {
      if (!editActivity || !editActivity._id) return;
      const payload = { title: editActivity.title, dateTime: editActivity.dateTime, status: editActivity.status, type: editActivity.type };
      const res = await adminAPI.updateActivity(editActivity._id, payload);
      if (res.data?.success) {
        setActivities((prev) => prev.map(a => (String(a._id) === String(editActivity._id) ? res.data.activity : a)));
        if (viewActivity && String(viewActivity._id) === String(editActivity._id)) {
          setViewActivity(res.data.activity);
        }
        setEditActivity(null);
        alert('Activity updated');
      } else alert('Update failed');
    } catch (e) { console.error(e); alert('Update failed'); }
  }

  async function handleEditActivity(activity) {
    if (!activity) return;
    const type = String(activity.type || '').toLowerCase();
    const details = activity.details || {};
    if (type.includes('interview')) {
      // helper to find a value from multiple keys
      const pick = (...keys) => {
        for (const k of keys) {
          if (!k) continue;
          const parts = k.split('.');
          let v = details;
          if (parts.length === 1) {
            v = details[k];
            if (v !== undefined) return v;
            v = activity[k];
            if (v !== undefined) return v;
          } else {
            // nested like form.interviewer
            v = details;
            for (const p of parts) {
              if (v == null) break;
              v = v[p];
            }
            if (v !== undefined) return v;
          }
        }
        return undefined;
      };

      const dateFrom = activity.dateTime || pick('dateTime', 'date', 'form.date');
      const parsedDate = dateFrom ? new Date(dateFrom) : null;
      // Normalize interviewType: activity.type may be 'Interview' which is NOT a valid interviewType enum
      const rawInterviewType = pick('form.interviewType', 'interviewType', 'type') || 'HR';
      const allowedInterviewTypes = ['HR', 'PI', 'Technical'];
      const normalizedInterviewType = allowedInterviewTypes.includes(rawInterviewType)
        ? rawInterviewType
        : (typeof rawInterviewType === 'string' && allowedInterviewTypes.includes(String(rawInterviewType).trim()) ? String(rawInterviewType).trim() : 'HR');
      const form = {
        interviewType: normalizedInterviewType,
        mode: pick('form.mode', 'mode') || (pick('groupId') ? 'Group' : 'Individual'),
        date: parsedDate ? parsedDate.toISOString().slice(0,10) : (pick('form.date') || ''),
        startTime: parsedDate ? parsedDate.toTimeString().slice(0,5) : (pick('form.startTime') || pick('startTime') || '09:00'),
        perGap: pick('form.perGap', 'perGap', 'gap') || 15,
        interviewer: pick('form.interviewer', 'interviewer', 'trainerId', 'trainer') || ''
      };
      setInterviewForm(form);

      // ensure trainers/students are loaded so we can resolve ids; fetch directly and use returned lists
      let trainersList = trainers;
      if (!trainersList || trainersList.length === 0) {
        try {
          const trRes = await adminAPI.getAllTrainers();
          if (trRes.data?.success) trainersList = trRes.data.trainers || trRes.data.data || trRes.data || [];
          setTrainers(Array.isArray(trainersList) ? trainersList : []);
        } catch (e) { trainersList = trainers || []; }
      }
      let studentsList = students;
      if (!studentsList || studentsList.length === 0) {
        try {
          const stRes = await adminAPI.getAllInterns();
          if (stRes.data?.success) studentsList = stRes.data.interns || stRes.data.data || stRes.data || [];
          setStudents(Array.isArray(studentsList) ? studentsList : []);
        } catch (e) { studentsList = students || []; }
      }

      // Accept student lists passed as studentIds, assigned, students, form.studentIds or slots
      let studentIdsRaw = pick('studentIds', 'assigned', 'students', 'form.studentIds') || [];
      const slotsFromDetails = pick('slots', 'form.slots');
      if ((!studentIdsRaw || (Array.isArray(studentIdsRaw) && studentIdsRaw.length === 0)) && Array.isArray(slotsFromDetails) && slotsFromDetails.length) {
        studentIdsRaw = slotsFromDetails.map(s => s.studentId || s.student || (s.student && s.student._id) || '').filter(Boolean);
      }
      const studentIds = Array.isArray(studentIdsRaw) ? studentIdsRaw : (typeof studentIdsRaw === 'string' ? (studentIdsRaw.split(',').map(s=>s.trim())) : []);

      // helper to normalize potential object or primitive values into an id string
      const normalizeVal = (v) => {
        if (v == null) return '';
        if (typeof v === 'object') return String(v._id || v.id || v.internId || v.email || v);
        return String(v);
      };

      // resolve student ids against loaded students (match by _id, internId, email, or name)
      const resolvedStudentIds = (studentIds || []).map((val) => {
        const sVal = normalizeVal(val);
        const found = (studentsList || []).find(st => String(st._id) === sVal || String(st.id) === sVal || String(st.internId) === sVal || String(st.email) === sVal || st.name === sVal || st.name === val);
        return found ? String(found._id || found.id) : sVal;
      });

      // resolve interviewer to trainer _id if possible
      const interviewerRaw = form.interviewer || pick('form.interviewer', 'interviewer', 'trainerId', 'trainer') || '';
      let resolvedInterviewer = interviewerRaw;
      if (interviewerRaw) {
        const normInterviewer = normalizeVal(interviewerRaw);
        const foundT = (trainersList || []).find(tr => String(tr._id) === normInterviewer || String(tr.id) === normInterviewer || tr.name === normInterviewer || tr.email === normInterviewer);
        if (foundT) resolvedInterviewer = String(foundT._id || foundT.id);
        else resolvedInterviewer = normInterviewer;
      }

      // DEBUG: log resolved values to console to help debugging in browser
      try {
        // eslint-disable-next-line no-console
        console.debug('Edit activity debug:', { activityId: activity._id, interviewerRaw: details?.interviewer || interviewerRaw, originalStudentEntries: studentIdsRaw, resolvedInterviewer, resolvedStudentIds });
      } catch (e) {}

      setInterviewSelectedStudents(resolvedStudentIds.map(String));
      setActiveInterviewGroupId(pick('groupId') || '');
      setInterviewForm(prev => ({ ...prev, interviewer: resolvedInterviewer }));
      setGeneratedSlots([]);
      setEditingInterviewActivityId(activity._id || null);
      setShowInterviewModal(true);
    } else if (type.includes('gd')) {
      const pick = (...keys) => {
        for (const k of keys) {
          if (!k) continue;
          const parts = k.split('.');
          let v = details;
          if (parts.length === 1) {
            v = details[k];
            if (v !== undefined) return v;
            v = activity[k];
            if (v !== undefined) return v;
          } else {
            v = details;
            for (const p of parts) {
              if (v == null) break;
              v = v[p];
            }
            if (v !== undefined) return v;
          }
        }
        return undefined;
      };
      const dateFrom = activity.dateTime || pick('dateTime', 'date', 'form.date');
      const parsedDate = dateFrom ? new Date(dateFrom) : null;
      const form = {
        title: pick('form.title', 'title') || activity.title || 'Group Discussion',
        date: parsedDate ? parsedDate.toISOString().slice(0,10) : (pick('form.date') || ''),
        startTime: parsedDate ? parsedDate.toTimeString().slice(0,5) : (pick('form.startTime') || '09:00'),
        groupMode: pick('form.groupMode', 'groupMode') || 'Auto',
        groupSize: pick('form.groupSize', 'groupSize') || 5,
        interviewer: pick('form.interviewer', 'interviewer', 'trainerId') || ''
      };

      setGdForm(form);
      const existingGroups = details.groups || details.form?.groups || [];
      setGdGroups(existingGroups);

      // ensure trainers/students are loaded
      let trainersList = trainers;
      if (!trainersList || trainersList.length === 0) {
        try {
          const trRes = await adminAPI.getAllTrainers();
          if (trRes.data?.success) trainersList = trRes.data.trainers || trRes.data.data || trRes.data || [];
          setTrainers(Array.isArray(trainersList) ? trainersList : []);
        } catch (e) { trainersList = trainers || []; }
      }
      // ensure groups are loaded
      let groupsList = groups;
      if (!groupsList || groupsList.length === 0) {
        try {
          const gRes = await adminAPI.getGroups();
          if (gRes.data?.success) groupsList = gRes.data.groups || gRes.data.data || gRes.data || [];
          setGroups(Array.isArray(groupsList) ? groupsList : []);
        } catch (e) { groupsList = groups || []; }
      }
      let studentsList = students;
      if (!studentsList || studentsList.length === 0) {
        try {
          const stRes = await adminAPI.getAllInterns();
          if (stRes.data?.success) studentsList = stRes.data.interns || stRes.data.data || stRes.data || [];
          setStudents(Array.isArray(studentsList) ? studentsList : []);
        } catch (e) { studentsList = students || []; }
      }

      // determine selected students: check assigned, students, form.assigned or flatten groups
      let studentIdsRaw = pick('assigned', 'students', 'form.assigned') || [];
      if ((!studentIdsRaw || (Array.isArray(studentIdsRaw) && studentIdsRaw.length === 0)) && Array.isArray(existingGroups) && existingGroups.length) {
        // flatten groups
        const flat = [];
        for (const g of existingGroups) {
          const members = Array.isArray(g) ? g : (Array.isArray(g.students) ? g.students : []);
          for (const m of members) {
            if (!m) continue;
            const id = (m._id || m.id || m.internId || m) ;
            flat.push(id);
          }
        }
        studentIdsRaw = flat;
      }
      const studentIds = Array.isArray(studentIdsRaw) ? studentIdsRaw : (typeof studentIdsRaw === 'string' ? studentIdsRaw.split(',').map(s=>s.trim()) : []);

      const normalizeVal = (v) => {
        if (v == null) return '';
        if (typeof v === 'object') return String(v._id || v.id || v.internId || v.email || v);
        return String(v);
      };

      const resolvedStudentIds = (studentIds || []).map((val) => {
        const sVal = normalizeVal(val);
        const found = (studentsList || []).find(st => String(st._id) === sVal || String(st.id) === sVal || String(st.internId) === sVal || String(st.email) === sVal || st.name === sVal || st.name === val);
        return found ? String(found._id || found.id) : sVal;
      });

      // resolve interviewer to trainer id if possible
      const interviewerRaw = form.interviewer || pick('form.interviewer', 'interviewer', 'trainerId') || '';
      let resolvedInterviewer = interviewerRaw;
      if (interviewerRaw) {
        const normInterviewer = normalizeVal(interviewerRaw);
        const foundT = (trainersList || []).find(tr => String(tr._id) === normInterviewer || String(tr.id) === normInterviewer || tr.name === normInterviewer || tr.email === normInterviewer);
        if (foundT) resolvedInterviewer = String(foundT._id || foundT.id);
        else resolvedInterviewer = normInterviewer;
      }

      try { console.debug('Edit GD debug:', { activityId: activity._id, studentIdsRaw, resolvedStudentIds, resolvedInterviewer }); } catch (e) {}

      setSelectedStudents(resolvedStudentIds.map(String));
      // if activity references a groupId, set it as active to mirror Interview behavior
      const possibleGroupId = pick('groupId', 'form.groupId') || details.groupId || details.form?.groupId || '';
      if (possibleGroupId) {
        const gidNorm = normalizeVal(possibleGroupId);
        const foundG = (groupsList || []).find(g => String(g._id || g.id || g.groupNumber || g.groupName) === gidNorm);
        if (foundG) setActiveGdGroupId(String(foundG._id || foundG.id));
        else setActiveGdGroupId(gidNorm);
      } else {
        setActiveGdGroupId('');
      }
      setGdForm(prev => ({ ...prev, interviewer: resolvedInterviewer }));
      setEditingGdActivityId(activity._id || null);
      setShowGDModal(true);
    } else if (type.includes('assessment')) {
      const pick = (...keys) => {
        for (const k of keys) {
          if (!k) continue;
          const parts = k.split('.');
          let v = details;
          if (parts.length === 1) {
            v = details[k];
            if (v !== undefined) return v;
            v = activity[k];
            if (v !== undefined) return v;
          } else {
            v = details;
            for (const p of parts) {
              if (v == null) break;
              v = v[p];
            }
            if (v !== undefined) return v;
          }
        }
        return undefined;
      };
      const dateFrom = activity.dateTime || pick('dateTime', 'date', 'form.date');
      const parsedDate = dateFrom ? new Date(dateFrom) : null;
      const form = {
        type: pick('form.type', 'type') || activity.type || 'Technical',
        title: pick('form.title', 'title') || activity.title || '',
        description: pick('form.description', 'description') || details.description || '',
        date: parsedDate ? parsedDate.toISOString().slice(0,10) : (pick('form.date') || ''),
        time: parsedDate ? parsedDate.toTimeString().slice(0,5) : (pick('form.time') || '09:00'),
        duration: pick('form.duration', 'duration') || 60,
        link: pick('form.link', 'link') || '',
        interviewer: pick('form.interviewer', 'interviewer', 'trainerId') || ''
      };
      setAssessForm(form);
      // ensure trainers/students/groups are loaded
      let trainersList = trainers;
      if (!trainersList || trainersList.length === 0) {
        try {
          const trRes = await adminAPI.getAllTrainers();
          if (trRes.data?.success) trainersList = trRes.data.trainers || trRes.data.data || trRes.data || [];
          setTrainers(Array.isArray(trainersList) ? trainersList : []);
        } catch (e) { trainersList = trainers || []; }
      }
      let groupsList = groups;
      if (!groupsList || groupsList.length === 0) {
        try {
          const gRes = await adminAPI.getGroups();
          if (gRes.data?.success) groupsList = gRes.data.groups || gRes.data.data || gRes.data || [];
          setGroups(Array.isArray(groupsList) ? groupsList : []);
        } catch (e) { groupsList = groups || []; }
      }
      let studentsList = students;
      if (!studentsList || studentsList.length === 0) {
        try {
          const stRes = await adminAPI.getAllInterns();
          if (stRes.data?.success) studentsList = stRes.data.interns || stRes.data.data || stRes.data || [];
          setStudents(Array.isArray(studentsList) ? studentsList : []);
        } catch (e) { studentsList = students || []; }
      }

      const assigned = pick('assigned', 'form.assigned', 'students') || [];
      const studentIds = Array.isArray(assigned) ? assigned : (typeof assigned === 'string' ? assigned.split(',').map(s=>s.trim()) : []);
      const normalizeVal = (v) => {
        if (v == null) return '';
        if (typeof v === 'object') return String(v._id || v.id || v.internId || v.email || v);
        return String(v);
      };
      const resolvedStudentIds = (studentIds || []).map((val) => {
        const sVal = normalizeVal(val);
        const found = (studentsList || []).find(st => String(st._id) === sVal || String(st.id) === sVal || String(st.internId) === sVal || String(st.email) === sVal || st.name === sVal || st.name === val);
        return found ? String(found._id || found.id) : sVal;
      });

      const interviewerRaw = form.interviewer || pick('form.interviewer', 'interviewer', 'trainerId') || '';
      let resolvedInterviewer = interviewerRaw;
      if (interviewerRaw) {
        const normInterviewer = normalizeVal(interviewerRaw);
        const foundT = (trainersList || []).find(tr => String(tr._id) === normInterviewer || String(tr.id) === normInterviewer || tr.name === normInterviewer || tr.email === normInterviewer);
        if (foundT) resolvedInterviewer = String(foundT._id || foundT.id);
        else resolvedInterviewer = normInterviewer;
      }

      setAssessSelected(resolvedStudentIds.map(String));
      setAssessForm(prev => ({ ...prev, interviewer: resolvedInterviewer }));
      // set active group if present
      const possibleGroupId = pick('groupId', 'form.groupId') || details.groupId || details.form?.groupId || '';
      if (possibleGroupId) {
        const gidNorm = normalizeVal(possibleGroupId);
        const foundG = (groupsList || []).find(g => String(g._id || g.id || g.groupNumber || g.groupName) === gidNorm);
        if (foundG) setActiveAssessGroupId(String(foundG._id || foundG.id));
        else setActiveAssessGroupId(gidNorm);
      } else setActiveAssessGroupId('');

      setEditingAssessActivityId(activity._id || null);
      setShowAssessmentModal(true);
    } else {
      // Fallback: open simple edit modal
      setEditActivity(activity);
    }
  }

  function getActivityLabel(activity) {
    const normalizedType = String(activity.type || '').toLowerCase();
    if (normalizedType.includes('interview')) return 'Schedule Interviews';
    if (normalizedType.includes('gd')) return 'Schedule GD Round';
    if (normalizedType.includes('assessment')) return 'Schedule Assessment';
    return activity.type || 'Activity';
  }

  function getActivityModeLabel(activity) {
    const details = activity?.details || {};
    const rawMode = details.mode || details.form?.mode || activity?.mode || details.groupMode || details.groupId || details.groupIds || '';
    if (!rawMode) return '-';
    if (String(rawMode).toLowerCase() === 'group' || Array.isArray(rawMode)) return 'Group';
    if (String(rawMode).toLowerCase() === 'individual') return 'Individual';
    if (details.groupId || (Array.isArray(details.groupIds) && details.groupIds.length)) return 'Group';
    return String(rawMode);
  }

  function getActivityTypeLabel(activity) {
    const normalizedType = String(activity?.type || '').toLowerCase();
    if (normalizedType.includes('interview')) return 'Interview';
    if (normalizedType.includes('gd')) return 'GD Round';
    if (normalizedType.includes('assessment')) return 'Assessment';
    return activity?.type || 'Activity';
  }

  function getActivityBadgeClass(activity) {
    const normalizedType = String(activity.type || '').toLowerCase();
    if (normalizedType.includes('interview')) return 'interview';
    if (normalizedType.includes('gd')) return 'gd';
    if (normalizedType.includes('assessment')) return 'assessment';
    return 'neutral';
  }

  function renderInterviewerSelect(value, onChange) {
    return (
      <div className="am-field am-span-2">
        <label>Select Interviewer</label>
        <select value={value} onChange={onChange}>
          <option value="">Select employee / interviewer</option>
          {trainers.map((trainer) => (
            <option key={trainer._id || trainer.id} value={trainer._id || trainer.id}>
              {trainer.name}{trainer.customRole ? ` (${trainer.customRole})` : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function getTrainerLabel(trainerId) {
    if (!trainerId) return '-';
    const trainer = trainers.find((item) => String(item._id || item.id) === String(trainerId));
    if (!trainer) return 'Selected interviewer';
    return trainer.customRole ? `${trainer.name} (${trainer.customRole})` : trainer.name;
  }

  function getInterviewModeLabel() {
    return interviewForm.mode === 'Group' ? 'Group' : 'Individual';
  }

  function formatReportDate(value) {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    const pad = (num) => String(num).padStart(2, '0');
    const day = pad(parsed.getUTCDate());
    const month = pad(parsed.getUTCMonth() + 1);
    const year = parsed.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatReportTime(value) {
    if (!value) return '-';
    const text = String(value).trim();
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime()) && /[-T]/.test(text)) {
      const pad = (num) => String(num).padStart(2, '0');
      let hours = parsed.getUTCHours();
      const minutes = pad(parsed.getUTCMinutes());
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${pad(hours)}:${minutes} ${ampm}`;
    }

    const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (match) {
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      return `${String(formattedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }

    return text;
  }

  function formatActivityDateTime(value) {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    
    const pad = (num) => String(num).padStart(2, '0');
    const day = pad(parsed.getUTCDate());
    const month = pad(parsed.getUTCMonth() + 1);
    const year = parsed.getUTCFullYear();
    let hours = parsed.getUTCHours();
    const minutes = pad(parsed.getUTCMinutes());
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${day}/${month}/${year}, ${pad(hours)}:${minutes} ${ampm}`;
  }

  function getStudentRecord(studentId) {
    const normalizedId = String(studentId || '');
    return students.find((student) => String(student._id) === normalizedId || String(student.id) === normalizedId || student.internId === normalizedId || student.email === normalizedId || student.name === normalizedId);
  }

  function getActivityDetailReport(activity) {
    const details = activity?.details || {};
    const normalizedType = String(activity?.type || '').toLowerCase();
    const activityDate = activity?.dateTime || details.dateTime || details.date || '';
    const modeLabel = String(details.mode || activity?.mode || getActivityModeLabel(activity) || '').toLowerCase();
    const isGroupInterview = normalizedType.includes('interview') && modeLabel === 'group';
    const interviewerId = details.interviewerId || details.trainerId || details.interviewer || details.interviewerName || activity?.interviewer || activity?.interviewerName || '';
    const interviewerName = (() => {
      if (!interviewerId) return '-';
      const found = trainers.find((trainer) => String(trainer._id || trainer.id) === String(interviewerId) || trainer.name === interviewerId || trainer.email === interviewerId);
      return found ? (found.customRole ? `${found.name} (${found.customRole})` : found.name) : String(details.interviewerName || interviewerId);
    })();
    const assignedIds = (() => {
      const assigned = details.studentIds || details.assigned || details.students || activity?.assigned || [];
      const list = Array.isArray(assigned) ? assigned : (typeof assigned === 'string' ? assigned.split(',').map((item) => item.trim()).filter(Boolean) : []);
      return list.map((item) => String(item));
    })();

    if (normalizedType.includes('interview')) {
      const groupRecord = details.groupId
        ? groups.find((group) => String(group._id || group.id || group.groupNumber || group.groupName) === String(details.groupId))
        : null;
      const groupMembers = isGroupInterview
        ? (groupRecord ? getGroupMemberList(groupRecord) : assignedIds.map((studentId) => getStudentRecord(studentId)).filter(Boolean))
        : [];
      const perGapMinutes = Number(details.perGap || 15);
      const slots = Array.isArray(details.slots) && details.slots.length
        ? details.slots
        : assignedIds.map((studentId, index) => ({ studentId, startTime: activity?.dateTime ? new Date(new Date(activity.dateTime).getTime() + index * perGapMinutes * 60000).toISOString() : details.startTime }));
      const resolvedIndividualStudent = !isGroupInterview
        ? (getStudentRecord(assignedIds[0]) || getStudentRecord(slots[0]?.studentId) || getStudentRecord(slots[0]?.student) || null)
        : null;

      return {
        kind: 'interview',
        isGroupInterview,
        groupName: groupRecord?.groupName || groupRecord?.groupNumber || details.groupId || '',
        groupMembers,
        resolvedIndividualStudent,
        title: 'Weekly Interview Schedule - SMS Program',
        kicker: 'INTERVIEW SCHEDULE - SMS PROGRAM',
        meta: [
          { label: 'Interview Type', value: details.interviewType || '-' },
          { label: 'Date', value: formatReportDate(activityDate) },
          { label: 'Interviewer', value: interviewerName },
          { label: 'Mode', value: getActivityModeLabel(activity) },
          ...(isGroupInterview ? [{ label: 'Group', value: groupRecord?.groupName || groupRecord?.groupNumber || details.groupId || 'Group schedule' }] : [])
        ],
        columns: isGroupInterview ? ['Slot No.', 'Time Slot', 'Student Name', 'PSMS ID'] : ['Slot No.', 'Time Slot', 'Student Name', 'PSMS ID'],
        rows: (isGroupInterview ? groupMembers : slots).map((entry, index) => {
          const rawStudentId = String((entry && typeof entry === 'object') ? (entry.studentId || entry.student || entry._id || entry.id || entry.internId || entry.email || entry.name || '') : (entry || assignedIds[index] || ''));
          const student = getStudentRecord(rawStudentId) || (resolvedIndividualStudent && !isGroupInterview ? resolvedIndividualStudent : null);
          const slot = isGroupInterview && groupRecord ? slots[index] : entry;
          const startTime = slot?.startTime || slot?.time || details.startTime || '';
          let timeSlot = '-';
          if (slot?.date && slot?.startTime) {
            timeSlot = `${formatReportTime(slot.startTime)}`;
          } else if (activityDate && details.perGap) {
            const baseTime = new Date(activityDate);
            if (!Number.isNaN(baseTime.getTime())) {
              const slotStart = new Date(baseTime.getTime() + index * perGapMinutes * 60000);
              const slotEnd = new Date(slotStart.getTime() + perGapMinutes * 60000);
              timeSlot = `${slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${slotEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
            }
          } else {
            timeSlot = formatReportTime(startTime);
          }

          return {
            slotNo: `Slot ${index + 1}`,
            timeSlot,
            studentName: student?.name || rawStudentId || '-',
            psmsId: student?.internId || 'NA'
          };
        })
      };
    }

    if (normalizedType.includes('gd')) {
      const groupsList = Array.isArray(details.groups) ? details.groups : [];
      return {
        kind: 'gd',
        title: 'Group Discussion Schedule - SMS Program',
        kicker: 'DISCUSSION FLOW',
        meta: [
          { label: 'GD Title', value: activity?.title || details.form?.title || 'Group Discussion' },
          { label: 'Date', value: formatReportDate(activityDate) },
          { label: 'Interviewer', value: interviewerName },
          { label: 'Group Mode', value: details.form?.groupMode || details.groupMode || 'Auto' }
        ],
        columns: ['Group No.', 'Group Name', 'Students', 'Date & Time'],
        rows: groupsList.map((groupEntry, index) => {
          const members = Array.isArray(groupEntry)
            ? groupEntry
            : (Array.isArray(groupEntry?.students) ? groupEntry.students : []);
          const groupName = groupEntry?.groupName || groupEntry?.groupNumber || `Group ${index + 1}`;
          const studentsText = members.length
            ? members.map((member) => {
                const student = getStudentRecord(member?._id || member?.id || member?.internId || member);
                return student?.name || member?.name || String(member?.internId || member?._id || member?.id || member);
              }).join(', ')
            : '-';
          return {
            slotNo: `Group ${index + 1}`,
            timeSlot: groupName,
            studentName: studentsText,
            psmsId: formatReportDate(activityDate)
          };
        })
      };
    }

    return {
      kind: 'assessment',
      title: 'Assessment Schedule - SMS Program',
      kicker: 'ASSESSMENT FLOW',
      meta: [
        { label: 'Assessment Type', value: details.form?.type || activity?.type || 'Assessment' },
        { label: 'Date', value: formatReportDate(activityDate) },
        ...(interviewerName && interviewerName !== '-' ? [{ label: 'Interviewer', value: interviewerName }] : []),
        { label: 'Duration', value: `${details.form?.duration || details.duration || '-'} mins` }
      ],
      columns: ['Slot No.', 'Student Name', 'PSMS ID', 'Date & Time'],
      rows: assignedIds.length ? assignedIds.map((studentId, index) => {
        const student = getStudentRecord(studentId);
        const dateTimeText = activityDate
          ? `${formatReportDate(activityDate)} ${formatReportTime(details.form?.time || activity?.dateTime || details.time || '')}`
          : '-';
        return {
          slotNo: `Slot ${index + 1}`,
          studentName: student?.name || studentId || '-',
          psmsId: student?.internId || 'NA',
          timeSlot: dateTimeText
        };
      }) : []
    };
  }

  return (
    <div className="am-page">
      <div className="am-header">
        <h1>Activity Management</h1>
        <p className="am-sub">Create and manage Interviews, GD rounds and Assessments</p>
      </div>

      {/* Edit Activity Modal */}
      {editActivity && (
        <div className="am-modal">
          <div className="am-modal-body am-modal-shell">
            <div className="am-modal-head">
              <div>
                <p className="am-modal-kicker">Edit activity</p>
                <h3>Edit Activity</h3>
                <p className="am-modal-note">Modify title, datetime or status and save.</p>
              </div>
            </div>

            <div className="am-form-panel">
              <div className="am-field-grid two-cols">
                <div className="am-field am-span-2">
                  <label>Title</label>
                  <input value={editActivity.title || ''} onChange={e => setEditActivity(prev => ({ ...prev, title: e.target.value }))} />
                </div>
                <div className="am-field">
                  <label>Date & Time</label>
                  <input type="datetime-local" value={editActivity.dateTime ? new Date(editActivity.dateTime).toISOString().slice(0,16) : ''} onChange={e => setEditActivity(prev => ({ ...prev, dateTime: e.target.value }))} />
                </div>
                <div className="am-field">
                  <label>Status</label>
                  <select value={editActivity.status || 'Scheduled'} onChange={e => setEditActivity(prev => ({ ...prev, status: e.target.value }))}>
                    <option>Scheduled</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="am-actions-row am-actions-right">
              <button className="nm-btn ghost" onClick={() => setEditActivity(null)}>Close</button>
              <button className="nm-btn primary" onClick={saveEditedActivity}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {/* View Activity Modal */}
      {viewActivity && (
        <div className="am-report-overlay" onClick={() => setViewActivity(null)}>
          <div className="am-report-container" onClick={(event) => event.stopPropagation()}>

            {(() => {
              const report = getActivityDetailReport(viewActivity);
              return (
                <div className="am-report-paper">
                  <button type="button" className="am-modal-close-btn am-report-close" onClick={() => setViewActivity(null)} aria-label="Close activity details">×</button>

                  <div className="am-report-header">
                    <div className="am-report-brand-row">
                      <div className="am-report-brand am-report-brand-primary">Progrentures Solution Pvt. Ltd.</div>
                    </div>
                    <div className="am-report-divider" />
                    <h2>{report.title}</h2>
                  </div>

                  <div className="am-report-meta">
                    {report.meta.map((item) => (
                      <div key={item.label} className="am-report-meta-line">
                        <strong>{item.label}:</strong>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {!report.isGroupInterview && report.resolvedIndividualStudent && (
                    <div className="am-report-student-box">
                      <div className="am-report-student-title">Student Details</div>
                      <div className="am-report-student-grid">
                        <div><strong>Name:</strong> <span>{report.resolvedIndividualStudent.name || '-'}</span></div>
                        <div><strong>PSMS ID:</strong> <span>{report.resolvedIndividualStudent.internId || 'NA'}</span></div>
                        <div><strong>Email:</strong> <span>{report.resolvedIndividualStudent.email || '-'}</span></div>
                        <div><strong>Mobile:</strong> <span>{report.resolvedIndividualStudent.mobile || report.resolvedIndividualStudent.phone || '-'}</span></div>
                      </div>
                    </div>
                  )}

                  {report.isGroupInterview && (
                    <div className="am-report-group-box">
                      <div className="am-report-group-title">Group Members</div>
                      <div className="am-report-group-chips">
                        {(report.groupMembers || []).map((member) => {
                          const student = getStudentRecord(member?._id || member?.id || member?.internId || member?.email || member?.name || member);
                          const label = student?.name || member?.name || String(member?.internId || member?.email || member?._id || member?.id || member);
                          return (
                            <span key={String(member?._id || member?.id || member?.internId || member?.email || label)} className="am-report-chip">
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="am-report-section-title">{report.kicker === 'DISCUSSION FLOW' ? 'Group Discussion Details' : report.kicker === 'ASSESSMENT FLOW' ? 'Assessment Details' : (report.isGroupInterview ? 'Group Interview Details' : 'Interview Slots & Students')}</div>

                  <div className="am-report-table-wrap">
                    {report.rows.length ? (
                      <table className="am-report-table">
                        <thead>
                          <tr>
                            {report.columns.map((column) => <th key={column}>{column}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {report.rows.map((row, index) => {
                            const cells = report.kind === 'assessment'
                              ? [row.slotNo, row.studentName, row.psmsId, row.timeSlot]
                              : [row.slotNo, row.timeSlot, row.studentName, row.psmsId];
                            return (
                              <tr key={`${row.slotNo}-${index}`}>
                                {cells.map((cell, cellIndex) => <td key={`${row.slotNo}-${cellIndex}`}>{cell}</td>)}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="am-report-empty">No participant details available</div>
                    )}
                  </div>

                  <div className="am-report-footer">
                    <button type="button" className="nm-btn ghost" onClick={() => setViewActivity(null)}>Close</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      <div className="am-actions">
        <IconCard title="Assign Task" onClick={() => { window.location.hash = '#create-task'; window.dispatchEvent(new CustomEvent('openAdminMenu', { detail: { menu: 'create-task' } })); }} />
        <IconCard title="Manage Task" onClick={() => { window.location.hash = '#manage-tasks'; window.dispatchEvent(new CustomEvent('openAdminMenu', { detail: { menu: 'manage-tasks' } })); }} />
        <IconCard title="Pending Approval" onClick={() => { window.location.hash = '#pending-approvals'; window.dispatchEvent(new CustomEvent('openAdminMenu', { detail: { menu: 'pending-approvals' } })); }} />
        <IconCard title="Schedule Interviews" onClick={() => { setEditingInterviewActivityId(null); setShowInterviewModal(true); }} />
        <IconCard title="Schedule GD Round" onClick={() => { setEditingGdActivityId(null); setShowGDModal(true); }} />
        <IconCard title="Schedule Assessment" onClick={() => { setEditingAssessActivityId(null); setActiveAssessGroupId(''); setGeneratedSlots([]); setShowAssessmentModal(true); }} />
      </div>

      <div className="am-recent">
        <div className="am-recent-header">
          <h3>Recent Activities</h3>
          <div className="am-filter-group" role="tablist" aria-label="Recent activities filters">
            <button type="button" className={`am-filter-chip filter-all ${activityFilter === 'all' ? 'active' : ''}`} onClick={() => setActivityFilter('all')}>
              All
            </button>
            <button type="button" className={`am-filter-chip filter-interview ${activityFilter === 'interview' ? 'active' : ''}`} onClick={() => setActivityFilter('interview')}>
              Schedule Interviews
            </button>
            <button type="button" className={`am-filter-chip filter-gd ${activityFilter === 'gd' ? 'active' : ''}`} onClick={() => setActivityFilter('gd')}>
              Schedule GD Round
            </button>
            <button type="button" className={`am-filter-chip filter-assess ${activityFilter === 'assessment' ? 'active' : ''}`} onClick={() => setActivityFilter('assessment')}>
              Schedule Assessment
            </button>
          </div>
        </div>
        {loading ? <div>Loading...</div> : (
          <div className="table-container am-table-wrap">
            {filteredActivities.length === 0 ? (
              <div className="am-empty">No recent activities</div>
            ) : (
              <table className="records-table am-records-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Title</th>
                    <th>Date & Time</th>
                    <th>Mode</th>
                    <th>Created By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity) => (
                    <tr key={activity._id}>
                      <td>
                        <span className={`am-type-badge ${getActivityBadgeClass(activity)}`}>
                          {getActivityLabel(activity)}
                        </span>
                      </td>
                      <td>{activity.title || activity.type || '-'}</td>
                      <td className="date-cell">{formatActivityDateTime(activity.dateTime)}</td>
                      <td>{getActivityModeLabel(activity)}</td>
                      <td>{activity.createdByModel || '-'}</td>
                      <td>
                        <span className={`am-status-pill ${String(activity.status || '').toLowerCase()}`}>
                          {activity.status || 'Scheduled'}
                        </span>
                      </td>
                      <td>
                        <div className="am-actions-cell">
                          <button
                            data-menu-toggle
                            className="am-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const id = activity._id;
                              if (openActionMenu === id) { setOpenActionMenu(null); setActionMenuPos(null); return; }
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const showUpward = spaceBelow < 220;
                              setOpenActionMenu(id);
                              setActionMenuPos({
                                top: showUpward ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
                                left: rect.right - 160 + window.scrollX,
                                showUpward
                              });
                            }}
                            style={{
                              background: "transparent",
                              color: "#0f172a",
                              border: "1px solid #d1d5db",
                              borderRadius: "8px",
                              width: "36px",
                              height: "36px",
                              cursor: "pointer",
                              fontSize: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ⋮
                          </button>
                          {openActionMenu === activity._id && actionMenuPos &&
                            createPortal(
                              <div
                                data-menu
                                style={{
                                  position: "absolute",
                                  left: `${actionMenuPos.left}px`,
                                  top: `${actionMenuPos.top}px`,
                                  transform: actionMenuPos.showUpward ? "translateY(-100%)" : "none",
                                  background: "white",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "12px",
                                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                                  zIndex: 11000,
                                  width: "160px",
                                  overflow: "hidden",
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setViewActivity(activity);
                                    setOpenActionMenu(null);
                                    setActionMenuPos(null);
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "white",
                                    border: "none",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#0f172a",
                                  }}
                                  onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                                  onMouseLeave={(e) => (e.target.style.background = "white")}
                                >
                                  View Details
                                </button>
                                
                                {activity.status !== 'Completed' && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const payload = { title: activity.title, dateTime: activity.dateTime, status: 'Completed', type: activity.type };
                                        const res = await adminAPI.updateActivity(activity._id, payload);
                                        if (res.data?.success) {
                                          setActivities((prev) => prev.map(a => (String(a._id) === String(activity._id) ? res.data.activity : a)));
                                          setOpenActionMenu(null);
                                          setActionMenuPos(null);
                                          alert('Activity marked as Completed');
                                        } else alert('Update failed');
                                      } catch (e) { console.error(e); alert('Update failed'); }
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "12px 16px",
                                      background: "white",
                                      border: "none",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                      fontWeight: "500",
                                      color: "#0f172a",
                                      borderTop: "1px solid #f3f4f6",
                                    }}
                                    onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                                    onMouseLeave={(e) => (e.target.style.background = "white")}
                                  >
                                    Mark Completed
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    handleEditActivity(activity);
                                    setOpenActionMenu(null);
                                    setActionMenuPos(null);
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "white",
                                    border: "none",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#0f172a",
                                    borderTop: "1px solid #f3f4f6",
                                  }}
                                  onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                                  onMouseLeave={(e) => (e.target.style.background = "white")}
                                >
                                  Reschedule
                                </button>
                                
                                <button
                                  onClick={async () => {
                                    if (!confirm('Delete this activity?')) return;
                                    try {
                                      const res = await adminAPI.deleteActivity(activity._id);
                                      if (res.data?.success) {
                                        setActivities((prev) => prev.filter(a => String(a._id) !== String(activity._id))); 
                                        setOpenActionMenu(null);
                                        setActionMenuPos(null);
                                      } else alert('Delete failed');
                                    } catch (e) { console.error(e); alert('Delete failed'); }
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "white",
                                    border: "none",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#b91c1c", // red color to match standard danger
                                    borderTop: "1px solid #f3f4f6",
                                  }}
                                  onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                                  onMouseLeave={(e) => (e.target.style.background = "white")}
                                >
                                  Delete
                                </button>
                              </div>,
                              document.body
                            )
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Interview Modal */}
      {showInterviewModal && (
        <div className="am-modal">
          <div className="am-modal-body am-modal-shell">
            <div className="am-modal-head">
              <div>
                <p className="am-modal-kicker">Interview flow</p>
                <h3>Schedule Interview</h3>
                <p className="am-modal-note">Set the interview details, pick students, and preview slots before saving.</p>
              </div>
              <button
                type="button"
                className="am-modal-close-btn"
                onClick={() => { setShowInterviewModal(false); setEditingInterviewActivityId(null); }}
                aria-label="Close interview schedule form"
              >
                ×
              </button>
            </div>

            <div className="am-modal-summary-grid">
              <div className="am-summary-card">
                <span className="am-summary-label">Type</span>
                <strong>{interviewForm.interviewType}</strong>
              </div>
              <div className="am-summary-card">
                <span className="am-summary-label">Mode</span>
                <strong>{interviewForm.mode}</strong>
              </div>
              <div className="am-summary-card">
                <span className="am-summary-label">Students</span>
                <strong>{interviewSelectedStudents.length}</strong>
              </div>
              <div className="am-summary-card">
                <span className="am-summary-label">Gap</span>
                <strong>{interviewForm.perGap} mins</strong>
              </div>
            </div>

            <div className="am-form-layout am-form-layout-two">
              <section className="am-form-panel">
                <div className="am-panel-head">
                  <h4>Schedule Details</h4>
                  <p>Configure the interview window and format.</p>
                </div>

                <div className="am-field-grid two-cols">
                  <div className="am-field">
                    <label>Interview Type</label>
                    <select value={interviewForm.interviewType} onChange={e => setInterviewForm(f => ({ ...f, interviewType: e.target.value }))}>
                      <option>HR</option>
                      <option>PI</option>
                      <option>Technical</option>
                    </select>
                  </div>

                  <div className="am-field">
                    <label>Mode</label>
                    <select value={interviewForm.mode} onChange={e => handleInterviewModeChange(e.target.value)}>
                      <option>Individual</option>
                      <option>Group</option>
                    </select>
                  </div>

                  {renderInterviewerSelect(
                    interviewForm.interviewer,
                    e => setInterviewForm(f => ({ ...f, interviewer: e.target.value }))
                  )}

                  <div className="am-field">
                    <label>Date</label>
                    <input type="date" value={interviewForm.date} onChange={e => setInterviewForm(f => ({ ...f, date: e.target.value }))} />
                  </div>

                  <div className="am-field">
                    <label>Start Time</label>
                    <input type="time" value={interviewForm.startTime} onChange={e => setInterviewForm(f => ({ ...f, startTime: e.target.value }))} />
                  </div>

                  <div className="am-field am-span-2">
                    <label>Per Interview (mins)</label>
                    <input type="number" value={interviewForm.perGap} onChange={e => setInterviewForm(f => ({ ...f, perGap: Number(e.target.value) }))} />
                  </div>
                </div>
              </section>

              <section className="am-form-panel">
                <div className="am-panel-head">
                  <h4>{interviewForm.mode === 'Group' ? 'Select Group & Members' : 'Select Students'}</h4>
                  <p>{interviewForm.mode === 'Group' ? 'Pick a group to expand, then choose the members you want to include.' : 'Choose the students who should be included in this schedule.'}</p>
                </div>

                {interviewForm.mode === 'Individual' ? (
                  <div className="am-student-list">
                    {students.map(s => (
                      <div key={s._id||s.id} className="am-student-row">
                        <div>
                          <strong>{s.name}</strong>
                          <span>{s.internId}</span>
                        </div>
                        <div><input type="checkbox" checked={interviewSelectedStudents.includes(String(s._id||s.id))} onChange={() => toggleInterviewStudent(String(s._id||s.id))} /></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="am-group-list">
                    {groups.length === 0 ? (
                      <div className="am-empty">No groups found</div>
                    ) : (
                      groups.map((group) => {
                        const groupId = String(group._id || group.id || group.groupNumber || group.groupName);
                        const memberList = getGroupMemberList(group);
                        const isActive = activeInterviewGroupId === groupId;
                        return (
                          <div key={groupId} className={`am-group-card ${isActive ? 'active' : ''}`}>
                            <button
                              type="button"
                              className="am-group-card-header"
                              onClick={() => handleInterviewGroupSelect(group)}
                            >
                              <div>
                                <strong>{getGroupLabel(group)}</strong>
                                <span>{group.groupNumber || ''}</span>
                              </div>
                              <div className="am-group-count">{memberList.length} members</div>
                            </button>

                            {isActive && (
                              <div className="am-group-members-panel">
                                <div className="am-group-toolbar">
                                  <label className="am-group-toggle-all">
                                    <input
                                      type="checkbox"
                                      checked={memberList.length > 0 && memberList.every((member) => interviewSelectedStudents.includes(getGroupMemberId(member)))}
                                      onChange={(event) => {
                                        if (event.target.checked) {
                                          setInterviewSelectedStudents(memberList.map((member) => getGroupMemberId(member)));
                                        } else {
                                          setInterviewSelectedStudents([]);
                                        }
                                      }}
                                    />
                                    Select full group
                                  </label>
                                  <span className="am-group-help">Uncheck any member to schedule a partial group. The group remains the same.</span>
                                </div>
                                {memberList.map((member) => {
                                  const memberId = getGroupMemberId(member);
                                  return (
                                    <label key={memberId} className="am-member-row">
                                      <div>
                                        <strong>{member.name || 'Unnamed Student'}</strong>
                                        <span>{member.internId || member.email || memberId}</span>
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={interviewSelectedStudents.includes(memberId)}
                                        onChange={() => toggleInterviewStudent(memberId)}
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </section>
            </div>

            <div className="am-preview-panel">
              <div className="am-panel-head">
                <h4>Preview Slots</h4>
                <p>Generate the slots and verify the schedule before saving.</p>
              </div>

              {generatedSlots.length > 0 ? (
                <div className="am-table-shell">
                  <div className="am-table-wrapper-scroll">
                    <table className="records-table am-records-table am-slot-table records-slot-table">
                      <thead>
                        <tr>
                          <th>Slot</th>
                          <th>Time</th>
                          <th>Student</th>
                          <th>Interviewer</th>
                          <th>Mode</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedSlots.map(s => (
                          <tr key={s.slotNo}>
                            <td>{s.slotNo}</td>
                            <td className="date-cell">{s.time}</td>
                            <td>{s.studentName} • {s.psmsId}</td>
                            <td>{s.interviewerName}</td>
                            <td>
                              <span className={`am-slot-badge ${String(s.interviewMode || '').toLowerCase()}`}>
                                {s.interviewMode}
                              </span>
                            </td>
                            <td>{s.interviewType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="am-actions-row am-actions-right">
                    <button className="nm-btn" onClick={() => { setShowInterviewModal(false); setEditingInterviewActivityId(null); }}>Close</button>
                    <button className="nm-btn primary" onClick={generateInterviewSlots}>Generate Schedule</button>
                    <button className="nm-btn primary am-confirm-btn" onClick={saveInterviewSchedule}>Confirm & Save</button>
                  </div>
                </div>
              ) : (
                <div className="am-actions-row am-actions-right">
                  <button className="nm-btn" onClick={() => { setShowInterviewModal(false); setEditingInterviewActivityId(null); }}>Close</button>
                  <button className="nm-btn primary" onClick={generateInterviewSlots}>Generate Schedule</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GD Modal */}
      {showGDModal && (
        <div className="am-modal">
          <div className="am-modal-body am-modal-shell">
            <div className="am-modal-head">
              <div>
                <p className="am-modal-kicker">Discussion flow</p>
                <h3>Schedule GD Round</h3>
                <p className="am-modal-note">Create the GD topic, decide the grouping method, and preview the final groups.</p>
              </div>
              <button
                type="button"
                className="am-modal-close-btn"
                onClick={() => { setShowGDModal(false); setEditingGdActivityId(null); }}
                aria-label="Close GD schedule form"
              >
                ×
              </button>
            </div>

            <div className="am-modal-summary-grid">
              <div className="am-summary-card">
                <span className="am-summary-label">Title</span>
                <strong>{gdForm.title || 'Group Discussion'}</strong>
              </div>
              <div className="am-summary-card">
                <span className="am-summary-label">Mode</span>
                <strong>{gdForm.groupMode}</strong>
              </div>
              <div className="am-summary-card">
                <span className="am-summary-label">Group Size</span>
                <strong>{gdForm.groupSize}</strong>
              </div>
              <div className="am-summary-card">
                <span className="am-summary-label">Selected</span>
                <strong>{selectedStudents.length}</strong>
              </div>
            </div>

            <div className="am-form-layout am-form-layout-two">
              <section className="am-form-panel">
                <div className="am-panel-head">
                  <h4>Session Details</h4>
                  <p>Set the GD title, date, timing and group format.</p>
                </div>

                <div className="am-field-grid two-cols">
                  <div className="am-field am-span-2">
                    <label>GD Title</label>
                    <input value={gdForm.title} onChange={e => setGdForm(f => ({ ...f, title: e.target.value }))} />
                  </div>

                  <div className="am-field">
                    <label>Date</label>
                    <input type="date" value={gdForm.date} onChange={e => setGdForm(f => ({ ...f, date: e.target.value }))} />
                  </div>

                  <div className="am-field">
                    <label>Start Time</label>
                    <input type="time" value={gdForm.startTime} onChange={e => setGdForm(f => ({ ...f, startTime: e.target.value }))} />
                  </div>


                  {renderInterviewerSelect(
                    gdForm.interviewer,
                    e => setGdForm(f => ({ ...f, interviewer: e.target.value }))
                  )}

                  <div className="am-field">
                    <label>Select Group</label>
                    <select value={activeGdGroupId} onChange={e => {
                      const gid = e.target.value;
                      if (!gid) { setActiveGdGroupId(''); setSelectedStudents([]); return; }
                      const found = groups.find(g => String(g._id || g.id || g.groupNumber || g.groupName) === String(gid));
                      if (found) handleGdGroupSelect(found);
                      else setActiveGdGroupId(gid);
                    }}>
                      <option value="">-- Select group (Optional) --</option>
                      {groups.map(g => (
                        <option key={g._id||g.id} value={g._id||g.id||g.groupNumber||g.groupName}>{getGroupLabel(g)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="am-field">
                    <label>Group Size (auto)</label>
                    <input type="number" value={gdForm.groupSize} onChange={e => setGdForm(f => ({ ...f, groupSize: Number(e.target.value) }))} />
                  </div>
                </div>
              </section>

              <section className="am-form-panel">
                <div className="am-panel-head">
                  <h4>Participants</h4>
                  <p>Select students to include. If left blank, the system uses the default group set.</p>
                </div>
                <div className="am-student-list">
                  {(function(){
                    // If an existing group is selected, show only that group's members
                    if (activeGdGroupId) {
                      const found = groups.find(g => String(g._id||g.id||g.groupNumber||g.groupName) === String(activeGdGroupId));
                      const members = found ? getGroupMemberList(found) : [];
                      if (!members.length) return <div className="am-empty">No members in selected group</div>;
                      return members.map(m => {
                        const id = getGroupMemberId(m);
                        return (
                          <div key={id} className="am-student-row">
                            <div>
                              <strong>{m.name || (m.firstName && `${m.firstName} ${m.lastName}`) || 'Unnamed Student'}</strong>
                              <span>{m.internId || m.email || id}</span>
                            </div>
                            <div><input type="checkbox" checked={selectedStudents.includes(String(id))} onChange={() => toggleStudent(String(id))} /></div>
                          </div>
                        );
                      });
                    }

                    // Fallback: show all students
                    return students.map(s => (
                      <div key={s._id||s.id} className="am-student-row">
                        <div>
                          <strong>{s.name}</strong>
                          <span>{s.internId}</span>
                        </div>
                        <div><input type="checkbox" checked={selectedStudents.includes(String(s._id||s.id))} onChange={() => toggleStudent(String(s._id||s.id))} /></div>
                      </div>
                    ));
                  })()}
                </div>
              </section>
            </div>

            <div className="am-preview-panel">
              <div className="am-panel-head">
                <h4>Group Preview</h4>
                <p>Generate groups and review them before saving.</p>
              </div>

              {gdGroups.length > 0 ? (
                <div className="am-table-shell">
                  <div className="am-table-wrapper-scroll">
                    <table className="records-table am-records-table am-slot-table records-slot-table">
                      <thead>
                        <tr>
                          <th>Group</th>
                          <th>Group Name</th>
                          <th>Interviewer</th>
                          <th>Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gdGroups.map((g, idx) => {
                          const members = Array.isArray(g) ? g : (g.students || []);
                          let label = '';
                          if (g && (g.groupName || g.groupNumber)) label = g.groupName || g.groupNumber;
                          else if (activeGdGroupId) {
                            const found = groups.find(gr => String(gr._id || gr.id || gr.groupNumber || gr.groupName) === String(activeGdGroupId));
                            label = found ? (found.groupName || found.groupNumber || (found._id||found.id)) : `Group ${idx + 1}`;
                          } else {
                            label = `Group ${idx + 1}`;
                          }
                          return (
                            <tr key={idx}>
                              <td>Group {idx + 1}</td>
                              <td>{label}</td>
                              <td>{getTrainerLabel(gdForm.interviewer)}</td>
                              <td>{gdForm.date ? `${gdForm.date} ${gdForm.startTime || ''}` : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="am-actions-row am-actions-right">
                    <button className="nm-btn" onClick={() => { setShowGDModal(false); setEditingGdActivityId(null); }}>Close</button>
                    <button className="nm-btn primary" onClick={createGdGroups}>Create Groups</button>
                    <button className="nm-btn primary am-confirm-btn" onClick={saveGd}>Confirm & Save</button>
                  </div>
                </div>
              ) : (
                <div className="am-actions-row am-actions-right">
                  <button className="nm-btn" onClick={() => { setShowGDModal(false); setEditingGdActivityId(null); }}>Close</button>
                  <button className="nm-btn primary" onClick={createGdGroups}>Create Groups</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assessment Modal */}
      {showAssessmentModal && (
        <div className="am-modal">
          <div className="am-modal-body am-modal-shell">
            <div className="am-modal-head">
              <div>
                <p className="am-modal-kicker">Assessment flow</p>
                <h3>Schedule Assessment</h3>
                <p className="am-modal-note">Define the assessment, assign students, and save the final schedule.</p>
              </div>
              <button
                type="button"
                className="am-modal-close-btn"
                onClick={() => { setShowAssessmentModal(false); setEditingAssessActivityId(null); setActiveAssessGroupId(''); setGeneratedSlots([]); }}
                aria-label="Close assessment schedule form"
              >
                ×
              </button>
            </div>

            <div className="am-modal-summary-grid">
              <div className="am-summary-card">
                <span className="am-summary-label">Type</span>
                <strong>{assessForm.type}</strong>
              </div>
              <div className="am-summary-card">
                <span className="am-summary-label">Duration</span>
                <strong>{assessForm.duration} mins</strong>
              </div>
              <div className="am-summary-card">
                <span className="am-summary-label">Assigned</span>
                <strong>{assessSelected.length}</strong>
              </div>
              <div className="am-summary-card">
                <span className="am-summary-label">Date</span>
                <strong>{assessForm.date || 'Not set'}</strong>
              </div>
            </div>

            <div className="am-form-layout am-form-layout-two">
              <section className="am-form-panel">
                <div className="am-panel-head">
                  <h4>Assessment Details</h4>
                  <p>Fill in the assessment details and sharing info.</p>
                </div>

                <div className="am-field-grid two-cols">
                  <div className="am-field">
                    <label>Type</label>
                    <select value={assessForm.type} onChange={e => setAssessForm(f => ({ ...f, type: e.target.value }))}>
                      <option>Technical</option>
                      <option>Coding</option>
                      <option>Aptitude</option>
                      <option>Other</option>
                    </select>
                  </div>



                  <div className="am-field am-span-2">
                    <label>Title</label>
                    <input value={assessForm.title} onChange={e => setAssessForm(f => ({ ...f, title: e.target.value }))} />
                  </div>

                  <div className="am-field am-span-2">
                    <label>Description</label>
                    <textarea value={assessForm.description} onChange={e => setAssessForm(f => ({ ...f, description: e.target.value }))} />
                  </div>

                  <div className="am-field">
                    <label>Date</label>
                    <input type="date" value={assessForm.date} onChange={e => setAssessForm(f => ({ ...f, date: e.target.value }))} />
                  </div>

                  <div className="am-field">
                    <label>Time</label>
                    <input type="time" value={assessForm.time} onChange={e => setAssessForm(f => ({ ...f, time: e.target.value }))} />
                  </div>

                  <div className="am-field">
                    <label>Duration (mins)</label>
                    <input type="number" value={assessForm.duration} onChange={e => setAssessForm(f => ({ ...f, duration: Number(e.target.value) }))} />
                  </div>

                  <div className="am-field am-span-2">
                    <label>Link</label>
                    <input value={assessForm.link} onChange={e => setAssessForm(f => ({ ...f, link: e.target.value }))} />
                  </div>
                </div>
              </section>

              <section className="am-form-panel">
                  <div className="am-panel-head">
                    <h4>Assign Students</h4>
                    <p>Choose who should receive this assessment invite. You may select a group to prefill members.</p>
                  </div>
                  <div className="am-field">
                    <label>Select Group</label>
                    <select value={activeAssessGroupId} onChange={e => {
                      const gid = e.target.value;
                      if (!gid) { setActiveAssessGroupId(''); setAssessSelected([]); return; }
                      const found = groups.find(g => String(g._id || g.id || g.groupNumber || g.groupName) === String(gid));
                      if (found) {
                        const memberIds = getGroupMemberList(found).map(m => getGroupMemberId(m));
                        setActiveAssessGroupId(String(found._id || found.id || gid));
                        setAssessSelected(memberIds);
                      } else setActiveAssessGroupId(gid);
                    }}>
                      <option value="">-- Select group (optional) --</option>
                      {groups.map(g => (
                        <option key={g._id||g.id} value={g._id||g.id||g.groupNumber||g.groupName}>{getGroupLabel(g)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="am-student-list">
                    {(function(){
                      if (activeAssessGroupId) {
                        const found = groups.find(g => String(g._id||g.id||g.groupNumber||g.groupName) === String(activeAssessGroupId));
                        const members = found ? getGroupMemberList(found) : [];
                        if (!members.length) return <div className="am-empty">No members in selected group</div>;
                        return members.map(m => {
                          const id = getGroupMemberId(m);
                          return (
                            <div key={id} className="am-student-row">
                              <div>
                                <strong>{m.name || 'Unnamed Student'}</strong>
                                <span>{m.internId || m.email || id}</span>
                              </div>
                              <div><input type="checkbox" checked={assessSelected.includes(String(id))} onChange={() => toggleStudent(String(id), setAssessSelected)} /></div>
                            </div>
                          );
                        });
                      }
                      return students.map(s => (
                        <div key={s._id||s.id} className="am-student-row">
                          <div>
                            <strong>{s.name}</strong>
                            <span>{s.internId}</span>
                          </div>
                          <div><input type="checkbox" checked={assessSelected.includes(String(s._id||s.id))} onChange={() => toggleStudent(String(s._id||s.id), setAssessSelected)} /></div>
                        </div>
                      ));
                    })()}
                  </div>
              </section>
            </div>

            <div className="am-preview-panel">
              <div className="am-panel-head">
                <h4>Preview Assignments</h4>
                <p>Review assigned students before confirming.</p>
              </div>

              {(generatedSlots.length > 0 || assessSelected.length > 0) ? (
                <div className="am-table-shell">
                  <div className="am-table-wrapper-scroll">
                    <table className="records-table am-records-table am-slot-table records-slot-table">
                      <thead>
                        <tr>
                          <th>Slot</th>
                          <th>Student</th>
                          <th>PSMS ID</th>
                          <th>Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(generatedSlots.length > 0 ? generatedSlots : assessSelected.map((id, idx) => {
                          const s = students.find(st => String(st._id) === String(id) || String(st.id) === String(id) || st.internId === id || st.email === id || st.name === id);
                          return {
                            slotNo: idx + 1,
                            time: assessForm.time || '',
                            studentName: s ? s.name : id,
                            psmsId: s ? (s.internId || s.email) : id,
                            dateCell: assessForm.date ? `${assessForm.date} ${assessForm.time || ''}` : '-',
                          };
                        })).map((row) => (
                          <tr key={row.studentId || row.slotNo}>
                            <td>{row.slotNo}</td>
                            <td>{row.studentName}</td>
                            <td>{row.psmsId}</td>
                            <td className="date-cell">{row.time ? `${assessForm.date || ''} ${row.time}`.trim() : (row.dateCell || '-')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="am-actions-row am-actions-right">
                    <button className="nm-btn" onClick={() => { setShowAssessmentModal(false); setEditingAssessActivityId(null); setActiveAssessGroupId(''); setGeneratedSlots([]); }}>Close</button>
                    <button className="nm-btn primary" onClick={generateAssessmentSlots}>Generate Schedule</button>
                    <button className="nm-btn primary am-confirm-btn" onClick={saveAssessment}>Confirm & Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="am-empty">No students selected for this assessment</div>
                  <div className="am-actions-row am-actions-right">
                    <button className="nm-btn" onClick={() => { setShowAssessmentModal(false); setEditingAssessActivityId(null); setActiveAssessGroupId(''); setGeneratedSlots([]); }}>Close</button>
                    <button className="nm-btn primary" onClick={generateAssessmentSlots}>Generate Schedule</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
