import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { adminRepAPI, UPLOADS_BASE } from "../services/api";

const formatMonthLabel = (value) => {
  if (!value) return "-";
  const text = String(value).trim();
  if (/^\d{4}-\d{2}$/.test(text)) {
    const [year, month] = text.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }
  return text;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN");
};

const emptyForm = {
  id: "",
  representativeId: "",
  monthLabel: "",
  weekLabel: "",
  weekStartDate: "",
  weekEndDate: "",
  upiQrDriveLink: "",
  totalEnrollmentCount: "0",
  studentsWith3000Paid: "0",
  payoutStatus: "Hold",
  payoutReleaseDate: "",
  promotionalDocumentsLink: "",
  notes: "",
};

const toPublicFilePath = (filepath) => {
  if (!filepath) return "";
  const normalized = String(filepath).replace(/\\/g, "/");
  const relative = normalized.split("uploads/")[1] || "";
  return relative ? `${UPLOADS_BASE}/uploads/${relative}` : "";
};

function RepresentativePayoutManagement() {
  const [activeTab, setActiveTab] = useState("list");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });
  const [representatives, setRepresentatives] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [filters, setFilters] = useState({ month: "", status: "", representativeId: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [repSearchText, setRepSearchText] = useState("");
  const [showRepDropdown, setShowRepDropdown] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedRepDetails, setSelectedRepDetails] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  useEffect(() => {
    if (formData.representativeId && representatives.length > 0) {
      const selectedRep = representatives.find(rep => rep._id === formData.representativeId);
      if (selectedRep) {
        setRepSearchText(`${selectedRep.name} (${selectedRep.pgirId || "-"})`);
      } else {
        setRepSearchText("");
      }
    } else {
      setRepSearchText("");
    }
  }, [formData.representativeId, representatives]);

  useEffect(() => {
    if (!showRepDropdown) return;
    const handleOutsideClick = (event) => {
      if (!event.target.closest('[data-rep-search="true"]')) {
        setShowRepDropdown(false);
        if (formData.representativeId && representatives.length > 0) {
          const selectedRep = representatives.find(rep => rep._id === formData.representativeId);
          if (selectedRep) {
            setRepSearchText(`${selectedRep.name} (${selectedRep.pgirId || "-"})`);
          }
        } else {
          setRepSearchText("");
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showRepDropdown, formData.representativeId, representatives]);

  const fetchRepresentatives = async () => {
    const res = await adminRepAPI.getAllRepresentatives();
    if (res.data.success) setRepresentatives(res.data.representatives || []);
  };

  const fetchPayouts = async (query = {}) => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(query).filter(([, value]) => String(value || "").trim() !== ""),
      );
      const res = await adminRepAPI.getRepresentativePayouts(params);
      if (res.data.success) setPayouts(res.data.payouts || []);
    } catch (err) {
      console.error("Payout fetch error", err);
      setError("Failed to load payout records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepresentatives();
    fetchPayouts();
  }, []);

  useEffect(() => {
    if (!openMenuId) return;

    const handleOutsideClick = (event) => {
      if (event.target.closest("[data-menu]") || event.target.closest("[data-menu-toggle]")) return;
      setOpenMenuId(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openMenuId]);

  const toggleMenu = (id, event) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 190;
      const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setMenuPosition({
        top: openUpward ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
        left: rect.right - 190 + window.scrollX,
        openUpward,
      });
      setOpenMenuId(id);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => fetchPayouts(filters);

  const resetFilters = () => {
    const next = { month: "", status: "", representativeId: "" };
    setFilters(next);
    setSearchQuery("");
    fetchPayouts(next);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getFilteredPayouts = () => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return payouts;

    return payouts.filter((item) => {
      const representativeName = item.representative?.name || "";
      const representativeCode = item.representative?.pgirId || "";

      return (
        representativeName.toLowerCase().includes(query) ||
        representativeCode.toLowerCase().includes(query)
      );
    });
  };

  const editEntry = (entry) => {
    setFormData({
      id: entry._id,
      representativeId: entry.representative?._id || "",
      monthLabel: /^\d{4}-\d{2}$/.test(String(entry.monthLabel || "")) ? entry.monthLabel : "",
      weekLabel: entry.weekLabel || "",
      weekStartDate: entry.weekStartDate ? new Date(entry.weekStartDate).toISOString().slice(0, 10) : "",
      weekEndDate: entry.weekEndDate ? new Date(entry.weekEndDate).toISOString().slice(0, 10) : "",
      upiQrDriveLink: entry.upiQrDriveLink || "",
      totalEnrollmentCount: String(entry.totalEnrollmentCount || 0),
      studentsWith3000Paid: String(entry.studentsWith3000Paid || 0),
      payoutStatus: entry.payoutStatus || "Hold",
      payoutReleaseDate: entry.payoutReleaseDate ? new Date(entry.payoutReleaseDate).toISOString().slice(0, 10) : "",
      promotionalDocumentsLink: entry.promotionalDocumentsLink || "",
      notes: entry.notes || "",
    });
    setActiveTab("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenRepresentativeStudents = async (representativeId) => {
    if (!representativeId) return;
    setError("");
    setStudentSearchQuery("");
    setDetailsLoading(true);
    try {
      const response = await adminRepAPI.getRepresentativeDetails(representativeId);
      if (response.data.success) {
        setSelectedRepDetails(response.data);
      }
    } catch (err) {
      console.error("Representative details fetch error", err);
      setError(err.response?.data?.message || "Failed to load enrolled students");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.representativeId || !formData.monthLabel || !formData.weekLabel || !formData.weekStartDate || !formData.weekEndDate) {
      setError("Representative, month, week and week date range are required");
      return;
    }

    try {
      setSaving(true);
      const payload = { ...formData };
      await adminRepAPI.upsertRepresentativePayout(payload);
      setSuccess("Payout record saved");
        setActiveTab("list");
      setFormData(emptyForm);
      fetchPayouts(filters);
    } catch (err) {
      console.error("Payout save error", err);
      setError(err.response?.data?.message || "Failed to save payout");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayout = async (payoutId) => {
    if (!window.confirm("Are you sure you want to delete this payout record?")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const response = await adminRepAPI.deleteRepresentativePayout(payoutId);
      if (response.data.success) {
        setSuccess("Payout record deleted successfully");
        fetchPayouts(filters);
      }
    } catch (err) {
      console.error("Payout delete error", err);
      setError(err.response?.data?.message || "Failed to delete payout record");
    }
  };

  return (
    <div>
      <div className="premium-page-header">
        <div className="header-left">
          <h1>Representative Payout Management</h1>
          <p className="header-subtitle">Admin can edit payout records. PGIR can view in reward dashboard.</p>
        </div>
        <div className="header-right">
          {activeTab === "form" ? (
            <button
              type="button"
              onClick={() => {
                setFormData(emptyForm);
                setActiveTab("list");
              }}
              style={{
                padding: "10px 18px",
                border: "none",
                borderRadius: "10px",
                background: "#344158",
                color: "#fff",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setActiveTab("form");
                setFormData(emptyForm);
              }}
              style={{
                padding: "10px 18px",
                border: "none",
                borderRadius: "10px",
                background: "#344158",
                color: "#fff",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Add Payout
            </button>
          )}
        </div>
      </div>

      {success && <div className="success-message" style={{ marginBottom: "12px" }}>{success}</div>}
      {error && <div className="error-message" style={{ marginBottom: "12px" }}>{error}</div>}

      {activeTab === "form" ? (
        <div className="premium-card" style={{ marginBottom: "16px" }}>
          <div className="premium-card-header">
            <h2>{formData.id ? "Edit Payout" : "Add Payout"}</h2>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <div className="form-group" data-rep-search="true" style={{ position: "relative" }}>
                <label>PGIR Name *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Type to search representative..."
                    value={repSearchText}
                    onChange={(e) => {
                      setRepSearchText(e.target.value);
                      setShowRepDropdown(true);
                      if (!e.target.value) {
                        setFormData(prev => ({ ...prev, representativeId: "" }));
                      }
                    }}
                    onFocus={() => setShowRepDropdown(true)}
                    required
                    style={{ paddingRight: "30px" }}
                  />
                  <div
                    onClick={() => setShowRepDropdown(!showRepDropdown)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "#64748b"
                    }}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {showRepDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      zIndex: 1000,
                      maxHeight: "200px",
                      overflowY: "auto",
                      marginTop: "4px"
                    }}
                  >
                    {representatives
                      .filter(rep => {
                        const name = rep.name || "";
                        const pgir = rep.pgirId || "";
                        const query = repSearchText.toLowerCase();
                        return name.toLowerCase().includes(query) || pgir.toLowerCase().includes(query);
                      })
                      .map(rep => (
                        <div
                          key={rep._id}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, representativeId: rep._id }));
                            setRepSearchText(`${rep.name} (${rep.pgirId || "-"})`);
                            setShowRepDropdown(false);
                          }}
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderBottom: "1px solid #f1f5f9",
                            background: formData.representativeId === rep._id ? "#f1f5f9" : "transparent",
                            color: "#000"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = formData.representativeId === rep._id ? "#f1f5f9" : "transparent"; }}
                        >
                          <span>{rep.name}</span> <span style={{ color: "#64748b", fontSize: "12px" }}>({rep.pgirId || "-"})</span>
                        </div>
                      ))
                    }
                    {representatives.filter(rep => {
                      const name = rep.name || "";
                      const pgir = rep.pgirId || "";
                      const query = repSearchText.toLowerCase();
                      return name.toLowerCase().includes(query) || pgir.toLowerCase().includes(query);
                    }).length === 0 && (
                      <div style={{ padding: "8px 12px", color: "#64748b", textAlign: "center", fontSize: "13px" }}>
                        No representatives found
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="form-group"><label>Month *</label><input type="month" name="monthLabel" value={formData.monthLabel} onChange={handleInput} required /></div>
              <div className="form-group"><label>Week *</label><input name="weekLabel" value={formData.weekLabel} onChange={handleInput} placeholder="Sunday-Saturday" required /></div>
              <div className="form-group"><label>Week Start *</label><input type="date" name="weekStartDate" value={formData.weekStartDate} onChange={handleInput} required /></div>
              <div className="form-group"><label>Week End *</label><input type="date" name="weekEndDate" value={formData.weekEndDate} onChange={handleInput} required /></div>
              <div className="form-group"><label>UPI / QR Drive Link</label><input name="upiQrDriveLink" value={formData.upiQrDriveLink} onChange={handleInput} /></div>
              <div className="form-group"><label>Total Enrollment Count</label><input type="number" min="0" name="totalEnrollmentCount" value={formData.totalEnrollmentCount} onChange={handleInput} /></div>
              <div className="form-group"><label>Students with 3000 Paid</label><input type="number" min="0" name="studentsWith3000Paid" value={formData.studentsWith3000Paid} onChange={handleInput} /></div>
              <div className="form-group">
                <label>Payout Status</label>
                <select name="payoutStatus" value={formData.payoutStatus} onChange={handleInput}>
                  <option value="Hold">Hold</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="form-group"><label>Payout Release Date</label><input type="date" name="payoutReleaseDate" value={formData.payoutReleaseDate} onChange={handleInput} /></div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}><label>Promotional Documents Link (Common)</label><input name="promotionalDocumentsLink" value={formData.promotionalDocumentsLink} onChange={handleInput} /></div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}><label>Notes</label><textarea name="notes" rows={2} value={formData.notes} onChange={handleInput} /></div>
            </div>
            <div style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
              <button className="table-action-btn rep-form-submit-btn" disabled={saving} type="submit">
                {saving ? "Saving..." : "Save Payout"}
              </button>
              <button className="table-action-btn rep-form-cancel-btn" type="button" onClick={() => { setFormData(emptyForm); setActiveTab("list"); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="premium-card" style={{ marginBottom: "14px", padding: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px" }}>
              <div className="form-group" style={{ margin: 0, gridColumn: "1 / -1" }}>
                <label>Search by Name</label>
                <input
                  type="text"
                  placeholder="Search representative name or PGIR ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Month</label>
                <input type="month" name="month" value={filters.month} onChange={handleFilterChange} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>PGIR</label>
                <select name="representativeId" value={filters.representativeId} onChange={handleFilterChange}>
                  <option value="">All</option>
                  {representatives.map((rep) => (
                    <option key={rep._id} value={rep._id}>{rep.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                  <option value="">All</option>
                  <option value="Paid">Paid</option>
                  <option value="Hold">Hold</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "end" }}>
                <button className="table-action-btn rep-payout-filter-btn" onClick={applyFilters}>Apply</button>
                <button className="table-action-btn rep-payout-filter-btn" onClick={resetFilters}>Clear</button>
              </div>
            </div>
          </div>

          <div className="premium-card">
            {loading ? (
              <div style={{ padding: "36px", textAlign: "center" }}>Loading...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="premium-table rep-payout-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Week</th>
                      <th>PGIR</th>
                      <th>Enrollments</th>
                      <th>3000 Paid</th>
                      <th>Eligible</th>
                      <th>Reward %</th>
                      <th>Payout Amount</th>
                      <th>Status</th>
                      <th>Release Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredPayouts().length === 0 ? (
                      <tr><td colSpan={11} style={{ textAlign: "center" }}>No payout records found</td></tr>
                    ) : (
                      getFilteredPayouts().map((item) => (
                        <tr key={item._id}>
                          <td>{formatMonthLabel(item.monthLabel)}</td>
                          <td>{item.weekLabel}</td>
                          <td>{item.representative?.name || "-"}</td>
                          <td>{item.totalEnrollmentCount}</td>
                          <td>{item.studentsWith3000Paid}</td>
                          <td>{item.payoutEligible}</td>
                          <td>{item.rewardPercent}%</td>
                          <td>Rs {item.payoutAmount || 0}</td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: 700,
                                background: item.payoutStatus === "Paid" ? "#dcfce7" : item.payoutStatus === "Hold" ? "#fee2e2" : "#f3f4f6",
                                color: item.payoutStatus === "Paid" ? "#166534" : item.payoutStatus === "Hold" ? "#991b1b" : "#374151",
                              }}
                            >
                              {item.payoutStatus}
                            </span>
                          </td>
                          <td>{item.payoutReleaseDate ? new Date(item.payoutReleaseDate).toLocaleDateString("en-IN") : "-"}</td>
                          <td style={{ position: "relative" }}>                            <button
                              data-menu-toggle
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMenu(item._id, e);
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
                              ...
                            </button>

                            {openMenuId === item._id &&
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
                                    width: "190px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenRepresentativeStudents(item.representative?._id);
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
                                    onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
                                    onMouseLeave={(e) => (e.target.style.background = "white")}
                                  >
                                    Enroll Student ({representatives.find(r => r._id === item.representative?._id)?.totalStudents || 0})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      editEntry(item);
                                      setOpenMenuId(null);
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "12px 16px",
                                      background: "white",
                                      border: "none",
                                      borderTop: "1px solid #f3f4f6",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                      fontWeight: "500",
                                      color: "#0f172a",
                                    }}
                                    onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                                    onMouseLeave={(e) => (e.target.style.background = "white")}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const scannerPath = item.representative?.docs?.upiScanner?.filepath;
                                      const publicFileUrl = toPublicFilePath(scannerPath);

                                      if (publicFileUrl) {
                                        window.open(publicFileUrl, "_blank", "noopener,noreferrer");
                                      } else {
                                        window.alert("UPI Scanner file not available for this representative");
                                      }
                                      setOpenMenuId(null);
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "12px 16px",
                                      background: "white",
                                      border: "none",
                                      borderTop: "1px solid #f3f4f6",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                      fontWeight: "500",
                                      color: "#0f172a",
                                    }}
                                    onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                                    onMouseLeave={(e) => (e.target.style.background = "white")}
                                  >
                                    UPI Scanner
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeletePayout(item._id);
                                      setOpenMenuId(null);
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "12px 16px",
                                      background: "white",
                                      border: "none",
                                      borderTop: "1px solid #f3f4f6",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                      fontWeight: "500",
                                      color: "#ef4444",
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
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {detailsLoading && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.36)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 12000 }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 32px", textAlign: "center", boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Loading enrolled students...</div>
          </div>
        </div>,
        document.body
      )}

      {selectedRepDetails && createPortal(
        <div
          onClick={() => setSelectedRepDetails(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 12500,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(8px)",
            padding: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflowY: "auto",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1280px, 100%)",
              maxHeight: "90vh",
              background: "#ffffff",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "#324158",
                color: "#ffffff",
                padding: "16px 28px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {/* Top Row: Label & Close Button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.7)", fontWeight: 700 }}>
                  Representative Performance Hub
                </div>
                {/* Circular Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedRepDetails(null)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease-in-out",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                    e.currentTarget.style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: "12px", height: "12px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Main Content Row */}
              <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff" }}>{selectedRepDetails.representative?.name || "Representative"}</h2>
                  <div style={{ marginTop: "6px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", fontSize: "11px", fontWeight: 600, color: "#ffffff" }}>
                      PGIR ID: {selectedRepDetails.representative?.pgirId || "-"}
                    </span>
                    <span style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", fontSize: "11px", fontWeight: 600, color: "#ffffff" }}>
                      Total Enrolled: {selectedRepDetails.stats?.totalStudents || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content Container */}
            <div style={{ padding: "32px", overflowY: "auto", flex: 1, backgroundColor: "#ffffff" }}>
              {/* Sleek KPI Metrics Bar */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "24px",
                  marginBottom: "28px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "24px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
              >
                {[
                  {
                    label: "Internship Enrolled",
                    value: selectedRepDetails.stats?.byType?.internship || 0,
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.9c2.785 0 5.43-.233 8.006-.684a60.428 60.428 0 00-.49-6.347M12 2.25l-9 4.875 9 4.875 9-4.875-9-4.875zM3.72 10.5l8.28 4.5 8.28-4.5" />
                      </svg>
                    )
                  },
                  {
                    label: "SMS Program Enrolled",
                    value: selectedRepDetails.stats?.byType?.smsProgram || 0,
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    )
                  },
                  {
                    label: "Enrolled This Week",
                    value: selectedRepDetails.stats?.weeklyStudents || 0,
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                      </svg>
                    )
                  },
                  {
                    label: "Enrolled This Month",
                    value: selectedRepDetails.stats?.monthlyStudents || 0,
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-.1-8.203-.27m16.406 0a11.986 11.986 0 00-1.683-4.218M4.203 10.23a11.986 11.986 0 011.683-4.218" />
                      </svg>
                    )
                  }
                ].map((card) => (
                  <div
                    key={card.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "#f8fafc",
                      borderRadius: "12px",
                      borderLeft: "4px solid #324158",
                      transition: "all 0.2s ease-in-out",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(50, 65, 88, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div>
                      <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "4px" }}>
                        {card.label}
                      </div>
                      <div style={{ fontSize: "28px", fontWeight: 800, color: "#324158", lineHeight: 1.1 }}>
                        {card.value}
                      </div>
                    </div>
                    <div style={{ color: "#324158", background: "#ffffff", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {card.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Table Section */}
              <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", overflow: "hidden" }}>
                {/* Search Header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "center", backgroundColor: "#ffffff" }}>
                  <div>
                    <h3 style={{ margin: 0, color: "#324158", fontSize: "18px", fontWeight: 700 }}>Enrolled Students List</h3>
                  </div>
                  <div style={{ position: "relative", minWidth: "280px", maxWidth: "420px", width: "100%" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", alignItems: "center" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "18px", height: "18px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search student name, email, mobile, ID..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      style={{
                        width: "100%",
                        border: "1px solid #cbd5e1",
                        borderRadius: "12px",
                        padding: "12px 14px 12px 42px",
                        background: "#ffffff",
                        fontSize: "14px",
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#324158";
                        e.target.style.boxShadow = "0 0 0 3px rgba(50, 65, 88, 0.15)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#cbd5e1";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                {/* Table Container */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#324158", borderBottom: "1px solid #cbd5e1" }}>
                        {['Student Info', 'Program Type', 'Contact Info', 'College / Institute', 'Course Details', 'Payment Summary', 'Key Dates', 'Status'].map((heading) => (
                          <th key={heading} style={{ textAlign: "left", padding: "16px 20px", fontSize: "11px", color: "#ffffff", backgroundColor: "#324158", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedRepDetails.enrolledStudents || []).filter((student) => {
                        const query = studentSearchQuery.trim().toLowerCase();
                        if (!query) return true;
                        return [student.name, student.email, student.mobile, student.internId, student.studentType, student.domain, student.currentDesignation, student.collegeName, student.instituteName].filter(Boolean).join(" ").toLowerCase().includes(query);
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: "48px 16px", color: "#64748b" }}>
                            <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>No Enrolled Students Found</div>
                            <div style={{ fontSize: "13px", color: "#94a3b8" }}>Search term match nahi hua ya representative ne koi student add nahi kiya.</div>
                          </td>
                        </tr>
                      ) : (
                        (selectedRepDetails.enrolledStudents || []).filter((student) => {
                          const query = studentSearchQuery.trim().toLowerCase();
                          if (!query) return true;
                          return [student.name, student.email, student.mobile, student.internId, student.studentType, student.domain, student.currentDesignation, student.collegeName, student.instituteName].filter(Boolean).join(" ").toLowerCase().includes(query);
                        }).map((student) => {
                          const isSMS = student.studentType === "SMS Program";
                          const isCompleted = student.status === "completed";
                          const isActive = student.status === "active";
                          
                          // Fee Calculations
                          const completedFeesVal = student.completedFees || student.paymentAmount || 0;
                          const pendingFeesVal = student.pendingFees || 0;

                          return (
                            <tr
                              key={student._id}
                              style={{ borderBottom: "1px solid #cbd5e1", transition: "background-color 0.15s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                              {/* Student Info */}
                              <td style={{ padding: "18px 20px", verticalAlign: "top" }}>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: "#324158" }}>{student.name || "-"}</div>
                                <div style={{ marginTop: "6px", display: "inline-block", fontFamily: "monospace", fontSize: "12px", background: "rgba(50, 65, 88, 0.06)", padding: "2px 6px", borderRadius: "4px", color: "#324158" }}>
                                  ID: {student.internId || "-"}
                                </div>
                                <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
                                  Qual: {student.currentQualification || student.yearOfStudy || "-"}
                                </div>
                              </td>

                              {/* Program Type */}
                              <td style={{ padding: "18px 20px", verticalAlign: "top" }}>
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    background: isSMS ? "#ffffff" : "#324158",
                                    color: isSMS ? "#324158" : "#ffffff",
                                    border: isSMS ? "1px solid #324158" : "none",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                  }}
                                >
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isSMS ? "#324158" : "#ffffff" }}></span>
                                  {student.studentType || "-"}
                                </div>
                                <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                                  Role: {student.currentDesignation || "Student"}
                                </div>
                              </td>

                              {/* Contact Info */}
                              <td style={{ padding: "18px 20px", verticalAlign: "top" }}>
                                <div style={{ fontSize: "13px", color: "#324158", fontWeight: 500, wordBreak: "break-all" }}>{student.email || "-"}</div>
                                <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                  </svg>
                                  {student.mobile || "-"}
                                </div>
                              </td>

                              {/* College / Institute */}
                              <td style={{ padding: "18px 20px", verticalAlign: "top" }}>
                                <div style={{ fontSize: "13px", color: "#324158", fontWeight: 600, lineHeight: 1.4, maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={student.instituteName || student.collegeName}>
                                  {student.instituteName || student.collegeName || "-"}
                                </div>
                                <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
                                  Loc: {student.branch || student.instituteLocation || "-"}
                                </div>
                              </td>

                              {/* Course Details */}
                              <td style={{ padding: "18px 20px", verticalAlign: "top" }}>
                                <div style={{ fontSize: "13px", color: "#324158", fontWeight: 500 }}>
                                  Domain: <span style={{ fontWeight: 600, color: "#324158" }}>{student.domain || "-"}</span>
                                </div>
                                <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
                                  Duration: {student.duration || "-"}
                                </div>
                                <div style={{ marginTop: "4px", fontSize: "12px", color: "#64748b" }}>
                                  Batch: {student.enrolBatchMonth || "-"}
                                </div>
                              </td>

                              {/* Payment Summary */}
                              <td style={{ padding: "18px 20px", verticalAlign: "top" }}>
                                <div style={{ fontSize: "13px", color: "#324158", fontWeight: 700 }}>
                                  Paid: Rs {completedFeesVal}
                                </div>
                                {pendingFeesVal > 0 ? (
                                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#324158", fontWeight: 700 }}>
                                    Pending: Rs {pendingFeesVal}
                                  </div>
                                ) : (
                                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                                    Fully Paid
                                  </div>
                                )}
                                {student.transactionId && (
                                  <div style={{ marginTop: "4px", fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                                    Txn: {student.transactionId}
                                  </div>
                                )}
                              </td>

                              {/* Key Dates */}
                              <td style={{ padding: "18px 20px", verticalAlign: "top" }}>
                                <div style={{ fontSize: "12px", color: "#475569" }}>
                                  <span style={{ color: "#94a3b8" }}>Added:</span> {formatDate(student.createdAt)}
                                </div>
                                <div style={{ marginTop: "6px", fontSize: "12px", color: "#475569" }}>
                                  <span style={{ color: "#94a3b8" }}>Start:</span> {formatDate(student.joiningDate || student.enrolmentDate)}
                                </div>
                                <div style={{ marginTop: "4px", fontSize: "12px", color: "#475569" }}>
                                  <span style={{ color: "#94a3b8" }}>End:</span> {formatDate(student.endingDate || student.lastPaymentDate)}
                                </div>
                              </td>

                              {/* Status */}
                              <td style={{ padding: "18px 20px", verticalAlign: "top" }}>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    background: isActive ? "#324158" : "#ffffff",
                                    color: isActive ? "#ffffff" : "#324158",
                                    border: isActive ? "none" : "1px solid #324158",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {student.status || "-"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default RepresentativePayoutManagement;
