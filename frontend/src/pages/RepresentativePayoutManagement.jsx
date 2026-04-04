import { useEffect, useState } from "react";
import { adminRepAPI } from "../services/api";

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
  const [representatives, setRepresentatives] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [filters, setFilters] = useState({ month: "", status: "", representativeId: "" });
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => fetchPayouts(filters);

  const resetFilters = () => {
    const next = { month: "", status: "", representativeId: "" };
    setFilters(next);
    fetchPayouts(next);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const editEntry = (entry) => {
    setFormData({
      id: entry._id,
      representativeId: entry.representative?._id || "",
      monthLabel: entry.monthLabel || "",
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
      </div>

      {success && <div className="success-message" style={{ marginBottom: "12px" }}>{success}</div>}
      {error && <div className="error-message" style={{ marginBottom: "12px" }}>{error}</div>}

      <div className="premium-card" style={{ marginBottom: "16px" }}>
        <div className="premium-card-header">
          <h2>{formData.id ? "Edit Payout" : "Add Payout"}</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            <div className="form-group">
              <label>PGIR Name *</label>
              <select name="representativeId" value={formData.representativeId} onChange={handleInput} required>
                <option value="">Select representative</option>
                {representatives.map((rep) => (
                  <option key={rep._id} value={rep._id}>{rep.name} ({rep.pgirId || "-"})</option>
                ))}
              </select>
            </div>
            <div className="form-group"><label>Month *</label><input name="monthLabel" value={formData.monthLabel} onChange={handleInput} placeholder="March / March-April" required /></div>
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
            <button className="table-action-btn" style={{ background: "#324158" }} disabled={saving} type="submit">
              {saving ? "Saving..." : "Save Payout"}
            </button>
            <button className="table-action-btn" style={{ background: "#94a3b8" }} type="button" onClick={() => setFormData(emptyForm)}>
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="premium-card" style={{ marginBottom: "14px", padding: "14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Month</label>
            <input name="month" value={filters.month} onChange={handleFilterChange} placeholder="March" />
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
            <button className="table-action-btn" style={{ background: "#324158" }} onClick={applyFilters}>Apply</button>
            <button className="table-action-btn" style={{ background: "#94a3b8" }} onClick={resetFilters}>Clear</button>
          </div>
        </div>
      </div>

      <div className="premium-card">
        {loading ? (
          <div style={{ padding: "36px", textAlign: "center" }}>Loading...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table">
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
                {payouts.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: "center" }}>No payout records found</td></tr>
                ) : (
                  payouts.map((item) => (
                    <tr key={item._id}>
                      <td>{item.monthLabel}</td>
                      <td>{item.weekLabel}</td>
                      <td>{item.representative?.name || "-"}</td>
                      <td>{item.totalEnrollmentCount}</td>
                      <td>{item.studentsWith3000Paid}</td>
                      <td>{item.payoutEligible}</td>
                      <td>{item.rewardPercent}%</td>
                      <td>₹{item.payoutAmount || 0}</td>
                      <td>{item.payoutStatus}</td>
                      <td>{item.payoutReleaseDate ? new Date(item.payoutReleaseDate).toLocaleDateString("en-IN") : "-"}</td>
                      <td>
                        <button className="table-action-btn" style={{ background: "#0ea5e9" }} onClick={() => editEntry(item)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default RepresentativePayoutManagement;
