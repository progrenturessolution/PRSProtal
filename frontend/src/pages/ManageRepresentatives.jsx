import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { adminRepAPI, UPLOADS_BASE } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const initialForm = {
  pgirId: "",
  name: "",
  email: "",
  password: "",
  mobile: "",
  designation: "Campus Representative",
  internshipApplicationFormLink: "",
  internshipSheetLink: "",
  internshipPromotionalMessage: "",
  smsPromotionalMessage: "",
  joiningDate: "",
  college: "",
  course: "",
  department: "",
  year: "",
  instagramProfile: "",
  linkedinProfile: "",
  upiId: "",
  upiMobileNumber: "",
};

function formatDate(dateValue) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("en-IN");
}

function toPublicFilePath(filepath) {
  if (!filepath) return "";
  return `${UPLOADS_BASE}/uploads/${String(filepath).replace(/\\/g, "/").split("uploads/")[1] || ""}`;
}

function ManageRepresentatives() {
  const [activeTab, setActiveTab] = useState("list");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });
  const [representatives, setRepresentatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filters, setFilters] = useState({
    name: "",
    joiningMonth: "",
    batchMonth: "",
  });

  const [formData, setFormData] = useState(initialForm);
  const [files, setFiles] = useState({
    upiScanner: null,
    pgirSelectionLetter: null,
    internshipOfferLetter: null,
  });
  const [editingRepId, setEditingRepId] = useState("");

  const [selectedRepDetails, setSelectedRepDetails] = useState(null);

  const fetchRepresentatives = async (query = {}) => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(query).filter(([, value]) => String(value || "").trim() !== ""),
      );
      const response = await adminRepAPI.getAllRepresentatives(params);
      if (response.data.success) {
        setRepresentatives(response.data.representatives || []);
      }
    } catch (err) {
      console.error("Fetch representatives error:", err);
      setError("Failed to load representatives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepresentatives();
  }, []);

  const totalReps = representatives.length;
  const activeReps = useMemo(
    () => representatives.filter((rep) => rep.status === "active").length,
    [representatives],
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchRepresentatives(filters);
  };

  const clearFilters = () => {
    const next = { name: "", joiningMonth: "", batchMonth: "" };
    setFilters(next);
    fetchRepresentatives(next);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileInput = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles((prev) => ({ ...prev, [name]: selectedFiles?.[0] || null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.pgirId.trim() || !formData.name.trim() || !formData.email.trim()) {
      setError("PGIR ID, full name and email are required");
      return;
    }

    if (!editingRepId && !formData.password.trim()) {
      setError("Password is required while adding a new representative");
      return;
    }

    const hasAnyFile = Object.values(files).some(Boolean);

    let payload;
    if (hasAnyFile) {
      payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value || "");
      });

      Object.entries(files).forEach(([key, file]) => {
        if (file) payload.append(key, file);
      });
    } else {
      // Use JSON for plain profile creation; this avoids multipart parsing issues
      // when no documents are uploaded.
      payload = { ...formData };
    }

    try {
      setSubmitting(true);
      const response = editingRepId
        ? await adminRepAPI.updateRepresentative(editingRepId, payload)
        : await adminRepAPI.addRepresentative(payload);

      if (response.data.success) {
        setSuccess(editingRepId ? "Representative updated successfully" : "Representative added successfully");
        setFormData(initialForm);
        setFiles({ upiScanner: null, pgirSelectionLetter: null, internshipOfferLetter: null });
        setEditingRepId("");
        await fetchRepresentatives(filters);
        setActiveTab("list");
      }
    } catch (err) {
      setError(err.response?.data?.message || (editingRepId ? "Failed to update representative" : "Failed to add representative"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRepresentative = (rep) => {
    setFormData({
      pgirId: rep.pgirId || "",
      name: rep.name || "",
      email: rep.email || "",
      password: "",
      mobile: rep.mobile || "",
      designation: rep.designation || "Campus Representative",
      internshipApplicationFormLink: rep.internshipApplicationFormLink || "",
      internshipSheetLink: rep.internshipSheetLink || "",
      internshipPromotionalMessage: rep.internshipPromotionalMessage || "",
      smsPromotionalMessage: rep.smsPromotionalMessage || "",
      joiningDate: rep.joiningDate ? new Date(rep.joiningDate).toISOString().slice(0, 10) : "",
      college: rep.college || "",
      course: rep.course || "",
      department: rep.department || "",
      year: rep.year || "",
      instagramProfile: rep.instagramProfile || "",
      linkedinProfile: rep.linkedinProfile || "",
      upiId: rep.upiId || "",
      upiMobileNumber: rep.upiMobileNumber || "",
    });
    setFiles({ upiScanner: null, pgirSelectionLetter: null, internshipOfferLetter: null });
    setEditingRepId(rep._id);
    setActiveTab("add");
    setOpenMenuId(null);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete PGIR ${name}?`)) return;
    try {
      await adminRepAPI.deleteRepresentative(id);
      await fetchRepresentatives(filters);
      setSuccess("Representative deleted successfully");
    } catch (err) {
      console.error("Delete representative error:", err);
      setError("Failed to delete representative");
    }
  };

  const handleViewDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const response = await adminRepAPI.getRepresentativeDetails(id);
      if (response.data.success) {
        setSelectedRepDetails(response.data);
      }
    } catch (err) {
      console.error("Representative details error:", err);
      setError("Failed to load profile details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleMenu = (id, event) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 220;
      const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setMenuPosition({
        top: openUpward ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
        left: rect.right - 160 + window.scrollX,
        openUpward,
      });
      setOpenMenuId(id);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!openMenuId) return;
      const clickedInsideMenu = e.target.closest("[data-menu]") || e.target.closest("[data-menu-toggle]");
      if (!clickedInsideMenu) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openMenuId]);

  return (
    <div>
      <div className="premium-page-header">
        <div className="header-left">
          <h1>Representative Management</h1>
          <p className="header-subtitle">Manage PGIR profiles, onboarding docs and filters</p>
        </div>
        <div className="header-right">
        </div>
      </div>

      <div className="premium-stats-grid" style={{ marginBottom: "20px" }}>
        <div className="premium-stat-card accent-blue">
          <div className="stat-content">
            <div className="stat-label">Total PGIR</div>
            <div className="stat-value">{totalReps}</div>
          </div>
        </div>
        <div className="premium-stat-card accent-teal">
          <div className="stat-content">
            <div className="stat-label">Active PGIR</div>
            <div className="stat-value">{activeReps}</div>
          </div>
        </div>
      </div>

      {success && <div className="success-message" style={{ marginBottom: "12px" }}>{success}</div>}
      {error && <div className="error-message" style={{ marginBottom: "12px" }}>{error}</div>}

      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "16px",
          background: "#f1f5f9",
          padding: "6px",
          borderRadius: "12px",
          width: "fit-content",
        }}
      >
        {[{ key: "list", label: "All PGIR" }, { key: "add", label: "+ Add PGIR" }].map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              background: activeTab === item.key ? "#fff" : "transparent",
              color: activeTab === item.key ? "#0f172a" : "#64748b",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeTab === "list" && (
        <>
          <div className="premium-card" style={{ marginBottom: "16px", padding: "18px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
              }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <label>PGIR Name</label>
                <input
                  type="text"
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  placeholder="Search by name"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Enroll / Joining Month</label>
                <input
                  type="month"
                  name="joiningMonth"
                  value={filters.joiningMonth}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Batch Month</label>
                <input
                  type="month"
                  name="batchMonth"
                  value={filters.batchMonth}
                  onChange={handleFilterChange}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "end" }}>
                <button className="table-action-btn" style={{ background: "#000", color: "#fff" }} onClick={applyFilters}>
                  Apply
                </button>
                <button className="table-action-btn" style={{ background: "#000", color: "#fff" }} onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="premium-card">
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
            ) : representatives.length === 0 ? (
              <div className="premium-empty-state">
                <p className="empty-title">No PGIR found</p>
                <p className="empty-subtitle">Add a representative to get started</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table representatives-table">
                  <thead>
                    <tr>
                      <th>PGIR ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>WhatsApp</th>
                      <th>College</th>
                      <th>Joining</th>
                      <th>Students</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {representatives.map((rep) => (
                      <tr key={rep._id}>
                        <td className="mono-text">{rep.pgirId || "-"}</td>
                        <td>{rep.name || "-"}</td>
                        <td>{rep.email || "-"}</td>
                        <td>{rep.mobile || "-"}</td>
                        <td>{rep.college || "-"}</td>
                        <td>{formatDate(rep.joiningDate)}</td>
                        <td>{rep.totalStudents || 0}</td>
                        <td>
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <button
                              data-menu-toggle
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMenu(rep._id, e);
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

                            {openMenuId === rep._id &&
                              createPortal(
                                <div
                                  data-menu
                                  style={{
                                    position: "absolute",
                                    left: `${menuPosition.left}px`,
                                    top: `${menuPosition.top}px`,
                                    transform: menuPosition.openUpward ? "translateY(-100%)" : "none",
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
                                      handleViewDetails(rep._id);
                                      setOpenMenuId(null);
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
                                  <button
                                    onClick={() => {
                                      handleEditRepresentative(rep);
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
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDelete(rep._id, rep.name);
                                      setOpenMenuId(null);
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
                                      color: "#dc2626",
                                      borderTop: "1px solid #f3f4f6",
                                    }}
                                    onMouseEnter={(e) => (e.target.style.background = "#fef2f2")}
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
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "add" && (
        <div className="premium-card">
          <div className="premium-card-header">
            <h2 style={{ margin: 0 }}>{editingRepId ? "Edit Representative (PGIR)" : "Add Representative (PGIR)"}</h2>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
              <div className="form-group"><label>PGIR ID *</label><input name="pgirId" value={formData.pgirId} onChange={handleInput} placeholder="e.g. PGIR0101" required /></div>
              <div className="form-group"><label>Full Name *</label><input name="name" value={formData.name} onChange={handleInput} required /></div>
              <div className="form-group"><label>Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleInput} required /></div>
              <div className="form-group"><label>{editingRepId ? "Password (leave blank to keep current)" : "Password *"}</label><input type="password" name="password" value={formData.password} onChange={handleInput} required={!editingRepId} /></div>
              <div className="form-group"><label>WhatsApp Number</label><input name="mobile" value={formData.mobile} onChange={handleInput} /></div>
              <div className="form-group"><label>Current Designation</label><input name="designation" value={formData.designation} onChange={handleInput} /></div>
              <div className="form-group"><label>Joining Date</label><input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInput} /></div>
              <div className="form-group"><label>College Full Name</label><input name="college" value={formData.college} onChange={handleInput} /></div>
              <div className="form-group"><label>Branch / Course / Stream</label><input name="course" value={formData.course} onChange={handleInput} /></div>
              <div className="form-group"><label>Department</label><input name="department" value={formData.department} onChange={handleInput} /></div>
              <div className="form-group"><label>Year of Study</label><input name="year" value={formData.year} onChange={handleInput} /></div>
              <div className="form-group"><label>Instagram Profile</label><input name="instagramProfile" value={formData.instagramProfile} onChange={handleInput} /></div>
              <div className="form-group"><label>LinkedIn Profile</label><input name="linkedinProfile" value={formData.linkedinProfile} onChange={handleInput} /></div>
              <div className="form-group"><label>UPI ID</label><input name="upiId" value={formData.upiId} onChange={handleInput} /></div>
              <div className="form-group"><label>UPI / Mobile Number (Payout)</label><input name="upiMobileNumber" value={formData.upiMobileNumber} onChange={handleInput} /></div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}><label>Intern Application Form Link</label><input name="internshipApplicationFormLink" value={formData.internshipApplicationFormLink} onChange={handleInput} /></div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}><label>Internship Sheet Link</label><input name="internshipSheetLink" value={formData.internshipSheetLink} onChange={handleInput} /></div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Internship Promotional Message</label>
                <textarea name="internshipPromotionalMessage" value={formData.internshipPromotionalMessage} onChange={handleInput} rows={3} />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>SMS Promotional Message</label>
                <textarea name="smsPromotionalMessage" value={formData.smsPromotionalMessage} onChange={handleInput} rows={3} />
              </div>
              <div className="form-group"><label>UPI Scanner</label><input type="file" name="upiScanner" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileInput} /></div>
              <div className="form-group"><label>PGIR Selection Letter</label><input type="file" name="pgirSelectionLetter" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileInput} /></div>
              <div className="form-group"><label>Internship Offer Letter</label><input type="file" name="internshipOfferLetter" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileInput} /></div>
            </div>

            <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
              <button type="submit" disabled={submitting} className="table-action-btn rep-form-submit-btn">
                {submitting ? <LoadingSpinner text="Saving..." inline size="sm" /> : editingRepId ? "Update Representative" : "Add Representative"}
              </button>
              <button
                type="button"
                className="table-action-btn rep-form-cancel-btn"
                onClick={() => {
                  setActiveTab("list");
                  setEditingRepId("");
                  setFormData(initialForm);
                  setFiles({ upiScanner: null, pgirSelectionLetter: null, internshipOfferLetter: null });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedRepDetails && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.72)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSelectedRepDetails(null)}
        >
          <div
            style={{
              width: "min(1120px, 100%)",
              maxHeight: "92vh",
              overflow: "auto",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "16px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 22px",
                borderBottom: "1px solid #d4d4d4",
                background: "#324158",
                color: "#ffffff",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
                  {selectedRepDetails.representative.name} Profile
                </h2>
                <p style={{ margin: "6px 0 0 0", color: "#e5e5e5", fontSize: "13px" }}>
                  {selectedRepDetails.representative.email}
                </p>
              </div>
              <button
                className="table-action-btn"
                style={{ background: "#ffffff", color: "#324158", border: "1px solid #324158" }}
                onClick={() => setSelectedRepDetails(null)}
              >
                Close
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ border: "1px solid #d4d4d4", borderRadius: "12px", padding: "14px", background: "#fafafa" }}>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#525252", fontWeight: 700 }}>PGIR ID</div>
                  <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700, color: "#324158" }}>{selectedRepDetails.representative.pgirId || "-"}</div>
                </div>
                <div style={{ border: "1px solid #d4d4d4", borderRadius: "12px", padding: "14px", background: "#fafafa" }}>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#525252", fontWeight: 700 }}>Total Students</div>
                  <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700, color: "#324158" }}>{selectedRepDetails.stats.totalStudents}</div>
                </div>
                <div style={{ border: "1px solid #d4d4d4", borderRadius: "12px", padding: "14px", background: "#fafafa" }}>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#525252", fontWeight: 700 }}>This Week</div>
                  <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700, color: "#324158" }}>{selectedRepDetails.stats.weeklyStudents}</div>
                </div>
                <div style={{ border: "1px solid #d4d4d4", borderRadius: "12px", padding: "14px", background: "#fafafa" }}>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#525252", fontWeight: 700 }}>This Month</div>
                  <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700, color: "#324158" }}>{selectedRepDetails.stats.monthlyStudents}</div>
                </div>
              </div>

              <div style={{ border: "1px solid #d4d4d4", borderRadius: "12px", marginBottom: "16px", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #d4d4d4", fontWeight: 700, background: "#324158", color: "#ffffff" }}>
                  Professional Details
                </div>
                <div
                  style={{
                    padding: "16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                    gap: "12px",
                    color: "#171717",
                  }}
                >
                  <div><strong>WhatsApp:</strong> {selectedRepDetails.representative.mobile || "-"}</div>
                  <div><strong>Designation:</strong> {selectedRepDetails.representative.designation || "-"}</div>
                  <div><strong>Joining Date:</strong> {formatDate(selectedRepDetails.representative.joiningDate)}</div>
                  <div><strong>Password:</strong> {selectedRepDetails.representative.plainPassword || "-"}</div>
                  <div><strong>College:</strong> {selectedRepDetails.representative.college || "-"}</div>
                  <div><strong>Course/Stream:</strong> {selectedRepDetails.representative.course || "-"}</div>
                  <div><strong>Department:</strong> {selectedRepDetails.representative.department || "-"}</div>
                  <div><strong>Year:</strong> {selectedRepDetails.representative.year || "-"}</div>
                  <div><strong>Instagram:</strong> {selectedRepDetails.representative.instagramProfile || "-"}</div>
                  <div><strong>LinkedIn:</strong> {selectedRepDetails.representative.linkedinProfile || "-"}</div>
                  <div><strong>UPI ID:</strong> {selectedRepDetails.representative.upiId || "-"}</div>
                  <div><strong>UPI / Mobile:</strong> {selectedRepDetails.representative.upiMobileNumber || "-"}</div>
                  <div style={{ gridColumn: "1 / -1" }}><strong>Application Link:</strong> {selectedRepDetails.representative.internshipApplicationFormLink || "-"}</div>
                  <div style={{ gridColumn: "1 / -1" }}><strong>Internship Sheet:</strong> {selectedRepDetails.representative.internshipSheetLink || "-"}</div>
                  <div style={{ gridColumn: "1 / -1" }}><strong>Internship Promotional Message:</strong> {selectedRepDetails.representative.internshipPromotionalMessage || "-"}</div>
                  <div style={{ gridColumn: "1 / -1" }}><strong>SMS Promotional Message:</strong> {selectedRepDetails.representative.smsPromotionalMessage || "-"}</div>
                  <div>
                    <strong>UPI Scanner:</strong>{" "}
                    {selectedRepDetails.representative.docs?.upiScanner?.filepath ? (
                      <a
                        href={toPublicFilePath(selectedRepDetails.representative.docs.upiScanner.filepath)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#324158", fontWeight: 700, textDecoration: "underline" }}
                      >
                        Open
                      </a>
                    ) : "-"}
                  </div>
                  <div>
                    <strong>Selection Letter:</strong>{" "}
                    {selectedRepDetails.representative.docs?.pgirSelectionLetter?.filepath ? (
                      <a
                        href={toPublicFilePath(selectedRepDetails.representative.docs.pgirSelectionLetter.filepath)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#324158", fontWeight: 700, textDecoration: "underline" }}
                      >
                        Open
                      </a>
                    ) : "-"}
                  </div>
                  <div>
                    <strong>Offer Letter:</strong>{" "}
                    {selectedRepDetails.representative.docs?.internshipOfferLetter?.filepath ? (
                      <a
                        href={toPublicFilePath(selectedRepDetails.representative.docs.internshipOfferLetter.filepath)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#324158", fontWeight: 700, textDecoration: "underline" }}
                      >
                        Open
                      </a>
                    ) : "-"}
                  </div>
                </div>
              </div>

              <div style={{ border: "1px solid #d4d4d4", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #d4d4d4", fontWeight: 700, background: "#324158", color: "#ffffff" }}>
                  Recent Payouts
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Week</th>
                        <th>Enrollments</th>
                        <th>3000 Paid</th>
                        <th>Eligible</th>
                        <th>Reward %</th>
                        <th>Payout</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedRepDetails.payouts || []).length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: "center" }}>No payout records</td></tr>
                      ) : (
                        selectedRepDetails.payouts.map((item) => (
                          <tr key={item._id}>
                            <td>{item.monthLabel}</td>
                            <td>{item.weekLabel}</td>
                            <td>{item.totalEnrollmentCount}</td>
                            <td>{item.studentsWith3000Paid}</td>
                            <td>{item.payoutEligible}</td>
                            <td>{item.rewardPercent}%</td>
                            <td>₹{item.payoutAmount || 0}</td>
                            <td>{item.payoutStatus}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageRepresentatives;
