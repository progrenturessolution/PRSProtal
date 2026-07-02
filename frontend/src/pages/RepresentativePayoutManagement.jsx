import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { adminRepAPI } from "../services/api";

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
      const menuHeight = 150;
      const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setMenuPosition({
        top: openUpward ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
        left: rect.right - 160 + window.scrollX,
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
                          <td>₹{item.payoutAmount || 0}</td>
                          <td>{item.payoutStatus}</td>
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
                              ⋮
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
                                    width: "160px",
                                    overflow: "hidden",
                                  }}
                                >
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
    </div>
  );
}

export default RepresentativePayoutManagement;
