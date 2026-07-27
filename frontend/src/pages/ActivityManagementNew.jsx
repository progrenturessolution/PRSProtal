import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { adminAPI, taskAPI } from '../services/api';
import logo from '../assets/logo.png';
import './ActivityManagementNew.css';

function IconCard({ title, onClick, hasBadge }) {
  return (
    <button className="am-card" onClick={onClick} style={{ position: 'relative' }}>
      <div className="am-card-title">{title}</div>
      {hasBadge && (
        <span
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#f43f5e',
            boxShadow: '0 0 0 3px rgba(244, 63, 94, 0.2)'
          }}
        />
      )}
    </button>
  );
}

export default function ActivityManagementNew() {
  const [activities, setActivities] = useState([]);
  const [hasUnseenPendingApprovals, setHasUnseenPendingApprovals] = useState(false);
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
  const [inactiveWarning, setInactiveWarning] = useState(''); // global inactive warning for group selects

  // Interview form
  const [interviewForm, setInterviewForm] = useState({ interviewType: '', mode: 'Individual', date: '', startTime: '09:00', perGap: 15, interviewer: '', link: '' });
  const [interviewSelectedStudents, setInterviewSelectedStudents] = useState([]);
  const [activeInterviewGroupIds, setActiveInterviewGroupIds] = useState([]);
  const [activeGdGroupIds, setActiveGdGroupIds] = useState([]);
  const [activeAssessGroupIds, setActiveAssessGroupIds] = useState([]);
  const [isGdGroupDropdownOpen, setIsGdGroupDropdownOpen] = useState(false);
  const [isAssessGroupDropdownOpen, setIsAssessGroupDropdownOpen] = useState(false);
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [editingInterviewActivityId, setEditingInterviewActivityId] = useState(null);
  // Interview Individual Mode Dropdown State
  const [isInterviewIndividualDropdownOpen, setIsInterviewIndividualDropdownOpen] = useState(false);
  const [interviewIndividualDropdownSearchText, setInterviewIndividualDropdownSearchText] = useState('');
  const [isInterviewGroupDropdownOpen, setIsInterviewGroupDropdownOpen] = useState(false);
  const [openGroupDropdownId, setOpenGroupDropdownId] = useState('');
  const [interviewGroupDropdownSearchText, setInterviewGroupDropdownSearchText] = useState('');

  const [editingGdActivityId, setEditingGdActivityId] = useState(null);

  // GD form
  const [gdForm, setGdForm] = useState({ title: '', date: '', startTime: '09:00', groupMode: 'Auto', groupSize: 5, interviewer: '', link: '', mode: 'Individual' });
  const [gdGroups, setGdGroups] = useState([]);
  const [isGdDropdownOpen, setIsGdDropdownOpen] = useState(false);
  const [gdDropdownSearchText, setGdDropdownSearchText] = useState('');

  // Assessment form
  const [assessForm, setAssessForm] = useState({ type: 'Technical', title: '', description: '', date: '', time: '09:00', duration: 60, link: '', interviewer: '', mode: 'Individual' });
  const [assessSelected, setAssessSelected] = useState([]);
  const [editingAssessActivityId, setEditingAssessActivityId] = useState(null);
  const [isAssessDropdownOpen, setIsAssessDropdownOpen] = useState(false);
  const [assessDropdownSearchText, setAssessDropdownSearchText] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [createdByFilter, setCreatedByFilter] = useState('all');

  const filteredActivities = activities.filter((activity) => {
    // 1. Activity Type Filter
    if (activityFilter !== 'all') {
      const normalizedType = String(activity.type || '').toLowerCase();
      if (!normalizedType.includes(activityFilter)) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      const status = String(activity.status || 'Scheduled').toLowerCase();
      if (status !== statusFilter.toLowerCase()) return false;
    }

    // 3. Date Filter
    if (dateFilter) {
      const activityDate = activity.dateTime ? new Date(activity.dateTime).toISOString().split('T')[0] : '';
      if (activityDate !== dateFilter) return false;
    }

    // 4. Mode Filter
    if (modeFilter !== 'all') {
      const mode = String(getActivityModeLabel(activity)).toLowerCase();
      if (!mode.includes(modeFilter.toLowerCase())) return false;
    }

    // 5. Created By Filter
    if (createdByFilter !== 'all') {
      const creator = String(activity.createdByModel || 'Admin').toLowerCase();
      if (creator !== createdByFilter.toLowerCase()) return false;
    }

    return true;
  }).sort((a, b) => {
    const statusA = String(a.status || 'Scheduled').toLowerCase();
    const statusB = String(b.status || 'Scheduled').toLowerCase();
    
    if (statusA === 'completed' && statusB !== 'completed') return 1;
    if (statusA !== 'completed' && statusB === 'completed') return -1;
    
    const dateA = new Date(a.dateTime || a.date || a.createdAt || 0).getTime();
    const dateB = new Date(b.dateTime || b.date || b.createdAt || 0).getTime();
    return dateA - dateB; // Ascending
  });

  useEffect(() => {
    fetchActivities();
    fetchStudents();
    fetchTrainers();
    fetchGroups();
    checkPendingApprovalsUnseen();
  }, []);

  const checkPendingApprovalsUnseen = async () => {
    try {
      const response = await taskAPI.getAllTasks();
      if (response.data?.success) {
        const pending = (response.data.tasks || []).filter(t => t.status === "Pending Approval");
        let seenPendingMap = {};
        try {
          seenPendingMap = JSON.parse(localStorage.getItem("seenPendingApprovals") || "{}");
        } catch (e) {
          seenPendingMap = {};
        }

        const hasUnseen = pending.some(task => {
          const taskTime = new Date(task.updatedAt || task.createdAt || 0).getTime();
          const lastSeenTime = seenPendingMap[task._id] || 0;
          return taskTime > lastSeenTime;
        });

        setHasUnseenPendingApprovals(hasUnseen);
      }
    } catch (err) {
      console.error("Failed to check pending approvals unseen:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close action menu
      if (openActionMenu) {
        if (
          !e.target.closest("[data-menu]") &&
          !e.target.closest("[data-menu-toggle]")
        ) {
          setOpenActionMenu(null);
          setActionMenuPos(null);
        }
      }

      // Close Interview Individual Dropdown
      if (isInterviewIndividualDropdownOpen) {
        if (!e.target.closest("[data-interview-individual-dropdown]")) {
          setIsInterviewIndividualDropdownOpen(false);
        }
      }

      // Close Interview Group Dropdown
      if (isInterviewGroupDropdownOpen) {
        if (!e.target.closest("[data-interview-group-dropdown]")) {
          setIsInterviewGroupDropdownOpen(false);
        }
      }

      // Close GD Dropdown
      if (isGdDropdownOpen) {
        if (!e.target.closest("[data-gd-dropdown]")) {
          setIsGdDropdownOpen(false);
        }
      }

      // Close GD Group Dropdown
      if (isGdGroupDropdownOpen) {
        if (!e.target.closest("[data-gd-group-dropdown]")) {
          setIsGdGroupDropdownOpen(false);
        }
      }

      // Close Assessment Dropdown
      if (isAssessDropdownOpen) {
        if (!e.target.closest("[data-assess-dropdown]")) {
          setIsAssessDropdownOpen(false);
        }
      }

      // Close Assessment Group Dropdown
      if (isAssessGroupDropdownOpen) {
        if (!e.target.closest("[data-assess-group-dropdown]")) {
          setIsAssessGroupDropdownOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    // Don't close dropdowns on scroll inside the modal
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openActionMenu, isInterviewIndividualDropdownOpen, isInterviewGroupDropdownOpen, isGdDropdownOpen, isGdGroupDropdownOpen, isAssessDropdownOpen, isAssessGroupDropdownOpen]);

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

  function getStudentGroupName(studentId) {
    const sId = String(studentId);
    const foundGroup = groups.find(g => {
      const members = getGroupMemberList(g);
      return members.some(m => getGroupMemberId(m) === sId);
    });
    return foundGroup ? getGroupLabel(foundGroup) : '';
  }

  function getInterviewGroupLabel() {
    if (!activeInterviewGroupIds || activeInterviewGroupIds.length === 0) return '-';
    const groupLabels = activeInterviewGroupIds.map(gid => {
      const group = groups.find((item) => String(item._id || item.id || item.groupNumber || item.groupName) === String(gid));
      return group ? getGroupLabel(group) : '';
    }).filter(Boolean);
    return groupLabels.join(', ') || 'Selected Groups';
  }

  function handleInterviewModeChange(mode) {
    setInterviewForm((prev) => ({ ...prev, mode }));
    setInterviewSelectedStudents([]);
    setActiveInterviewGroupIds([]);
    setGeneratedSlots([]);
  }

  function handleGdModeChange(mode) {
    setGdForm((prev) => ({ ...prev, mode }));
    setSelectedStudents([]);
    setActiveGdGroupIds([]);
    setGdGroups([]);
    setInactiveWarning('');
  }

  function handleAssessModeChange(mode) {
    setAssessForm((prev) => ({ ...prev, mode }));
    setAssessSelected([]);
    setActiveAssessGroupIds([]);
    setGeneratedSlots([]);
    setInactiveWarning('');
  }

  function handleInterviewGroupToggle(group) {
    const groupId = String(group._id || group.id || group.groupNumber || group.groupName);
    const allMembers = getGroupMemberList(group);
    const activeMembers = [];
    const inactiveCount = { count: 0 };
    allMembers.forEach((member) => {
      const memberId = getGroupMemberId(member);
      // Try to find the full student record to check status
      const fullStudent = students.find(s => String(s._id || s.id) === memberId);
      const isInactive = fullStudent ? String(fullStudent.status || '').toLowerCase() === 'inactive' : false;
      if (isInactive) {
        inactiveCount.count++;
      } else {
        activeMembers.push(memberId);
      }
    });

    const isCurrentlySelected = activeInterviewGroupIds.includes(groupId);
    setInterviewSelectedStudents((prev) => {
      if (isCurrentlySelected) {
        // Remove members of this group
        return prev.filter(id => !activeMembers.includes(id));
      } else {
        // Add members of this group (prevent duplicates)
        const toAdd = activeMembers.filter(id => !prev.includes(id));
        return [...prev, ...toAdd];
      }
    });

    setActiveInterviewGroupIds((prev) => {
      if (isCurrentlySelected) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });

    setGeneratedSlots([]);
    if (inactiveCount.count > 0 && !isCurrentlySelected) {
      setInactiveWarning(`${inactiveCount.count} inactive student(s) from this group were automatically excluded from selection.`);
    } else {
      setInactiveWarning('');
    }
  }

  function handleGdGroupToggle(group) {
    const groupId = String(group._id || group.id || group.groupNumber || group.groupName);
    const allMembers = getGroupMemberList(group);
    const activeMembers = [];
    let inactiveCount = 0;
    allMembers.forEach((member) => {
      const memberId = getGroupMemberId(member);
      const fullStudent = students.find(s => String(s._id || s.id) === memberId);
      const isInactive = fullStudent ? String(fullStudent.status || '').toLowerCase() === 'inactive' : false;
      if (isInactive) {
        inactiveCount++;
      } else {
        activeMembers.push(memberId);
      }
    });

    const isCurrentlySelected = activeGdGroupIds.includes(groupId);
    setSelectedStudents((prev) => {
      if (isCurrentlySelected) {
        return prev.filter(id => !activeMembers.includes(id));
      } else {
        const toAdd = activeMembers.filter(id => !prev.includes(id));
        return [...prev, ...toAdd];
      }
    });

    setActiveGdGroupIds((prev) => {
      if (isCurrentlySelected) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });

    setGdGroups([]);
    if (inactiveCount > 0 && !isCurrentlySelected) {
      setInactiveWarning(`${inactiveCount} inactive student(s) from this group were automatically excluded from selection.`);
    } else {
      setInactiveWarning('');
    }
  }

  function handleAssessGroupToggle(group) {
    const groupId = String(group._id || group.id || group.groupNumber || group.groupName);
    const allMembers = getGroupMemberList(group);
    const activeMembers = [];
    let inactiveCount = 0;
    allMembers.forEach((member) => {
      const memberId = getGroupMemberId(member);
      const fullStudent = students.find(s => String(s._id || s.id) === memberId);
      const isInactive = fullStudent ? String(fullStudent.status || '').toLowerCase() === 'inactive' : (String(member.status || '').toLowerCase() === 'inactive');
      if (isInactive) {
        inactiveCount++;
      } else {
        activeMembers.push(memberId);
      }
    });

    const isCurrentlySelected = activeAssessGroupIds.includes(groupId);
    setAssessSelected((prev) => {
      if (isCurrentlySelected) {
        return prev.filter(id => !activeMembers.includes(id));
      } else {
        const toAdd = activeMembers.filter(id => !prev.includes(id));
        return [...prev, ...toAdd];
      }
    });

    setActiveAssessGroupIds((prev) => {
      if (isCurrentlySelected) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });

    if (inactiveCount > 0 && !isCurrentlySelected) {
      setInactiveWarning(`${inactiveCount} inactive student(s) from this group were automatically excluded from selection.`);
    } else {
      setInactiveWarning('');
    }
  }

  function generateInterviewSlots() {
    if (!interviewForm.interviewType) { alert('Please select an Interview Type'); return; }
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
      if (!interviewForm.interviewType) {
        alert('Please select an Interview Type');
        return;
      }
      if (interviewForm.mode === 'Group' && activeInterviewGroupIds.length === 0) {
        alert('Select at least one group first');
        return;
      }
      const allowedInterviewTypes = ['HR', 'PI', 'Technical'];
      const interviewTypeToSend = allowedInterviewTypes.includes(interviewForm.interviewType) ? interviewForm.interviewType : 'HR';
      const payload = { studentIds: interviewSelectedStudents, trainerId: interviewForm.interviewer || null, interviewerName: interviewForm.interviewer || '', interviewType: interviewTypeToSend, mode: interviewForm.mode, date: interviewForm.date, startTime: interviewForm.startTime, perGap: interviewForm.perGap, link: interviewForm.link || '' };
      if (interviewForm.mode === 'Group') {
        payload.groupId = activeInterviewGroupIds[0] || '';
        payload.groupIds = activeInterviewGroupIds;
      }
      const isEditingInterviewActivity = Boolean(editingInterviewActivityId);
      const res = isEditingInterviewActivity
        ? await adminAPI.updateActivity(editingInterviewActivityId, {
            type: 'Interview',
            title: `${interviewTypeToSend} Interview (${interviewForm.mode})`,
            dateTime: `${interviewForm.date}T${interviewForm.startTime}:00`,
            status: isEditingInterviewActivity ? 'Rescheduled' : 'Scheduled',
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
              groupIds: payload.groupIds || [],
              link: payload.link || '',
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
        setActiveInterviewGroupIds([]);
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

  function getGdGroupsPayload() {
    if (activeGdGroupIds && activeGdGroupIds.length > 0) {
      const gdGroupsList = [];
      activeGdGroupIds.forEach(gId => {
        const found = groups.find(g => String(g._id || g.id || g.groupNumber || g.groupName) === String(gId));
        if (found) {
          const members = getGroupMemberList(found).filter(m => {
            const memberId = getGroupMemberId(m);
            const fullStudent = students.find(s => String(s._id || s.id) === memberId);
            return !(fullStudent && String(fullStudent.status || '').toLowerCase() === 'inactive');
          });
          if (members.length > 0) {
            gdGroupsList.push(members);
          }
        }
      });
      return gdGroupsList;
    }
    const list = selectedStudents.length ? students.filter(s => selectedStudents.includes(String(s._id||s.id))) : [];
    const size = Number(gdForm.groupSize) || 5;
    const out = [];
    for (let i=0;i<list.length;i+=size) out.push(list.slice(i, i+size));
    return out;
  }

  async function saveGd() {
    try {
      // enforce group selection OR manual student selection
      if (activeGdGroupIds.length === 0 && selectedStudents.length === 0) {
        alert('Please select a group or choose students manually before saving the GD.');
        return;
      }
      const gdGroupsToSend = getGdGroupsPayload();
      const payloadDetails = { form: gdForm, groups: gdGroupsToSend, interviewerId: gdForm.interviewer || '', interviewerName: getTrainerLabel(gdForm.interviewer), assigned: selectedStudents, mode: 'Group', groupId: activeGdGroupIds[0] || '', groupIds: activeGdGroupIds, link: gdForm.link || '' };
      const activityPayload = { type: 'GD', title: gdForm.title || 'Group Discussion', dateTime: gdForm.date ? `${gdForm.date}T${gdForm.startTime||'00:00'}:00` : undefined, status: Boolean(editingGdActivityId) ? 'Rescheduled' : 'Scheduled', details: payloadDetails };
      const isEditing = Boolean(editingGdActivityId);
      const res = isEditing
        ? await adminAPI.updateActivity(editingGdActivityId, { title: activityPayload.title, dateTime: activityPayload.dateTime, status: activityPayload.status, type: activityPayload.type, details: activityPayload.details })
        : await adminAPI.createActivity(activityPayload);

      if (res.data?.success) {
        alert(isEditing ? 'Activity updated' : 'GD scheduled');
        setShowGDModal(false);
        setGdGroups([]);
        setSelectedStudents([]);
        setActiveGdGroupIds([]);
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
      if (activeAssessGroupIds.length > 0) {
        details.mode = 'Group';
        details.groupId = activeAssessGroupIds[0] || '';
        details.groupIds = activeAssessGroupIds;
      }

      const activityPayload = { type: 'Assessment', title: assessForm.title || `${assessForm.type} Assessment`, dateTime: assessForm.date ? `${assessForm.date}T${assessForm.time||'00:00'}:00` : undefined, status: Boolean(editingAssessActivityId) ? 'Rescheduled' : 'Scheduled', details };
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
          groupId: activeAssessGroupIds[0] || undefined
        };
        res = await adminAPI.createAssessment(schedPayload);
      }

      if (res.data?.success) {
        alert(isEditing ? 'Activity updated' : 'Assessment scheduled');
        setShowAssessmentModal(false);
        setAssessSelected([]);
        setActiveAssessGroupIds([]);
        setEditingAssessActivityId(null);
        if (isEditing && String(viewActivity?._id) === String(editingAssessActivityId)) setViewActivity(res.data.activity || null);
        fetchActivities();
      } else {
        console.error('Save assessment failed response:', res);
        alert(res.data?.message || 'Failed to schedule assessment');
      }
    } catch (e) { console.error('Save assessment error:', e); alert('Failed to schedule assessment'); }
  }

  const getStudentInfo = (id) => {
    const found = students.find(s => String(s._id || s.id) === String(id));
    return found ? { name: found.name, internId: found.internId || found.psmsId || '-', email: found.email || '-' } : { name: 'Unknown Student', internId: '-', email: '-' };
  };

  const downloadActivityPDF = (activity) => {
    if (!activity) return;
    try {
      const type = String(activity.type || '').toUpperCase();
      const dateStr = activity.dateTime ? formatActivityDateTime(activity.dateTime) : 'N/A';
      const docHeaderBadge = `${type} SCHEDULE - SMS PROGRAM`;
      
      let detailsHtml = '';
      let metaItemsHtml = `
        <div class="meta-item"><strong>Activity Title:</strong> ${activity.title || 'N/A'}</div>
        <div class="meta-item"><strong>Activity Type:</strong> ${activity.type || 'N/A'}</div>
        <div class="meta-item"><strong>Scheduled Date &amp; Time:</strong> ${dateStr}</div>
        <div class="meta-item"><strong>Status:</strong> ${activity.status || 'Scheduled'}</div>
      `;
      
      if (type.includes('INTERVIEW')) {
        const studentIds = activity.details?.studentIds || [];
        const slots = activity.details?.slots || [];
        const interviewer = activity.details?.interviewerName || 'N/A';
        const mode = activity.details?.mode || 'Individual';
        const intType = activity.details?.interviewType || 'N/A';
        
        metaItemsHtml = `
          <div class="meta-item"><strong>Interview Type:</strong> ${intType} Interview</div>
          <div class="meta-item"><strong>Interviewer:</strong> ${interviewer}</div>
          <div class="meta-item"><strong>Interview Date &amp; Time:</strong> ${dateStr}</div>
          <div class="meta-item"><strong>Mode:</strong> ${mode}</div>
          <div class="meta-item"><strong>Total Students:</strong> ${studentIds.length}</div>
          <div class="meta-item"><strong>Status:</strong> ${activity.status || 'Scheduled'}</div>
        `;
        
        detailsHtml = `
          <div class="section-title">Interview Slots &amp; Students</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">Slot No.</th>
                <th style="width: 25%;">Time Slot</th>
                <th style="width: 35%;">Student Name</th>
                <th style="width: 30%;">PSMS ID</th>
              </tr>
            </thead>
            <tbody>
              ${studentIds.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No students assigned</td></tr>' : 
                studentIds.map((id, index) => {
                  const studentInfo = getStudentInfo(id);
                  const slot = slots.find(s => String(s.studentId) === String(id));
                  let slotTimeStr = 'N/A';
                  if (slot && slot.date) {
                    slotTimeStr = formatReportTime(slot.date);
                  } else if (slot && slot.startTime) {
                    slotTimeStr = formatReportTime(slot.startTime);
                  }
                  return `
                    <tr>
                      <td style="text-align: center;">Slot ${index + 1}</td>
                      <td>${slotTimeStr}</td>
                      <td style="font-weight: 600;">${studentInfo.name}</td>
                      <td>${studentInfo.internId}</td>
                    </tr>
                  `;
                }).join('')
              }
            </tbody>
          </table>
        `;
      } else if (type.includes('GD')) {
        const interviewer = activity.details?.interviewerName || 'N/A';
        const groups = activity.details?.groups || [];
        const groupName = activity.details?.form?.groupName || 'N/A';
        
        const gdStudents = [];
        groups.forEach(g => {
          const members = Array.isArray(g) ? g : (g.members || []);
          members.forEach(m => {
            const mid = m?._id || m?.id || m?.studentId || m || '';
            if (mid) gdStudents.push(mid);
          });
        });
        
        metaItemsHtml = `
          <div class="meta-item"><strong>Moderator / Trainer:</strong> ${interviewer}</div>
          <div class="meta-item"><strong>Target Group:</strong> ${groupName}</div>
          <div class="meta-item"><strong>Scheduled Date &amp; Time:</strong> ${dateStr}</div>
          <div class="meta-item"><strong>GD Status:</strong> ${activity.status || 'Scheduled'}</div>
          <div class="meta-item"><strong>Total Participants:</strong> ${gdStudents.length}</div>
        `;
        
        detailsHtml = `
          <div class="section-title">GD Participants</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">#</th>
                <th style="width: 30%;">PSMS ID</th>
                <th style="width: 35%;">Student Name</th>
                <th style="width: 25%;">Email</th>
              </tr>
            </thead>
            <tbody>
              ${gdStudents.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No participants assigned</td></tr>' : 
                gdStudents.map((id, index) => {
                  const studentInfo = getStudentInfo(id);
                  return `
                    <tr>
                      <td style="text-align: center;">${index + 1}</td>
                      <td>${studentInfo.internId}</td>
                      <td style="font-weight: 600;">${studentInfo.name}</td>
                      <td>${studentInfo.email}</td>
                    </tr>
                  `;
                }).join('')
              }
            </tbody>
          </table>
        `;
      } else if (type.includes('ASSESSMENT')) {
        const interviewer = activity.details?.interviewerName || 'N/A';
        const assigned = activity.details?.assigned || [];
        const description = activity.details?.form?.description || 'N/A';
        const link = activity.details?.form?.link || 'N/A';
        
        metaItemsHtml = `
          <div class="meta-item"><strong>Evaluator:</strong> ${interviewer}</div>
          <div class="meta-item"><strong>Scheduled Date &amp; Time:</strong> ${dateStr}</div>
          <div class="meta-item"><strong>Total Assigned:</strong> ${assigned.length}</div>
          <div class="meta-item"><strong>Status:</strong> ${activity.status || 'Scheduled'}</div>
          ${link !== 'N/A' ? `<div class="meta-item" style="grid-column: span 2;"><strong>Submission Link:</strong> ${link}</div>` : ''}
          ${description !== 'N/A' ? `<div class="meta-item" style="grid-column: span 2;"><strong>Description:</strong> ${description}</div>` : ''}
        `;
        
        detailsHtml = `
          <div class="section-title">Assigned Students</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">#</th>
                <th style="width: 30%;">PSMS ID</th>
                <th style="width: 35%;">Student Name</th>
                <th style="width: 25%;">Email</th>
              </tr>
            </thead>
            <tbody>
              ${assigned.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No students assigned</td></tr>' : 
                assigned.map((id, index) => {
                  const studentInfo = getStudentInfo(id);
                  return `
                    <tr>
                      <td style="text-align: center;">${index + 1}</td>
                      <td>${studentInfo.internId}</td>
                      <td style="font-weight: 600;">${studentInfo.name}</td>
                      <td>${studentInfo.email}</td>
                    </tr>
                  `;
                }).join('')
              }
            </tbody>
          </table>
        `;
      } else {
        const assigned = activity.details?.assigned || [];
        detailsHtml = `
          <div class="section-title">Assigned Participants</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">#</th>
                <th style="width: 30%;">PSMS ID</th>
                <th style="width: 35%;">Student Name</th>
                <th style="width: 25%;">Email</th>
              </tr>
            </thead>
            <tbody>
              ${assigned.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No participants assigned</td></tr>' : 
                assigned.map((id, index) => {
                  const studentInfo = getStudentInfo(id);
                  return `
                    <tr>
                      <td style="text-align: center;">${index + 1}</td>
                      <td>${studentInfo.internId}</td>
                      <td style="font-weight: 600;">${studentInfo.name}</td>
                      <td>${studentInfo.email}</td>
                    </tr>
                  `;
                }).join('')
              }
            </tbody>
          </table>
        `;
      }
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Activity Schedule - ${activity.title || 'Report'}</title>
            <style>
              @page {
                size: A4;
                margin: 12mm 15mm;
              }
              * {
                box-sizing: border-box;
              }
              html, body {
                background-color: #324158 !important;
                color: #ffffff !important;
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .pdf-container {
                background-color: #324158;
                color: #ffffff;
                padding: 24px;
                min-height: 100vh;
              }
              .header-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #4a5a73;
                padding-bottom: 16px;
                margin-bottom: 24px;
              }
              .brand-box {
                display: flex;
                align-items: center;
                gap: 12px;
              }
              .brand-logo {
                max-height: 52px;
                max-width: 180px;
                object-fit: contain;
                background: #ffffff;
                padding: 4px 8px;
                border-radius: 6px;
              }
              .brand-name {
                font-size: 16px;
                font-weight: 800;
                color: #ffffff;
                letter-spacing: 0.5px;
                text-transform: uppercase;
              }
              .doc-meta-right {
                text-align: right;
              }
              .doc-badge {
                font-size: 14px;
                font-weight: 800;
                color: #ffffff;
                text-transform: uppercase;
                letter-spacing: 0.8px;
              }
              .doc-sub {
                font-size: 11px;
                color: #cbd5e1;
                margin-top: 3px;
              }
              .main-title {
                text-align: center;
                font-size: 22px;
                font-weight: 800;
                color: #ffffff;
                margin: 10px 0 24px 0;
                letter-spacing: 0.5px;
              }
              .meta-card {
                background-color: #ffffff !important;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 16px 20px;
                margin-bottom: 24px;
              }
              .meta-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px 24px;
              }
              .meta-item {
                font-size: 13.5px;
                color: #324158 !important;
                line-height: 1.5;
              }
              .meta-item strong {
                font-weight: 500;
                color: #324158 !important;
                margin-right: 6px;
              }
              .section-title {
                font-size: 15px;
                font-weight: 700;
                color: #ffffff;
                margin: 24px 0 12px 0;
                padding-bottom: 6px;
                border-bottom: 1px solid #4a5a73;
              }
              .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                background-color: #ffffff;
                border-radius: 6px;
                overflow: hidden;
              }
              .data-table th, .data-table td {
                padding: 11px 14px;
                text-align: left;
                font-size: 13px;
                border: 1px solid #cbd5e1;
              }
              .data-table th {
                background-color: #324158 !important;
                color: #ffffff !important;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 12px;
                border: 1px solid #4a5a73;
              }
              .data-table td {
                background-color: #ffffff !important;
                color: #324158 !important;
              }
              .data-table tr:nth-child(even) td {
                background-color: #f8fafc !important;
              }
              .data-table tr:nth-child(odd) td {
                background-color: #ffffff !important;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                border-top: 1px solid #4a5a73;
                padding-top: 14px;
                font-size: 11px;
                color: #94a3b8;
              }
            </style>
          </head>
          <body>
            <div class="pdf-container">
              <div class="header-bar">
                <div class="brand-box">
                  <img src="${logo}" alt="Progrentures Logo" class="brand-logo" onerror="this.style.display='none'" />
                  <div class="brand-name">Progrentures Solution</div>
                </div>
                <div class="doc-meta-right">
                  <div class="doc-badge">${docHeaderBadge}</div>
                  <div class="doc-sub">Generated: ${formatActivityDateTime(new Date().toISOString())}</div>
                </div>
              </div>
              
              <h1 class="main-title">${activity.title || 'Activity Schedule'}</h1>
              
              <div class="meta-card">
                <div class="meta-grid">
                  ${metaItemsHtml}
                </div>
              </div>
              
              ${detailsHtml}
              
              <div class="footer">
                This document is generated by PRS Portal. Confirmed and verified by Progrentures Solution Pvt. Ltd.
              </div>
            </div>
          </body>
        </html>
      `;
      
      const printWindow = window.open("", "", "height=750,width=950");
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (error) {
      console.error('Failed to download activity PDF', error);
      alert('Failed to generate PDF');
    }
  };

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
        interviewer: pick('form.interviewer', 'interviewer', 'trainerId', 'trainer') || '',
        link: pick('form.link', 'link', 'details.link') || ''
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
        interviewer: pick('form.interviewer', 'interviewer', 'trainerId') || '',
        link: pick('form.link', 'link', 'details.link') || ''
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
      let gdMode = 'Individual';
      if (possibleGroupId) {
        const gidNorm = normalizeVal(possibleGroupId);
        const foundG = (groupsList || []).find(g => String(g._id || g.id || g.groupNumber || g.groupName) === gidNorm);
        if (foundG) setActiveGdGroupIds([String(foundG._id || foundG.id)]);
        else setActiveGdGroupIds([gidNorm]);
        gdMode = 'Group';
      } else {
        setActiveGdGroupIds([]);
      }
      setGdForm(prev => ({ ...prev, interviewer: resolvedInterviewer, mode: gdMode }));
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
      // set active group if present
      const possibleGroupId = pick('groupId', 'form.groupId') || details.groupId || details.form?.groupId || '';
      let assessMode = 'Individual';
      if (possibleGroupId) {
        const gidNorm = normalizeVal(possibleGroupId);
        const foundG = (groupsList || []).find(g => String(g._id || g.id || g.groupNumber || g.groupName) === gidNorm);
        if (foundG) setActiveAssessGroupIds([String(foundG._id || foundG.id)]);
        else setActiveAssessGroupIds([gidNorm]);
        assessMode = 'Group';
      } else {
        setActiveAssessGroupIds([]);
      }
      setAssessForm(prev => ({ ...prev, interviewer: resolvedInterviewer, mode: assessMode }));

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
          ...(isGroupInterview ? [{ label: 'Group', value: groupRecord?.groupName || groupRecord?.groupNumber || details.groupId || 'Group schedule' }] : []),
          ...(details.link || details.form?.link ? [{ label: 'Link', value: details.link || details.form.link, isLink: true }] : [])
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
      let gdAssignedIds = assignedIds;
      if (!gdAssignedIds.length && Array.isArray(details.groups)) {
        const flat = [];
        details.groups.forEach(g => {
          const members = Array.isArray(g) ? g : (g.students || []);
          members.forEach(m => {
            if (m) {
              const id = m._id || m.id || m.internId || m;
              if (id) flat.push(String(id));
            }
          });
        });
        gdAssignedIds = Array.from(new Set(flat));
      }
      const dateTimeText = activityDate
        ? `${formatReportDate(activityDate)} ${formatReportTime(details.form?.startTime || activity?.dateTime || details.startTime || '')}`
        : '-';
      return {
        kind: 'gd',
        title: 'Group Discussion Schedule - SMS Program',
        kicker: 'DISCUSSION FLOW',
        meta: [
          { label: 'GD Title', value: activity?.title || details.form?.title || 'Group Discussion' },
          { label: 'Date', value: formatReportDate(activityDate) },
          { label: 'Interviewer', value: interviewerName },
          { label: 'Group Mode', value: details.form?.groupMode || details.groupMode || 'Auto' },
          ...(details.link || details.form?.link ? [{ label: 'Link', value: details.link || details.form.link, isLink: true }] : [])
        ],
        columns: ['Slot No.', 'Student Name', 'PSMS ID', 'Interviewer', 'Date & Time'],
        rows: gdAssignedIds.length ? gdAssignedIds.map((studentId, index) => {
          const student = getStudentRecord(studentId);
          return {
            slotNo: `Slot ${index + 1}`,
            studentName: student?.name || studentId || '-',
            psmsId: student?.internId || 'NA',
            interviewer: interviewerName,
            timeSlot: dateTimeText
          };
        }) : []
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
        { label: 'Duration', value: `${details.form?.duration || details.duration || '-'} mins` },
        ...(details.link || details.form?.link ? [{ label: 'Link', value: details.link || details.form.link, isLink: true }] : [])
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
                    <option>Rescheduled</option>
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
                        {item.isLink ? (
                          <a href={item.value} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline", wordBreak: "break-all" }}>
                            {item.value}
                          </a>
                        ) : (
                          <span>{item.value}</span>
                        )}
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
                            let cells;
                            if (report.kind === 'assessment') {
                              cells = [row.slotNo, row.studentName, row.psmsId, row.timeSlot];
                            } else if (report.kind === 'gd') {
                              cells = [row.slotNo, row.studentName, row.psmsId, row.interviewer, row.timeSlot];
                            } else {
                              cells = [row.slotNo, row.timeSlot, row.studentName, row.psmsId];
                            }
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
        <IconCard title="Pending Approval" onClick={() => { window.location.hash = '#pending-approvals'; window.dispatchEvent(new CustomEvent('openAdminMenu', { detail: { menu: 'pending-approvals' } })); }} hasBadge={hasUnseenPendingApprovals} />
        <IconCard title="Schedule Interviews" onClick={() => { setEditingInterviewActivityId(null); setInterviewForm({ interviewType: '', mode: 'Individual', date: '', startTime: '09:00', perGap: 15, interviewer: '', link: '' }); setShowInterviewModal(true); }} />
        <IconCard title="Schedule GD Round" onClick={() => { setEditingGdActivityId(null); setGdForm({ title: '', date: '', startTime: '09:00', groupMode: 'Auto', groupSize: 5, interviewer: '', link: '', mode: 'Individual' }); setShowGDModal(true); }} />
        <IconCard title="Schedule Assessment" onClick={() => { setEditingAssessActivityId(null); setAssessForm({ type: 'Technical', title: '', description: '', date: '', time: '09:00', duration: 60, link: '', interviewer: '', mode: 'Individual' }); setActiveAssessGroupIds([]); setGeneratedSlots([]); setShowAssessmentModal(true); }} />
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

        {/* Advanced Filters Panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px'
        }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: 'white',
                fontSize: '13px',
                color: '#324158',
                fontWeight: '500'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#324158',
                fontWeight: '500',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Mode Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Mode</label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: 'white',
                fontSize: '13px',
                color: '#324158',
                fontWeight: '500'
              }}
            >
              <option value="all">All Modes</option>
              <option value="Individual">Individual</option>
              <option value="Group">Group</option>
            </select>
          </div>

          {/* Created By Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Created By</label>
            <select
              value={createdByFilter}
              onChange={(e) => setCreatedByFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: 'white',
                fontSize: '13px',
                color: '#324158',
                fontWeight: '500'
              }}
            >
              <option value="all">All Creators</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('');
                setModeFilter('all');
                setCreatedByFilter('all');
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #324158',
                background: 'transparent',
                color: '#324158',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#324158';
                e.target.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#324158';
              }}
            >
              Reset Filters
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
                                  onClick={() => {
                                    downloadActivityPDF(activity);
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
                                  Download PDF
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
                      <option value="" disabled>Select Interview Type</option>
                      <option value="HR">HR</option>
                      <option value="PI">PI</option>
                      <option value="Technical">Technical</option>
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

                  <div className="am-field am-span-2">
                    <label>Link</label>
                    <input value={interviewForm.link || ''} onChange={e => setInterviewForm(f => ({ ...f, link: e.target.value }))} placeholder="Enter interview join link" />
                  </div>
                </div>
              </section>

              <section className="am-form-panel">
                <div className="am-panel-head">
                  <h4>{interviewForm.mode === 'Group' ? 'Select Group & Members' : 'Select Students'}</h4>
                  <p>{interviewForm.mode === 'Group' ? 'Pick a group to expand, then choose the members you want to include.' : 'Choose the students who should be included in this schedule.'}</p>
                </div>
                {inactiveWarning && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
                    <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>{inactiveWarning}</span>
                    <button type="button" onClick={() => setInactiveWarning('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>×</button>
                  </div>
                )}

                {interviewForm.mode === 'Individual' ? (
                  <div data-interview-individual-dropdown style={{ position: 'relative' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0f172a'
                      }}
                    >
                      Search & Select Students
                    </label>
                    <div style={{ position: 'relative' }} data-interview-individual-dropdown>
                      <div
                        data-interview-individual-dropdown
                        onClick={() => setIsInterviewIndividualDropdownOpen(!isInterviewIndividualDropdownOpen)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: `2px solid ${isInterviewIndividualDropdownOpen ? '#3b82f6' : '#cbd5e1'}`,
                          borderRadius: '10px',
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s',
                          color: interviewSelectedStudents.length > 0 ? '#0f172a' : '#94a3b8',
                          userSelect: 'none',
                        }}
                      >
                        <span>{interviewSelectedStudents.length > 0 ? `${interviewSelectedStudents.length} student(s) selected` : 'Search & select students...'}</span>
                        <span style={{ fontSize: '11px', transition: 'transform 0.2s', transform: isInterviewIndividualDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                      </div>
                      {isInterviewIndividualDropdownOpen && (
                        <div
                          data-interview-individual-dropdown
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '6px',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                            zIndex: 99999,
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            <input
                              autoFocus
                              type="text"
                              value={interviewIndividualDropdownSearchText}
                              onChange={(e) => setInterviewIndividualDropdownSearchText(e.target.value)}
                              placeholder="Type to search by name, ID, email..."
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '13px',
                                background: '#f8fafc',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                          {interviewIndividualDropdownSearchText && (
                            <div
                              data-interview-individual-dropdown
                              onClick={() => { setInterviewIndividualDropdownSearchText(''); }}
                              style={{ padding: '10px 14px', fontSize: '13px', color: '#dc2626', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}
                            >
                              ✕ Clear search
                            </div>
                          )}
                          {interviewSelectedStudents.length > 0 && (
                            <div
                              data-interview-individual-dropdown
                              onClick={() => { setInterviewSelectedStudents([]); }}
                              style={{ padding: '10px 14px', fontSize: '13px', color: '#dc2626', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}
                            >
                              ✕ Clear all selections
                            </div>
                          )}
                          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                            {students
                              .filter(s =>
                                !interviewIndividualDropdownSearchText ||
                                s.name?.toLowerCase().includes(interviewIndividualDropdownSearchText.toLowerCase()) ||
                                s.internId?.toLowerCase().includes(interviewIndividualDropdownSearchText.toLowerCase()) ||
                                s.email?.toLowerCase().includes(interviewIndividualDropdownSearchText.toLowerCase())
                              )
                              .slice(0, 50)
                              .map((s) => {
                                const initials = (s.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                const isInactive = String(s.status || '').toLowerCase() === 'inactive';
                                const sid = String(s._id || s.id);
                                return (
                                  <div
                                    key={sid}
                                    data-interview-individual-dropdown
                                    onClick={(e) => { e.stopPropagation(); if (!isInactive) toggleInterviewStudent(sid); }}
                                    title={isInactive ? 'This student is inactive and cannot be selected' : ''}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '10px 14px',
                                      borderBottom: '1px solid #f8fafc',
                                      cursor: isInactive ? 'not-allowed' : 'pointer',
                                      transition: 'background 0.15s',
                                      background: isInactive ? '#fef2f2' : (interviewSelectedStudents.includes(sid) ? '#f1f5f9' : 'transparent'),
                                      opacity: isInactive ? 0.65 : 1,
                                    }}
                                    onMouseEnter={e => {
                                      if (!isInactive && !interviewSelectedStudents.includes(sid)) {
                                        e.currentTarget.style.background = '#f1f5f9';
                                      }
                                    }}
                                    onMouseLeave={e => {
                                      if (!isInactive && !interviewSelectedStudents.includes(sid)) {
                                        e.currentTarget.style.background = 'transparent';
                                      }
                                    }}
                                  >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isInactive ? '#fee2e2' : '#e0e7ff', color: isInactive ? '#991b1b' : '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                                      {initials}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: '13px', fontWeight: 600, color: isInactive ? '#9ca3af' : '#0f172a', textDecoration: isInactive ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {s.name}
                                        {getStudentGroupName(sid) && (
                                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#4f46e5', background: '#e0e7ff', padding: '1px 6px', borderRadius: '4px' }}>
                                            {getStudentGroupName(sid)}
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#64748b' }}>{s.internId} • {s.email}</div>
                                    </div>
                                    {isInactive ? (
                                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>INACTIVE</span>
                                    ) : (
                                      <input
                                        type="checkbox"
                                        checked={interviewSelectedStudents.includes(sid)}
                                        onChange={() => toggleInterviewStudent(sid)}
                                        style={{ cursor: 'pointer' }}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            {students.filter(s =>
                              !interviewIndividualDropdownSearchText ||
                              s.name?.toLowerCase().includes(interviewIndividualDropdownSearchText.toLowerCase()) ||
                              s.internId?.toLowerCase().includes(interviewIndividualDropdownSearchText.toLowerCase()) ||
                              s.email?.toLowerCase().includes(interviewIndividualDropdownSearchText.toLowerCase())
                            ).length === 0 && (
                              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No students found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="am-group-list">
                    {groups.length === 0 ? (
                      <div className="am-empty">No groups found</div>
                    ) : (
                    groups.map((group) => {
                      const groupId = String(group._id || group.id || group.groupNumber || group.groupName);
                      const memberList = getGroupMemberList(group);
                      const isActive = activeInterviewGroupIds.includes(groupId);
                      const isDropdownOpen = openGroupDropdownId === groupId;
                      return (
                        <div key={groupId} className={`am-group-card ${isActive ? 'active' : ''}`}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '10px 14px',
                              background: isActive ? '#f1f5f9' : 'transparent',
                              borderBottom: '1px solid #f8fafc',
                              gap: '10px',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => handleInterviewGroupToggle(group)}
                              style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                            />
                            <div
                              onClick={() => handleInterviewGroupToggle(group)}
                              style={{ cursor: 'pointer', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                              <div>
                                <strong>{getGroupLabel(group)}</strong>
                                <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '12px' }}>{group.groupNumber || ''}</span>
                              </div>
                              <div style={{ fontSize: '13px', color: '#64748b' }}>{memberList.length} members</div>
                            </div>
                            {isActive && (
                              <button
                                type="button"
                                onClick={() => setOpenGroupDropdownId(isDropdownOpen ? '' : groupId)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#344158',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 600
                                }}
                              >
                                Members
                                <span style={{ fontSize: '10px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                              </button>
                            )}
                          </div>

                          {isActive && isDropdownOpen && (
                            <div className="am-group-members-panel" style={{ borderTop: '1px solid #e2e8f0', padding: '12px 14px' }}>
                              <div className="am-group-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label className="am-group-toggle-all" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={memberList.length > 0 && memberList.every((member) => interviewSelectedStudents.includes(getGroupMemberId(member)))}
                                    onChange={(event) => {
                                      const memberIds = memberList.map((member) => getGroupMemberId(member));
                                      if (event.target.checked) {
                                        setInterviewSelectedStudents(prev => {
                                          const toAdd = memberIds.filter(id => !prev.includes(id));
                                          return [...prev, ...toAdd];
                                        });
                                      } else {
                                        setInterviewSelectedStudents(prev => prev.filter(id => !memberIds.includes(id)));
                                      }
                                    }}
                                  />
                                  Select full group
                                </label>
                              </div>
                              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {memberList.map((member) => {
                                  const memberId = getGroupMemberId(member);
                                  const fullStudent = students.find(s => String(s._id || s.id) === memberId);
                                  const isInactive = fullStudent ? String(fullStudent.status || '').toLowerCase() === 'inactive' : (String(member.status || '').toLowerCase() === 'inactive');
                                  const initials = (member.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                  return (
                                    <div
                                      key={memberId}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px 10px',
                                        borderBottom: '1px solid #f8fafc',
                                        cursor: isInactive ? 'not-allowed' : 'pointer',
                                        background: isInactive ? '#fef2f2' : (interviewSelectedStudents.includes(memberId) ? '#f8fafc' : 'transparent'),
                                        opacity: isInactive ? 0.65 : 1,
                                      }}
                                      onClick={() => { if (!isInactive) toggleInterviewStudent(memberId); }}
                                    >
                                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isInactive ? '#fee2e2' : '#e0e7ff', color: isInactive ? '#991b1b' : '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                                        {initials}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: isInactive ? '#9ca3af' : '#0f172a', textDecoration: isInactive ? 'line-through' : 'none' }}>
                                          {member.name || 'Unnamed Student'}
                                        </div>
                                      </div>
                                      {isInactive ? (
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '1px 4px', borderRadius: '4px' }}>INACTIVE</span>
                                      ) : (
                                        <input
                                          type="checkbox"
                                          checked={interviewSelectedStudents.includes(memberId)}
                                          onChange={() => toggleInterviewStudent(memberId)}
                                          style={{ cursor: 'pointer' }}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
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
                onClick={() => { setShowGDModal(false); setEditingGdActivityId(null); setSelectedStudents([]); setActiveGdGroupIds([]); setGdGroups([]); }}
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
                    <label>Mode</label>
                    <select value={gdForm.mode || 'Individual'} onChange={e => handleGdModeChange(e.target.value)}>
                      <option>Individual</option>
                      <option>Group</option>
                    </select>
                  </div>

                  <div className="am-field">
                    <label>Group Size (auto)</label>
                    <input type="number" value={gdForm.groupSize} onChange={e => setGdForm(f => ({ ...f, groupSize: Number(e.target.value) }))} />
                  </div>

                  <div className="am-field am-span-2">
                    <label>Link</label>
                    <input value={gdForm.link || ''} onChange={e => setGdForm(f => ({ ...f, link: e.target.value }))} placeholder="Enter GD join link" />
                  </div>
                </div>
              </section>

              <section className="am-form-panel">
                <div className="am-panel-head">
                  <h4>{gdForm.mode === 'Group' ? 'Select Group & Members' : 'Participants'}</h4>
                  <p>{gdForm.mode === 'Group' ? 'Pick a group to expand, then choose the members you want to include.' : 'Select students to include. If left blank, the system uses the default group set.'}</p>
                </div>
                {inactiveWarning && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
                    <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>{inactiveWarning}</span>
                    <button type="button" onClick={() => setInactiveWarning('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>×</button>
                  </div>
                )}
                {gdForm.mode === 'Group' ? (
                  <div className="am-group-list" style={{ display: 'block', maxHeight: '240px', overflowY: 'auto', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '12px', background: '#f8fafc', boxSizing: 'border-box' }}>
                    {groups.length === 0 ? (
                      <div className="am-empty" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No groups found</div>
                    ) : (
                      groups.map((group) => {
                        const groupId = String(group._id || group.id || group.groupNumber || group.groupName);
                        const memberList = getGroupMemberList(group);
                        const isActive = activeGdGroupIds.includes(groupId);
                        const isDropdownOpen = openGroupDropdownId === `gd_${groupId}`;
                        return (
                          <div key={groupId} className={`am-group-card ${isActive ? 'active' : ''}`} style={{ marginBottom: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', overflow: 'hidden' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px 14px',
                                background: isActive ? '#f1f5f9' : 'transparent',
                                borderBottom: isActive ? '1px solid #e2e8f0' : 'none',
                                gap: '10px',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={() => handleGdGroupToggle(group)}
                                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                              />
                              <div
                                onClick={() => handleGdGroupToggle(group)}
                                style={{ cursor: 'pointer', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', minWidth: 0 }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getGroupLabel(group)}</strong>
                                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' }}>{group.groupNumber ? `Group #${group.groupNumber}` : ''}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }}>{memberList.length} members</div>
                              </div>
                              {isActive && (
                                <button
                                  type="button"
                                  onClick={() => setOpenGroupDropdownId(isDropdownOpen ? '' : `gd_${groupId}`)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#4f46e5',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 600
                                  }}
                                >
                                  Members
                                  <span style={{ fontSize: '9px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                                </button>
                              )}
                            </div>

                            {isActive && isDropdownOpen && (
                              <div className="am-group-members-panel" style={{ borderTop: '1px solid #e2e8f0', padding: '10px 12px', background: '#fafafa' }}>
                                <div className="am-group-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <label className="am-group-toggle-all" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                                    <input
                                      type="checkbox"
                                      checked={memberList.length > 0 && memberList.every((member) => selectedStudents.includes(getGroupMemberId(member)))}
                                      onChange={(event) => {
                                        const memberIds = memberList.map((member) => getGroupMemberId(member));
                                        if (event.target.checked) {
                                          const activeMemberIds = [];
                                          let inactiveCount = 0;
                                          memberList.forEach(m => {
                                            const mid = getGroupMemberId(m);
                                            const fullStudent = students.find(s => String(s._id || s.id) === mid);
                                            const isInactive = fullStudent ? String(fullStudent.status || '').toLowerCase() === 'inactive' : (String(m.status || '').toLowerCase() === 'inactive');
                                            if (isInactive) inactiveCount++;
                                            else activeMemberIds.push(mid);
                                          });
                                          setSelectedStudents(prev => {
                                            const toAdd = activeMemberIds.filter(id => !prev.includes(id));
                                            return [...prev, ...toAdd];
                                          });
                                          if (inactiveCount > 0) {
                                            setInactiveWarning(`${inactiveCount} inactive student(s) from this group were automatically excluded from selection.`);
                                          } else {
                                            setInactiveWarning('');
                                          }
                                        } else {
                                          setSelectedStudents(prev => prev.filter(id => !memberIds.includes(id)));
                                          setInactiveWarning('');
                                        }
                                      }}
                                    />
                                    Select full group
                                  </label>
                                </div>
                                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                  {memberList.map((member) => {
                                    const memberId = getGroupMemberId(member);
                                    const fullStudent = students.find(s => String(s._id || s.id) === memberId);
                                    const isInactive = fullStudent ? String(fullStudent.status || '').toLowerCase() === 'inactive' : (String(member.status || '').toLowerCase() === 'inactive');
                                    const initials = (member.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                    return (
                                      <div
                                        key={memberId}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '10px',
                                          padding: '8px 10px',
                                          borderBottom: '1px solid #f1f5f9',
                                          cursor: isInactive ? 'not-allowed' : 'pointer',
                                          background: isInactive ? '#fef2f2' : (selectedStudents.includes(memberId) ? '#f8fafc' : 'transparent'),
                                          opacity: isInactive ? 0.65 : 1,
                                        }}
                                        onClick={() => { if (!isInactive) toggleStudent(memberId); }}
                                      >
                                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isInactive ? '#fee2e2' : '#e0e7ff', color: isInactive ? '#991b1b' : '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                                          {initials}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: '12px', fontWeight: 600, color: isInactive ? '#9ca3af' : '#0f172a', textDecoration: isInactive ? 'line-through' : 'none' }}>
                                            {member.name || 'Unnamed Student'}
                                          </div>
                                        </div>
                                        {isInactive ? (
                                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '1px 4px', borderRadius: '4px' }}>INACTIVE</span>
                                        ) : (
                                          <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(memberId)}
                                            onChange={() => toggleStudent(memberId)}
                                            style={{ cursor: 'pointer' }}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div data-gd-dropdown style={{ position: 'relative' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0f172a'
                      }}
                    >
                      Search & Select Students
                    </label>
                    <div style={{ position: 'relative' }} data-gd-dropdown>
                      <div
                        data-gd-dropdown
                        onClick={() => setIsGdDropdownOpen(!isGdDropdownOpen)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: `2px solid ${isGdDropdownOpen ? '#3b82f6' : '#cbd5e1'}`,
                          borderRadius: '10px',
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s',
                          color: selectedStudents.length > 0 ? '#0f172a' : '#94a3b8',
                          userSelect: 'none',
                        }}
                      >
                        <span>{selectedStudents.length > 0 ? `${selectedStudents.length} student(s) selected` : 'Search & select students...'}</span>
                        <span style={{ fontSize: '11px', transition: 'transform 0.2s', transform: isGdDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                      </div>
                      {isGdDropdownOpen && (
                        <div
                          data-gd-dropdown
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '6px',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                            zIndex: 99999,
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            <input
                              autoFocus
                              type="text"
                              value={gdDropdownSearchText}
                              onChange={(e) => setGdDropdownSearchText(e.target.value)}
                              placeholder="Type to search by name, ID, email..."
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '13px',
                                background: '#f8fafc',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                          {gdDropdownSearchText && (
                            <div
                              data-gd-dropdown
                              onClick={() => { setGdDropdownSearchText(''); }}
                              style={{ padding: '10px 14px', fontSize: '13px', color: '#dc2626', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}
                            >
                              ✕ Clear search
                            </div>
                          )}
                          {selectedStudents.length > 0 && (
                            <div
                              data-gd-dropdown
                              onClick={() => { setSelectedStudents([]); }}
                              style={{ padding: '10px 14px', fontSize: '13px', color: '#dc2626', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}
                            >
                              ✕ Clear all selections
                            </div>
                          )}
                          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                            {(function() {
                              let studentsList = [];
                              if (activeGdGroupIds && activeGdGroupIds.length > 0) {
                                activeGdGroupIds.forEach(gId => {
                                  const found = groups.find(g => String(g._id || g.id || g.groupNumber || g.groupName) === String(gId));
                                  if (found) {
                                    studentsList.push(...getGroupMemberList(found));
                                  }
                                });
                                const seen = new Set();
                                studentsList = studentsList.filter(s => {
                                  const sid = getGroupMemberId(s);
                                  if (seen.has(sid)) return false;
                                  seen.add(sid);
                                  return true;
                                });
                              } else {
                                studentsList = students;
                              }
                              return studentsList
                                .filter(s =>
                                  !gdDropdownSearchText ||
                                  s.name?.toLowerCase().includes(gdDropdownSearchText.toLowerCase()) ||
                                  s.internId?.toLowerCase().includes(gdDropdownSearchText.toLowerCase()) ||
                                  s.email?.toLowerCase().includes(gdDropdownSearchText.toLowerCase())
                                )
                                .slice(0, 50)
                                .map((s) => {
                                  const id = activeGdGroupIds.length > 0 ? getGroupMemberId(s) : String(s._id || s.id);
                                  const isInactive = String(s.status || '').toLowerCase() === 'inactive';
                                  const initials = (s.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                  return (
                                    <div
                                      key={id}
                                      data-gd-dropdown
                                      onClick={(e) => { e.stopPropagation(); if (!isInactive) toggleStudent(id); }}
                                      title={isInactive ? 'This student is inactive and cannot be selected' : ''}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 14px',
                                        borderBottom: '1px solid #f8fafc',
                                        cursor: isInactive ? 'not-allowed' : 'pointer',
                                        transition: 'background 0.15s',
                                        background: isInactive ? '#fef2f2' : (selectedStudents.includes(id) ? '#f1f5f9' : 'transparent'),
                                        opacity: isInactive ? 0.65 : 1,
                                      }}
                                      onMouseEnter={e => {
                                        if (!isInactive && !selectedStudents.includes(id)) {
                                          e.currentTarget.style.background = '#f1f5f9';
                                        }
                                      }}
                                      onMouseLeave={e => {
                                        if (!isInactive && !selectedStudents.includes(id)) {
                                          e.currentTarget.style.background = 'transparent';
                                        }
                                      }}
                                    >
                                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isInactive ? '#fee2e2' : '#e0e7ff', color: isInactive ? '#991b1b' : '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                                        {initials}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: isInactive ? '#9ca3af' : '#0f172a', textDecoration: isInactive ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          {s.name || 'Unnamed Student'}
                                          {getStudentGroupName(id) && (
                                            <span style={{ fontSize: '11px', fontWeight: 500, color: '#4f46e5', background: '#e0e7ff', padding: '1px 6px', borderRadius: '4px' }}>
                                              {getStudentGroupName(id)}
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{s.internId || s.email || id}</div>
                                      </div>
                                      {isInactive ? (
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>INACTIVE</span>
                                      ) : (
                                        <input
                                          type="checkbox"
                                          checked={selectedStudents.includes(id)}
                                          onChange={() => toggleStudent(id)}
                                          style={{ cursor: 'pointer' }}
                                        />
                                      )}
                                    </div>
                                  );
                                });
                            })()}
                            {(function() {
                              let studentsList = [];
                              if (activeGdGroupIds && activeGdGroupIds.length > 0) {
                                activeGdGroupIds.forEach(gId => {
                                  const found = groups.find(g => String(g._id || g.id || g.groupNumber || g.groupName) === String(gId));
                                  if (found) {
                                    studentsList.push(...getGroupMemberList(found));
                                  }
                                });
                                const seen = new Set();
                                studentsList = studentsList.filter(s => {
                                  const sid = getGroupMemberId(s);
                                  if (seen.has(sid)) return false;
                                  seen.add(sid);
                                  return true;
                                });
                              } else {
                                studentsList = students;
                              }
                              const filteredCount = studentsList.filter(s =>
                                !gdDropdownSearchText ||
                                s.name?.toLowerCase().includes(gdDropdownSearchText.toLowerCase()) ||
                                s.internId?.toLowerCase().includes(gdDropdownSearchText.toLowerCase()) ||
                                s.email?.toLowerCase().includes(gdDropdownSearchText.toLowerCase())
                              ).length;
                              if (filteredCount === 0) {
                                return <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No students found</div>;
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="am-preview-panel">
              <div className="am-panel-head">
                <h4>Preview Assignments</h4>
                <p>Review assigned students before confirming.</p>
              </div>

              {selectedStudents.length > 0 ? (
                <div className="am-table-shell">
                  <div className="am-table-wrapper-scroll">
                    <table className="records-table am-records-table am-slot-table records-slot-table">
                      <thead>
                        <tr>
                          <th>Slot</th>
                          <th>Student</th>
                          <th>PSMS ID</th>
                          <th>Interviewer</th>
                          <th>Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudents.map((id, idx) => {
                          const s = students.find(st => String(st._id) === String(id) || String(st.id) === String(id) || st.internId === id || st.email === id || st.name === id);
                          return {
                            slotNo: idx + 1,
                            time: gdForm.startTime || '',
                            studentName: s ? s.name : id,
                            psmsId: s ? (s.internId || s.email) : id,
                            interviewer: getTrainerLabel(gdForm.interviewer),
                            dateCell: gdForm.date ? `${gdForm.date} ${gdForm.startTime || ''}` : '-',
                          };
                        }).map((row) => (
                          <tr key={row.studentId || row.slotNo}>
                            <td>{row.slotNo}</td>
                            <td>{row.studentName}</td>
                            <td>{row.psmsId}</td>
                            <td>{row.interviewer}</td>
                            <td className="date-cell">{row.time ? `${gdForm.date || ''} ${row.time}`.trim() : (row.dateCell || '-')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="am-actions-row am-actions-right">
                    <button className="nm-btn" onClick={() => { setShowGDModal(false); setEditingGdActivityId(null); setSelectedStudents([]); setActiveGdGroupIds([]); setGdGroups([]); }}>Close</button>
                    <button className="nm-btn primary am-confirm-btn" onClick={saveGd}>Confirm & Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="am-empty">No students selected for this GD</div>
                  <div className="am-actions-row am-actions-right">
                    <button className="nm-btn" onClick={() => { setShowGDModal(false); setEditingGdActivityId(null); setSelectedStudents([]); setActiveGdGroupIds([]); setGdGroups([]); }}>Close</button>
                  </div>
                </>
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
                onClick={() => { setShowAssessmentModal(false); setEditingAssessActivityId(null); setActiveAssessGroupIds([]); setGeneratedSlots([]); }}
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

                  <div className="am-field">
                    <label>Mode</label>
                    <select value={assessForm.mode || 'Individual'} onChange={e => handleAssessModeChange(e.target.value)}>
                      <option>Individual</option>
                      <option>Group</option>
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
                    <h4>{assessForm.mode === 'Group' ? 'Select Group & Members' : 'Assign Students'}</h4>
                    <p>{assessForm.mode === 'Group' ? 'Pick a group to expand, then choose the members you want to include.' : 'Choose who should receive this assessment invite.'}</p>
                  </div>
                  {inactiveWarning && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
                      <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>{inactiveWarning}</span>
                      <button type="button" onClick={() => setInactiveWarning('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>×</button>
                    </div>
                  )}
                  {assessForm.mode === 'Group' ? (
                    <div className="am-field">
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        Select Groups
                      </label>
                      <div className="am-group-list" style={{ display: 'block', maxHeight: '240px', overflowY: 'auto', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '12px', background: '#f8fafc', boxSizing: 'border-box' }}>
                        {groups.length === 0 ? (
                          <div className="am-empty" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No groups found</div>
                        ) : (
                          groups.map((group) => {
                            const groupId = String(group._id || group.id || group.groupNumber || group.groupName);
                            const memberList = getGroupMemberList(group);
                            const isActive = activeAssessGroupIds.includes(groupId);
                            const isDropdownOpen = openGroupDropdownId === `assess_${groupId}`;
                            return (
                              <div key={groupId} className={`am-group-card ${isActive ? 'active' : ''}`} style={{ marginBottom: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '10px 14px',
                                    background: isActive ? '#f1f5f9' : 'transparent',
                                    borderBottom: isActive ? '1px solid #e2e8f0' : 'none',
                                    gap: '10px',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={() => handleAssessGroupToggle(group)}
                                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                  />
                                  <div
                                    onClick={() => handleAssessGroupToggle(group)}
                                    style={{ cursor: 'pointer', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', minWidth: 0 }}
                                  >
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getGroupLabel(group)}</strong>
                                      <span style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' }}>{group.groupNumber ? `Group #${group.groupNumber}` : ''}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }}>{memberList.length} members</div>
                                  </div>
                                  {isActive && (
                                    <button
                                      type="button"
                                      onClick={() => setOpenGroupDropdownId(isDropdownOpen ? '' : `assess_${groupId}`)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#4f46e5',
                                        fontSize: '11px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontWeight: 600
                                      }}
                                    >
                                      Members
                                      <span style={{ fontSize: '9px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                                    </button>
                                  )}
                                </div>

                                {isActive && isDropdownOpen && (
                                  <div className="am-group-members-panel" style={{ borderTop: '1px solid #e2e8f0', padding: '10px 12px', background: '#fafafa' }}>
                                    <div className="am-group-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                      <label className="am-group-toggle-all" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                                        <input
                                          type="checkbox"
                                          checked={memberList.length > 0 && memberList.every((member) => assessSelected.includes(getGroupMemberId(member)))}
                                          onChange={(event) => {
                                            const memberIds = memberList.map((member) => getGroupMemberId(member));
                                            if (event.target.checked) {
                                              const activeMemberIds = [];
                                              let inactiveCount = 0;
                                              memberList.forEach(m => {
                                                const mid = getGroupMemberId(m);
                                                const fullStudent = students.find(s => String(s._id || s.id) === mid);
                                                const isInactive = fullStudent ? String(fullStudent.status || '').toLowerCase() === 'inactive' : (String(m.status || '').toLowerCase() === 'inactive');
                                                if (isInactive) inactiveCount++;
                                                else activeMemberIds.push(mid);
                                              });
                                              setAssessSelected(prev => {
                                                const toAdd = activeMemberIds.filter(id => !prev.includes(id));
                                                return [...prev, ...toAdd];
                                              });
                                              if (inactiveCount > 0) {
                                                setInactiveWarning(`${inactiveCount} inactive student(s) from this group were automatically excluded from selection.`);
                                              } else {
                                                setInactiveWarning('');
                                              }
                                            } else {
                                              setAssessSelected(prev => prev.filter(id => !memberIds.includes(id)));
                                              setInactiveWarning('');
                                            }
                                          }}
                                        />
                                        Select full group
                                      </label>
                                    </div>
                                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                      {memberList.map((member) => {
                                        const memberId = getGroupMemberId(member);
                                        const fullStudent = students.find(s => String(s._id || s.id) === memberId);
                                        const isInactive = fullStudent ? String(fullStudent.status || '').toLowerCase() === 'inactive' : (String(member.status || '').toLowerCase() === 'inactive');
                                        const initials = (member.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                        return (
                                          <div
                                            key={memberId}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '10px',
                                              padding: '8px 10px',
                                              borderBottom: '1px solid #f1f5f9',
                                              cursor: isInactive ? 'not-allowed' : 'pointer',
                                              background: isInactive ? '#fef2f2' : (assessSelected.includes(memberId) ? '#f8fafc' : 'transparent'),
                                              opacity: isInactive ? 0.65 : 1,
                                            }}
                                            onClick={() => { if (!isInactive) toggleStudent(memberId, setAssessSelected); }}
                                          >
                                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isInactive ? '#fee2e2' : '#e0e7ff', color: isInactive ? '#991b1b' : '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                                              {initials}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontSize: '12px', fontWeight: 600, color: isInactive ? '#9ca3af' : '#0f172a', textDecoration: isInactive ? 'line-through' : 'none' }}>
                                                {member.name || 'Unnamed Student'}
                                              </div>
                                            </div>
                                            {isInactive ? (
                                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '1px 4px', borderRadius: '4px' }}>INACTIVE</span>
                                            ) : (
                                              <input
                                                type="checkbox"
                                                checked={assessSelected.includes(memberId)}
                                                onChange={() => toggleStudent(memberId, setAssessSelected)}
                                                style={{ cursor: 'pointer' }}
                                              />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <div data-assess-dropdown style={{ position: 'relative' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#0f172a'
                        }}
                      >
                        Search & Select Students
                      </label>
                      <div style={{ position: 'relative' }} data-assess-dropdown>
                        <div
                          data-assess-dropdown
                          onClick={() => setIsAssessDropdownOpen(!isAssessDropdownOpen)}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: `2px solid ${isAssessDropdownOpen ? '#3b82f6' : '#cbd5e1'}`,
                            borderRadius: '10px',
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s',
                            color: assessSelected.length > 0 ? '#0f172a' : '#94a3b8',
                            userSelect: 'none',
                          }}
                        >
                          <span>{assessSelected.length > 0 ? `${assessSelected.length} student(s) selected` : 'Search & select students...'}</span>
                          <span style={{ fontSize: '11px', transition: 'transform 0.2s', transform: isAssessDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                        </div>
                        {isAssessDropdownOpen && (
                          <div
                            data-assess-dropdown
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              marginTop: '6px',
                              background: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                              zIndex: 99999,
                              overflow: 'hidden',
                            }}
                          >
                            <div style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                              <input
                                autoFocus
                                type="text"
                                value={assessDropdownSearchText}
                                onChange={(e) => setAssessDropdownSearchText(e.target.value)}
                                placeholder="Type to search by name, ID, email..."
                                style={{
                                  width: '100%',
                                  padding: '9px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  fontSize: '13px',
                                  background: '#f8fafc',
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                            {assessDropdownSearchText && (
                              <div
                                data-assess-dropdown
                                onClick={() => { setAssessDropdownSearchText(''); }}
                                style={{ padding: '10px 14px', fontSize: '13px', color: '#dc2626', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}
                              >
                                ✕ Clear search
                              </div>
                            )}
                            {assessSelected.length > 0 && (
                              <div
                                data-assess-dropdown
                                onClick={() => { setAssessSelected([]); }}
                                style={{ padding: '10px 14px', fontSize: '13px', color: '#dc2626', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}
                              >
                                ✕ Clear all selections
                              </div>
                            )}
                            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                              {(function() {
                                let studentsList = [];
                                if (activeAssessGroupIds && activeAssessGroupIds.length > 0) {
                                  activeAssessGroupIds.forEach(gId => {
                                    const found = groups.find(g => String(g._id || g.id || g.groupNumber || g.groupName) === String(gId));
                                    if (found) {
                                      studentsList.push(...getGroupMemberList(found));
                                    }
                                  });
                                  const seen = new Set();
                                  studentsList = studentsList.filter(s => {
                                    const sid = getGroupMemberId(s);
                                    if (seen.has(sid)) return false;
                                    seen.add(sid);
                                    return true;
                                  });
                                } else {
                                  studentsList = students;
                                }
                                return studentsList
                                  .filter(s =>
                                    !assessDropdownSearchText ||
                                    s.name?.toLowerCase().includes(assessDropdownSearchText.toLowerCase()) ||
                                    s.internId?.toLowerCase().includes(assessDropdownSearchText.toLowerCase()) ||
                                    s.email?.toLowerCase().includes(assessDropdownSearchText.toLowerCase())
                                  )
                                  .slice(0, 50)
                                  .map((s) => {
                                    const id = activeAssessGroupIds.length > 0 ? getGroupMemberId(s) : String(s._id || s.id);
                                    const fullStudent = students.find(st => String(st._id || st.id) === id);
                                    const isInactive = fullStudent ? String(fullStudent.status || '').toLowerCase() === 'inactive' : (String(s.status || '').toLowerCase() === 'inactive');
                                    const initials = (s.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                    return (
                                      <div
                                        key={id}
                                        data-assess-dropdown
                                        onClick={(e) => { e.stopPropagation(); if (!isInactive) toggleStudent(id, setAssessSelected); }}
                                        title={isInactive ? 'This student is inactive and cannot be selected' : ''}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '10px',
                                          padding: '10px 14px',
                                          borderBottom: '1px solid #f8fafc',
                                          cursor: isInactive ? 'not-allowed' : 'pointer',
                                          transition: 'background 0.15s',
                                          background: isInactive ? '#fef2f2' : (assessSelected.includes(id) ? '#f1f5f9' : 'transparent'),
                                          opacity: isInactive ? 0.65 : 1,
                                        }}
                                        onMouseEnter={e => {
                                          if (!isInactive && !assessSelected.includes(id)) {
                                            e.currentTarget.style.background = '#f1f5f9';
                                          }
                                        }}
                                        onMouseLeave={e => {
                                          if (!isInactive && !assessSelected.includes(id)) {
                                            e.currentTarget.style.background = 'transparent';
                                          }
                                        }}
                                      >
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isInactive ? '#fee2e2' : '#e0e7ff', color: isInactive ? '#991b1b' : '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                                          {initials}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: '13px', fontWeight: 600, color: isInactive ? '#9ca3af' : '#0f172a', textDecoration: isInactive ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {s.name || 'Unnamed Student'}
                                            {getStudentGroupName(id) && (
                                              <span style={{ fontSize: '11px', fontWeight: 500, color: '#4f46e5', background: '#e0e7ff', padding: '1px 6px', borderRadius: '4px' }}>
                                                {getStudentGroupName(id)}
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ fontSize: '12px', color: '#64748b' }}>{s.internId || s.email || id}</div>
                                        </div>
                                        {isInactive ? (
                                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>INACTIVE</span>
                                        ) : (
                                          <input
                                            type="checkbox"
                                            checked={assessSelected.includes(id)}
                                            onChange={() => toggleStudent(id, setAssessSelected)}
                                            style={{ cursor: 'pointer' }}
                                          />
                                        )}
                                      </div>
                                    );
                                  });
                              })()}
                              {(function() {
                                let studentsList = [];
                                if (activeAssessGroupIds && activeAssessGroupIds.length > 0) {
                                  activeAssessGroupIds.forEach(gId => {
                                    const found = groups.find(g => String(g._id || g.id || g.groupNumber || g.groupName) === String(gId));
                                    if (found) {
                                      studentsList.push(...getGroupMemberList(found));
                                    }
                                  });
                                  const seen = new Set();
                                  studentsList = studentsList.filter(s => {
                                    const sid = getGroupMemberId(s);
                                    if (seen.has(sid)) return false;
                                    seen.add(sid);
                                    return true;
                                  });
                                } else {
                                  studentsList = students;
                                }
                                const filteredCount = studentsList.filter(s =>
                                  !assessDropdownSearchText ||
                                  s.name?.toLowerCase().includes(assessDropdownSearchText.toLowerCase()) ||
                                  s.internId?.toLowerCase().includes(assessDropdownSearchText.toLowerCase()) ||
                                  s.email?.toLowerCase().includes(assessDropdownSearchText.toLowerCase())
                                ).length;
                                if (filteredCount === 0) {
                                  return <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No students found</div>;
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
