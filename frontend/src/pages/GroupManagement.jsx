import { useEffect, useMemo, useState } from "react";
import { adminAPI, adminRepAPI } from "../services/api";

const defaultForm = {
  id: "",
  groupNumber: "",
  groupName: "",
  groupDescription: "",
  studentType: "All",
  selectedStudents: [],
  selectedEmployees: [],
};

function GroupManagement() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailsGroup, setDetailsGroup] = useState(null);
  const [activeGroupMenuId, setActiveGroupMenuId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupRes, studentRes, employeeRes] = await Promise.all([
        adminRepAPI.getGroups(),
        adminAPI.getAllInterns(),
        adminAPI.getAllTrainers(),
      ]);
      if (groupRes.data.success) setGroups(groupRes.data.groups || []);
      if (studentRes.data.success) setStudents(studentRes.data.interns || []);
      if (employeeRes.data.success) setEmployees(employeeRes.data.trainers || []);
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

  const employeeOptions = useMemo(() => {
    const uniqueByName = new Map();

    (employees || []).forEach((employee) => {
      const name = String(employee?.name || "").trim();
      if (!name) return;
      if (!uniqueByName.has(name)) {
        uniqueByName.set(name, {
          name,
          email: employee?.email || "",
          role: employee?.role || employee?.customRole || "Employee",
        });
      }
    });

    return Array.from(uniqueByName.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [employees]);

  const visibleEmployees = useMemo(() => {
    const query = employeeSearchQuery.trim().toLowerCase();
    if (!query) return employeeOptions;

    const matches = (value) =>
      String(value || "")
        .toLowerCase()
        .includes(query);

    return employeeOptions.filter((item) => {
      return matches(item.name) || matches(item.email) || matches(item.role);
    });
  }, [employeeOptions, employeeSearchQuery]);

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

  const toggleEmployeeSelection = (employeeName) => {
    setForm((prev) => {
      const exists = prev.selectedEmployees.includes(employeeName);
      return {
        ...prev,
        selectedEmployees: exists
          ? prev.selectedEmployees.filter((item) => item !== employeeName)
          : [...prev.selectedEmployees, employeeName],
      };
    });
  };

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
      assignedEmployees: form.selectedEmployees,
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
      setIsStudentDropdownOpen(false);
      setIsEmployeeDropdownOpen(false);
      setStudentSearchQuery("");
      setEmployeeSearchQuery("");
      setIsFormOpen(false);
      await loadData();
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
      selectedEmployees: group.assignedEmployees || [],
    });
    setIsFormOpen(true);
    setIsStudentDropdownOpen(false);
    setIsEmployeeDropdownOpen(false);
    setEmployeeSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCreateForm = () => {
    setForm(defaultForm);
    setError("");
    setSuccess("");
    setStudentSearchQuery("");
    setEmployeeSearchQuery("");
    setIsStudentDropdownOpen(false);
    setIsEmployeeDropdownOpen(false);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setForm(defaultForm);
    setStudentSearchQuery("");
    setEmployeeSearchQuery("");
    setIsStudentDropdownOpen(false);
    setIsEmployeeDropdownOpen(false);
    setIsFormOpen(false);
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

  const renderDescriptionWithLinks = (text) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="gm-details-link"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="gm-page">
      <div className="gm-header">
        <div>
          <h1>Group Management</h1>
          <p>Create, edit, and maintain group assignments with structured student selection.</p>
        </div>
        <div className="gm-header-actions">
          <div className="gm-header-stats">
            <div className="gm-stat-pill">
              <span>Total Groups</span>
              <strong>{groups.length}</strong>
            </div>
          </div>
          {!isFormOpen && (
            <button
              type="button"
              className="gm-btn gm-btn-primary gm-create-btn"
              onClick={openCreateForm}
            >
              Create Group
            </button>
          )}
        </div>
      </div>

      {success && <div className="gm-alert gm-alert-success">{success}</div>}
      {error && <div className="gm-alert gm-alert-error">{error}</div>}

      {isFormOpen && (
        <div className="gm-card">
          <div className="gm-card-header">
            <h2>{form.id ? "Edit Group" : "Create Group"}</h2>
            <div className="gm-row-actions">
              {form.id && <span className="gm-edit-chip">Editing Existing Group</span>}
              <button type="button" className="gm-btn gm-btn-primary" onClick={closeForm}>
                Back to Groups
              </button>
            </div>
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
                <label>Group Assigned Employees ({form.selectedEmployees.length} selected)</label>
                <button
                  type="button"
                  className="gm-students-trigger"
                  onClick={() => setIsEmployeeDropdownOpen((prev) => !prev)}
                  aria-expanded={isEmployeeDropdownOpen}
                >
                  <span>
                    {form.selectedEmployees.length > 0
                      ? `${form.selectedEmployees.length} employees selected`
                      : "Select employees"}
                  </span>
                  <span className={`gm-trigger-arrow ${isEmployeeDropdownOpen ? "is-open" : ""}`}>▾</span>
                </button>

                {isEmployeeDropdownOpen && (
                  <div className="gm-students-dropdown">
                    <input
                      type="text"
                      className="gm-student-search"
                      placeholder="Search by employee name, email, or role..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    />
                    <div className="gm-students-box">
                      {visibleEmployees.length === 0 ? (
                        <div className="gm-empty-inline">No employees found</div>
                      ) : (
                        visibleEmployees.map((employee) => {
                          const selected = form.selectedEmployees.includes(employee.name);
                          return (
                            <button
                              key={employee.name}
                              type="button"
                              className={`gm-student-check-row ${selected ? "is-selected" : ""}`}
                              onClick={() => toggleEmployeeSelection(employee.name)}
                              style={{
                                width: "100%",
                                border: "1px solid #dbe4ef",
                                borderRadius: "10px",
                                cursor: "pointer",
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "12px 16px",
                                background: selected ? "#f0fdf4" : "transparent",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {}}
                                style={{ pointerEvents: 'none', width: '18px', height: '18px' }}
                              />
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  display: "grid",
                                  placeItems: "center",
                                  backgroundColor: selected ? "#dbeafe" : "#f1f5f9",
                                  color: selected ? "#2563eb" : "#475569",
                                  fontWeight: 700,
                                  fontSize: "12px",
                                  flexShrink: 0,
                                }}
                              >
                                {employee.name
                                  ?.split(" ")
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((part) => part[0]?.toUpperCase())
                                  .join("") || "E"}
                              </div>
                              <span className="gm-student-content" style={{ flex: 1 }}>
                                <span style={{ display: 'block', fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{employee.name}</span>
                                <small style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  {employee.role || "Employee"} • {employee.email || "No email"}
                                </small>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
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
                            <button
                              key={student._id}
                              type="button"
                              className={`gm-student-check-row ${selected ? "is-selected" : ""}`}
                              onClick={() => toggleStudentSelection(student._id)}
                              style={{
                                width: "100%",
                                border: "1px solid #dbe4ef",
                                borderRadius: "10px",
                                cursor: "pointer",
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "12px 16px",
                                background: selected ? "#f0fdf4" : "transparent",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {}}
                                style={{ pointerEvents: 'none', width: '18px', height: '18px' }}
                              />
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  display: "grid",
                                  placeItems: "center",
                                  backgroundColor: selected ? "#dbeafe" : "#f1f5f9",
                                  color: selected ? "#2563eb" : "#475569",
                                  fontWeight: 700,
                                  fontSize: "12px",
                                  flexShrink: 0,
                                }}
                              >
                                {student.name
                                  ?.split(" ")
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((part) => part[0]?.toUpperCase())
                                  .join("") || "S"}
                              </div>
                              <span className="gm-student-content" style={{ flex: 1 }}>
                                <span style={{ display: 'block', fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{student.name}</span>
                                <small style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  {student.internId || student.studentId || "No ID"} • {student.email}
                                </small>
                                <span className="gm-type-chip">{student.studentType}</span>
                              </span>
                            </button>
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
              <button type="button" className="gm-btn gm-btn-muted" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="gm-card gm-groups-card">
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
                          <button
                            type="button"
                            className="gm-action-menu-item"
                            onClick={() => {
                              setActiveGroupMenuId(null);
                              removeGroup(group._id);
                            }}
                          >
                            Delete Group
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
            <div className="gm-details-hero">
              <div className="gm-details-hero-top">
                <div className="gm-details-title-area">
                  <span className="gm-details-badge">Group Overview</span>
                  <h2 className="gm-details-title">{detailsGroup.groupName || "-"}</h2>
                  <p className="gm-details-subtitle">
                    A structured summary of the group, assigned team members, and student intake.
                  </p>
                </div>
                <button className="gm-details-close-btn" onClick={() => setDetailsGroup(null)}>
                  Close
                </button>
              </div>

              <div className="gm-details-summary-row">
                <div className="gm-details-summary-item">
                  <span className="gm-details-side-label">Group Number</span>
                  <span className="gm-details-side-value">{detailsGroup.groupNumber || "-"}</span>
                </div>
                <div className="gm-details-summary-item">
                  <span className="gm-details-side-label">Student Type</span>
                  <span className="gm-details-side-value">{detailsGroup.studentType || "-"}</span>
                </div>
                <div className="gm-details-summary-item">
                  <span className="gm-details-side-label">Students</span>
                  <span className="gm-details-side-value">{(detailsGroup.students || []).length}</span>
                </div>
              </div>

              {detailsGroup.groupDescription && (
                <div className="gm-details-desc-area">
                  <span className="gm-details-card-kicker">Description</span>
                  <p className="gm-details-desc">{renderDescriptionWithLinks(detailsGroup.groupDescription)}</p>
                </div>
              )}

              <div className="gm-details-employee-strip">
                <div className="gm-details-card-head">
                  <span className="gm-details-card-kicker">Assigned Employees</span>
                  <span className="gm-details-inline-count">
                    {(detailsGroup.assignedEmployees || []).length}
                  </span>
                </div>
                <div className="gm-details-employees-list">
                  {(detailsGroup.assignedEmployees || []).length > 0 ? (
                    (detailsGroup.assignedEmployees || []).map((emp, i) => (
                      <span key={i} className="gm-details-employee-pill">
                        {emp}
                      </span>
                    ))
                  ) : (
                    <span className="gm-details-empty-text">No employees assigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="gm-modal-body gm-detail-body">
              <h3 className="gm-detail-section-title">Student Details</h3>
              <div style={{ overflowX: "auto", marginTop: "12px" }}>
                <table className="data-table view-students-table">
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
