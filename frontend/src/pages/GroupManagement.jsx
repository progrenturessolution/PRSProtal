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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailsGroup, setDetailsGroup] = useState(null);
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

  const filteredStudents = useMemo(() => {
    if (form.studentType === "All") return students;
    return students.filter((item) => item.studentType === form.studentType);
  }, [students, form.studentType]);

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
      loadData();
    } catch (err) {
      console.error("Delete group error", err);
      setError("Failed to delete group");
    }
  };

  return (
    <div>
      <div className="premium-page-header">
        <div className="header-left">
          <h1>Group Management</h1>
          <p className="header-subtitle">Create, view and manage student groups</p>
        </div>
      </div>

      {success && <div className="success-message" style={{ marginBottom: "10px" }}>{success}</div>}
      {error && <div className="error-message" style={{ marginBottom: "10px" }}>{error}</div>}

      <div className="premium-card" style={{ marginBottom: "16px" }}>
        <div className="premium-card-header">
          <h2>{form.id ? "Edit Group" : "Create Group"}</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div className="form-group"><label>Group Number *</label><input name="groupNumber" value={form.groupNumber} onChange={handleInput} required /></div>
            <div className="form-group"><label>Group Name *</label><input name="groupName" value={form.groupName} onChange={handleInput} required /></div>
            <div className="form-group"><label>Select Student Type</label>
              <select name="studentType" value={form.studentType} onChange={handleInput}>
                <option value="All">All</option>
                <option value="Internship">Internship</option>
                <option value="SMS Program">SMS Program</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Group Description</label>
              <textarea name="groupDescription" value={form.groupDescription} onChange={handleInput} rows={2} />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Group Assigned (Employee Names, comma-separated)</label>
              <input
                name="assignedEmployeesText"
                value={form.assignedEmployeesText}
                onChange={handleInput}
                placeholder="e.g. Ananya Singh, Rahul Verma"
              />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Select Students ({form.selectedStudents.length} selected)</label>
              <div
                style={{
                  maxHeight: "220px",
                  overflow: "auto",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px",
                }}
              >
                {filteredStudents.length === 0 ? (
                  <div style={{ padding: "10px", color: "#64748b" }}>No students found for selected type</div>
                ) : (
                  filteredStudents.map((student) => (
                    <label key={student._id} style={{ display: "flex", gap: "8px", padding: "6px" }}>
                      <input
                        type="checkbox"
                        checked={form.selectedStudents.includes(student._id)}
                        onChange={() => toggleStudentSelection(student._id)}
                      />
                      <span>
                        {student.name} ({student.internId}) - {student.studentType}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "14px", display: "flex", gap: "8px" }}>
            <button type="submit" className="table-action-btn" style={{ background: "#324158" }} disabled={saving}>
              {saving ? "Saving..." : form.id ? "Update Group" : "Create Group"}
            </button>
            <button type="button" className="table-action-btn" style={{ background: "#94a3b8" }} onClick={() => setForm(defaultForm)}>
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="premium-card">
        {loading ? (
          <div style={{ padding: "36px", textAlign: "center" }}>Loading groups...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Group Number</th>
                  <th>Group Name</th>
                  <th>Description</th>
                  <th>Student Type</th>
                  <th>Assigned Employees</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center" }}>No groups created</td></tr>
                ) : (
                  groups.map((group) => (
                    <tr key={group._id}>
                      <td>{group.groupNumber}</td>
                      <td>{group.groupName}</td>
                      <td>{group.groupDescription || "-"}</td>
                      <td>{group.studentType}</td>
                      <td>{(group.assignedEmployees || []).join(", ") || "-"}</td>
                      <td>{(group.students || []).length}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button className="table-action-btn" style={{ background: "#0ea5e9" }} onClick={() => openDetails(group._id)}>View</button>
                          <button className="table-action-btn" style={{ background: "#2563eb" }} onClick={() => editGroup(group)}>Edit</button>
                          <button className="table-action-btn" style={{ background: "#ef4444" }} onClick={() => removeGroup(group._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailsGroup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setDetailsGroup(null)}
        >
          <div
            className="premium-card"
            style={{ width: "min(900px, 100%)", maxHeight: "90vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="premium-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>{detailsGroup.groupName}</h2>
              <button className="table-action-btn" style={{ background: "#94a3b8" }} onClick={() => setDetailsGroup(null)}>Close</button>
            </div>
            <div style={{ padding: "16px" }}>
              <p><strong>Group Number:</strong> {detailsGroup.groupNumber}</p>
              <p><strong>Description:</strong> {detailsGroup.groupDescription || "-"}</p>
              <p><strong>Student Type:</strong> {detailsGroup.studentType}</p>
              <p><strong>Assigned Employees:</strong> {(detailsGroup.assignedEmployees || []).join(", ") || "-"}</p>

              <h3 style={{ marginTop: "14px" }}>Student Details</h3>
              <div style={{ overflowX: "auto" }}>
                <table className="premium-table">
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
