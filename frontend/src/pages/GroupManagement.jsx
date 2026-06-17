import { useEffect, useMemo, useState } from "react";
import { adminAPI, adminRepAPI } from "../services/api";

const defaultForm = {
  id: "",
  groupNumber: "",
  groupName: "",
  groupDescription: "",
  studentType: "All",
  selectedStudents: [],
  assignedEmployeesText: "",
};

function GroupManagement() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailsGroup, setDetailsGroup] = useState(null);
  const [activeGroupMenuId, setActiveGroupMenuId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupRes, studentRes] = await Promise.all([
        adminRepAPI.getGroups(),
        adminAPI.getAllInterns(),
      ]);
      if (groupRes.data.success) setGroups(groupRes.data.groups || []);
      if (studentRes.data.success) setStudents(studentRes.data.interns || []);
    } catch (err) {
      console.error("Group load error", err);
      setError("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!activeGroupMenuId) return;

    const closeMenu = () => setActiveGroupMenuId(null);
    document.addEventListener("click", closeMenu);

    return () => {
      document.removeEventListener("click", closeMenu);
    };
  }, [activeGroupMenuId]);

  const filteredStudents = useMemo(() => {
    if (form.studentType === "All") return students;
    return students.filter((item) => item.studentType === form.studentType);
  }, [students, form.studentType]);

  const visibleStudents = useMemo(() => {
    const query = studentSearchQuery.trim().toLowerCase();
    if (!query) return filteredStudents;
    const matches = (value) =>
      String(value || "")
        .toLowerCase()
        .includes(query);

    return filteredStudents.filter((item) => {
      return (
        matches(item.name) ||
        matches(item.email) ||
        matches(item.internId) ||
        matches(item.studentId) ||
        matches(item.mobile) ||
        matches(item.studentType)
      );
    });
  }, [filteredStudents, studentSearchQuery]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleStudentSelection = (id) => {
    setForm((prev) => {
      const exists = prev.selectedStudents.includes(id);
      return {
        ...prev,
        selectedStudents: exists
          ? prev.selectedStudents.filter((item) => item !== id)
          : [...prev.selectedStudents, id],
      };
    });
  };

  const parseAssignedEmployees = (text) =>
    text
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.groupNumber.trim() || !form.groupName.trim()) {
      setError("Group number and group name are required");
      return;
    }

    const payload = {
      groupNumber: form.groupNumber.trim(),
      groupName: form.groupName.trim(),
      groupDescription: form.groupDescription,
      studentType: form.studentType,
      students: form.selectedStudents,
      assignedEmployees: parseAssignedEmployees(form.assignedEmployeesText),
    };

    try {
      setSaving(true);
      if (form.id) {
        await adminRepAPI.updateGroup(form.id, payload);
      } else {
        await adminRepAPI.createGroup(payload);
      }
      setSuccess(form.id ? "Group updated" : "Group created");
      setForm(defaultForm);
      loadData();
    } catch (err) {
      console.error("Group save error", err);
      setError(err.response?.data?.message || "Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  const editGroup = (group) => {
    setForm({
      id: group._id,
      groupNumber: group.groupNumber || "",
      groupName: group.groupName || "",
      groupDescription: group.groupDescription || "",
      studentType: group.studentType || "All",
      selectedStudents: (group.students || []).map((item) => item._id || item),
      assignedEmployeesText: (group.assignedEmployees || []).join(", "),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDetails = async (groupId) => {
    try {
      const response = await adminRepAPI.getGroupDetails(groupId);
      if (response.data.success) {
        setDetailsGroup(response.data.group);
      }
    } catch (err) {
      console.error("Group details error", err);
      setError("Failed to fetch group details");
    }
  };

  const removeGroup = async (groupId) => {
    if (!window.confirm("Delete this group?")) return;
    try {
      await adminRepAPI.deleteGroup(groupId);
      setSuccess("Group deleted");
      setDetailsGroup((prev) => (prev && prev._id === groupId ? null : prev));
      setActiveGroupMenuId((prev) => (prev === groupId ? null : prev));
      loadData();
    } catch (err) {
      console.error("Delete group error", err);
      setError("Failed to delete group");
    }
  };

  const selectAllFilteredStudents = () => {
    setForm((prev) => ({
      ...prev,
      selectedStudents: [
        ...new Set([
          ...prev.selectedStudents,
          ...visibleStudents.map((item) => item._id),
        ]),
      ],
    }));
  };

  const clearSelectedStudents = () => {
    setForm((prev) => ({
      ...prev,
      selectedStudents: [],
    }));
  };

  const formatAssignedEmployees = (group) => {
    const assignedEmployees = group.assignedEmployees || [];
    if (assignedEmployees.length === 0) return "-";
    if (assignedEmployees.length <= 2) return assignedEmployees.join(", ");
    return `${assignedEmployees.slice(0, 2).join(", ")} +${assignedEmployees.length - 2}`;
  };

  return (
    <div className="gm-page">
      <div className="gm-header">
        <div>
          <h1>Group Management</h1>
          <p>Create, edit, and maintain group assignments with structured student selection.</p>
        </div>
        <div className="gm-header-stats">
          <div className="gm-stat-pill">
            <span>Total Groups</span>
            <strong>{groups.length}</strong>
          </div>
          <div className="gm-stat-pill">
            <span>Students Pool</span>
            <strong>{filteredStudents.length}</strong>
          </div>
        </div>
      </div>

      {success && <div className="gm-alert gm-alert-success">{success}</div>}
      {error && <div className="gm-alert gm-alert-error">{error}</div>}

      <div className="gm-card">
        <div className="gm-card-header">
          <h2>{form.id ? "Edit Group" : "Create Group"}</h2>
          {form.id && <span className="gm-edit-chip">Editing Existing Group</span>}
        </div>
        <form onSubmit={handleSubmit} className="gm-form-wrap">
          <div className="gm-grid-3">
            <div className="form-group"><label>Group Number *</label><input name="groupNumber" value={form.groupNumber} onChange={handleInput} required /></div>
            <div className="form-group"><label>Group Name *</label><input name="groupName" value={form.groupName} onChange={handleInput} required /></div>
            <div className="form-group"><label>Select Student Type</label>
              <select name="studentType" value={form.studentType} onChange={handleInput}>
                <option value="All">All</option>
                <option value="Internship">Internship</option>
                <option value="SMS Program">SMS Program</option>
              </select>
            </div>
            <div className="form-group gm-span-all">
              <label>Group Description</label>
              <textarea name="groupDescription" value={form.groupDescription} onChange={handleInput} rows={2} />
            </div>
            <div className="form-group gm-span-all">
              <label>Group Assigned (Employee Names, comma-separated)</label>
              <input
                name="assignedEmployeesText"
                value={form.assignedEmployeesText}
                onChange={handleInput}
                placeholder="e.g. Ananya Singh, Rahul Verma"
              />
            </div>
            <div className="form-group gm-span-all">
              <div className="gm-students-head">
                <label>Select Students ({form.selectedStudents.length} selected)</label>
                <div className="gm-head-actions">
                  <button type="button" className="gm-link-btn" onClick={selectAllFilteredStudents}>Select All Shown</button>
                  <button type="button" className="gm-link-btn" onClick={clearSelectedStudents}>Clear</button>
                </div>
              </div>
              <button
                type="button"
                className="gm-students-trigger"
                onClick={() => setIsStudentDropdownOpen((prev) => !prev)}
                aria-expanded={isStudentDropdownOpen}
              >
                <span>
                  {form.selectedStudents.length > 0
                    ? `${form.selectedStudents.length} students selected`
                    : "Select students"}
                </span>
                <span className={`gm-trigger-arrow ${isStudentDropdownOpen ? "is-open" : ""}`}>▾</span>
              </button>

              {isStudentDropdownOpen && (
                <div className="gm-students-dropdown">
                  <input
                    type="text"
                    className="gm-student-search"
                    placeholder="Search by name, email, ID, or type..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                  />
                  <div className="gm-students-box">
                    {visibleStudents.length === 0 ? (
                      <div className="gm-empty-inline">No students found for selected filters</div>
                    ) : (
                      visibleStudents.map((student) => {
                        const selected = form.selectedStudents.includes(student._id);
                        return (
                          <label
                            key={student._id}
                            className={`gm-student-check-row ${selected ? "is-selected" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleStudentSelection(student._id)}
                            />
                            <span className="gm-student-content">
                              <strong>{student.name}</strong>
                              <small>{student.email} • {student.internId}</small>
                              <span className="gm-type-chip">{student.studentType}</span>
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="gm-actions">
            <button type="submit" className="gm-btn gm-btn-primary" disabled={saving}>
              {saving ? "Saving..." : form.id ? "Update Group" : "Create Group"}
            </button>
            <button type="button" className="gm-btn gm-btn-muted" onClick={() => setForm(defaultForm)}>
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="gm-card">
        <div className="gm-card-header">
          <h2>Existing Groups</h2>
        </div>
        {loading ? (
          <div className="gm-loading">Loading groups...</div>
        ) : (
          <div className="gm-group-list gm-group-table">
            {groups.length === 0 ? (
              <div className="gm-empty-inline" style={{ textAlign: "center" }}>
                No groups created
              </div>
            ) : (
              <>
                <div className="gm-group-header-row">
                  <span>Group</span>
                  <span>Group No</span>
                  <span>Type</span>
                  <span>Students</span>
                  <span>Assigned Employees</span>
                  <span>Action</span>
                </div>
                {groups.map((group) => (
                  <div key={group._id} className="gm-group-row gm-group-data-row">
                    <div className="gm-group-col gm-group-col-name" title={group.groupName}>
                      <strong>{group.groupName}</strong>
                    </div>
                    <div className="gm-group-col" title={group.groupNumber || "-"}>
                      {group.groupNumber || "-"}
                    </div>
                    <div className="gm-group-col">
                      <span className="gm-type-chip">{group.studentType}</span>
                    </div>
                    <div className="gm-group-col">{(group.students || []).length}</div>
                    <div
                      className="gm-group-col gm-group-col-employees"
                      title={(group.assignedEmployees || []).join(", ") || "-"}
                    >
                      {formatAssignedEmployees(group)}
                    </div>
                    <div className="gm-group-col gm-group-action">
                      <button
                        className="gm-menu-trigger"
                        type="button"
                        aria-label={`Open actions for ${group.groupName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGroupMenuId((prev) => (prev === group._id ? null : group._id))
                        }}
                      >
                        ⋯
                      </button>
                      {activeGroupMenuId === group._id && (
                        <div className="gm-action-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="gm-action-menu-item"
                            onClick={() => {
                              setActiveGroupMenuId(null);
                              openDetails(group._id);
                            }}
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            className="gm-action-menu-item"
                            onClick={() => {
                              setActiveGroupMenuId(null);
                              editGroup(group);
                            }}
                          >
                            Edit Group
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {detailsGroup && (
        <div className="gm-modal-backdrop" onClick={() => setDetailsGroup(null)}>
          <div className="gm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gm-modal-head">
              <h2>{detailsGroup.groupName}</h2>
              <div className="gm-row-actions">
                <button
                  className="gm-btn gm-btn-primary"
                  onClick={() => {
                    setDetailsGroup(null);
                    editGroup(detailsGroup);
                  }}
                >
                  Edit Group
                </button>
                <button
                  className="gm-btn gm-btn-primary"
                  onClick={() => removeGroup(detailsGroup._id)}
                >
                  Delete Group
                </button>
                <button className="gm-btn gm-btn-muted" onClick={() => setDetailsGroup(null)}>Close</button>
              </div>
            </div>
            <div className="gm-modal-body">
              <p><strong>Group Number:</strong> {detailsGroup.groupNumber}</p>
              <p><strong>Group Name:</strong> {detailsGroup.groupName}</p>
              <p><strong>Description:</strong> {detailsGroup.groupDescription || "-"}</p>
              <p><strong>Student Type:</strong> {detailsGroup.studentType}</p>
              <p><strong>Total Students:</strong> {(detailsGroup.students || []).length}</p>
              <p><strong>Assigned Employees:</strong> {(detailsGroup.assignedEmployees || []).join(", ") || "-"}</p>

              <h3 style={{ marginTop: "14px" }}>Student Details</h3>
              <div className="gm-table-wrap">
                <table className="premium-table group-students-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Intern ID</th>
                      <th>Type</th>
                      <th>Email</th>
                      <th>Mobile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailsGroup.students || []).length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: "center" }}>No students in group</td></tr>
                    ) : (
                      detailsGroup.students.map((student) => (
                        <tr key={student._id}>
                          <td>{student.name}</td>
                          <td>{student.internId}</td>
                          <td>{student.studentType}</td>
                          <td>{student.email}</td>
                          <td>{student.mobile || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupManagement;
