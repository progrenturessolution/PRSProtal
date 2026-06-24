import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { adminAPI } from "../services/api";

const downloadReceipt = (item) => {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment_Receipt_${item.name.replace(/\s+/g, "_")}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
          }
          .receipt-container {
            max-width: 700px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 30px;
            margin-bottom: 35px;
          }
          .company-details h1 {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 6px 0;
            letter-spacing: -0.02em;
          }
          .company-details p {
            font-size: 13px;
            color: #64748b;
            margin: 0;
          }
          .receipt-title {
            text-align: right;
          }
          .receipt-title h2 {
            font-size: 24px;
            font-weight: 800;
            color: #3b82f6;
            margin: 0 0 6px 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .receipt-title p {
            font-size: 13px;
            color: #64748b;
            margin: 0;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .details-block h3 {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin: 0 0 10px 0;
            letter-spacing: 0.05em;
          }
          .details-block p {
            font-size: 14px;
            color: #0f172a;
            margin: 0 0 6px 0;
          }
          .details-block strong {
            font-weight: 600;
            color: #0f172a;
          }
          .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .item-table th {
            background-color: #f8fafc;
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            text-align: left;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
            letter-spacing: 0.05em;
          }
          .item-table td {
            padding: 16px;
            font-size: 14px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
          }
          .item-table td.amount {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }
          .item-table th.amount {
            text-align: right;
          }
          .summary-container {
            display: flex;
            justify-content: flex-end;
          }
          .summary-table {
            width: 300px;
            border-collapse: collapse;
          }
          .summary-table td {
            padding: 10px 16px;
            font-size: 14px;
            color: #475569;
          }
          .summary-table td.amount {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }
          .summary-table tr.total {
            border-top: 2px solid #e2e8f0;
            border-bottom: 2px solid #e2e8f0;
            font-weight: 700;
          }
          .summary-table tr.total td {
            font-size: 16px;
            color: #0f172a;
            padding: 14px 16px;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #f1f5f9;
            padding-top: 24px;
            text-align: center;
          }
          .footer p {
            font-size: 12px;
            color: #94a3b8;
            margin: 0 0 6px 0;
          }
          @media print {
            body {
              padding: 0;
            }
            .receipt-container {
              border: none;
              box-shadow: none;
              padding: 0;
              max-width: 100%;
            }
            .print-btn-container {
              display: none;
            }
          }
          .print-btn-container {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
          }
          .print-btn {
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
            transition: all 0.2s;
          }
          .print-btn:hover {
            background-color: #1d4ed8;
          }
        </style>
      </head>
      <body>
        <div class="print-btn-container">
          <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        </div>
        <div class="receipt-container">
          <div class="header">
            <div class="company-details">
              <h1>Progrentures Solution Pvt. Ltd.</h1>
              <p>Industrial Training & IT Development Center</p>
              <p>Email: contact@progrentures.com</p>
            </div>
            <div class="receipt-title">
              <h2>RECEIPT</h2>
              <p>Receipt No: REC-${item._id.substring(item._id.length - 6).toUpperCase()}</p>
              <p>Date: ${new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          
          <div class="details-grid">
            <div class="details-block">
              <h3>Billed To:</h3>
              <p><strong>${item.name}</strong></p>
              <p>Role: ${item.role}</p>
            </div>
            <div class="details-block" style="text-align: right;">
              <h3>Payment Status:</h3>
              <p><strong>${(item.paymentGoal - item.payment <= 0) ? "FULLY PAID" : "PARTIALLY PAID"}</strong></p>
              <p>Generated By: PRS Admin Portal</p>
            </div>
          </div>
          
          <table class="item-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="amount">Goal Amount</th>
                <th class="amount">Paid Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Program Fee / Payout Goals Tracking (Role: ${item.role})</td>
                <td class="amount">₹${item.paymentGoal || 0}</td>
                <td class="amount">₹${item.payment || 0}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="summary-container">
            <table class="summary-table">
              <tr>
                <td>Total Goal:</td>
                <td class="amount">₹${item.paymentGoal || 0}</td>
              </tr>
              <tr>
                <td>Amount Received:</td>
                <td class="amount">₹${item.payment || 0}</td>
              </tr>
              <tr class="total">
                <td>Pending Balance:</td>
                <td class="amount">₹${(item.paymentGoal - item.payment) || 0}</td>
              </tr>
            </table>
          </div>
          
          <div class="footer">
            <p>Thank you for your transaction with Progrentures Solution Pvt. Ltd.</p>
            <p>This is a computer-generated document. No physical signature is required.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
};



const emptyForm = {
  id: "",
  name: "",
  role: "",
  paymentGoal: "0",
  payment: "0",
  pendingPayment: "0",
  receiveDate: "",
  sendDate: "",
};

function PaymentManagement() {
  const [activeTab, setActiveTab] = useState("list");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [goalSelectValue, setGoalSelectValue] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminAPI.getAdminPayments();
      if (res.data.success) {
        setPayments(res.data.payments || []);
      } else {
        setError("Failed to load payment records");
      }
    } catch (err) {
      console.error("Payment fetch error:", err);
      setError("Failed to load payment records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
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

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      
      if (name === "paymentGoal" || name === "payment") {
        const goal = Number(next.paymentGoal) || 0;
        const paid = Number(next.payment) || 0;
        next.pendingPayment = String(goal - paid);
      }
      
      return next;
    });
  };

  const handleGoalSelect = (e) => {
    const val = e.target.value;
    setGoalSelectValue(val);
    if (val !== "custom") {
      setFormData((prev) => {
        const goal = Number(val) || 0;
        const paid = Number(prev.payment) || 0;
        return {
          ...prev,
          paymentGoal: val || "0",
          pendingPayment: String(goal - paid)
        };
      });
    }
  };

  const getFilteredPayments = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return payments;

    return payments.filter((item) => {
      const name = item.name || "";
      const role = item.role || "";
      return (
        name.toLowerCase().includes(query) ||
        role.toLowerCase().includes(query)
      );
    });
  };

  const editEntry = (entry) => {
    const goalVal = entry.paymentGoal || 0;
    const isStandard = [3000, 5000, 6000, 8000, 10000, 12000, 15000, 20000, 25000].includes(Number(goalVal));
    setGoalSelectValue(goalVal ? (isStandard ? String(goalVal) : "custom") : "");

    setFormData({
      id: entry._id,
      name: entry.name || "",
      role: entry.role || "",
      paymentGoal: String(goalVal),
      payment: String(entry.payment || 0),
      pendingPayment: String(goalVal - (entry.payment || 0)),
      receiveDate: entry.receiveDate ? new Date(entry.receiveDate).toISOString().slice(0, 10) : "",
      sendDate: entry.sendDate ? new Date(entry.sendDate).toISOString().slice(0, 10) : "",
    });
    setActiveTab("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const res = await adminAPI.deleteAdminPayment(id);
      if (res.data.success) {
        setSuccess("Payment record deleted successfully");
        fetchPayments();
      } else {
        setError("Failed to delete payment record");
      }
    } catch (err) {
      console.error("Delete payment error:", err);
      setError("Failed to delete payment record");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.role) {
      setError("Name and Role are required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        role: formData.role,
        paymentGoal: Number(formData.paymentGoal) || 0,
        payment: Number(formData.payment) || 0,
        receiveDate: formData.receiveDate || null,
        sendDate: formData.sendDate || null,
      };

      if (formData.id) {
        const res = await adminAPI.updateAdminPayment(formData.id, payload);
        if (res.data.success) {
          setSuccess("Payment record updated successfully");
          setActiveTab("list");
          setFormData(emptyForm);
          setGoalSelectValue("");
          fetchPayments();
        } else {
          setError(res.data.message || "Failed to update payment");
        }
      } else {
        const res = await adminAPI.createAdminPayment(payload);
        if (res.data.success) {
          setSuccess("Payment record created successfully");
          setActiveTab("list");
          setFormData(emptyForm);
          setGoalSelectValue("");
          fetchPayments();
        } else {
          setError(res.data.message || "Failed to create payment");
        }
      }
    } catch (err) {
      console.error("Payment save error:", err);
      setError(err.response?.data?.message || "Failed to save payment record");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="premium-page-header">
        <div className="header-left">
          <h1>Payment Management</h1>
          <p className="header-subtitle">Manage payment goals, amounts received, pending payments, and dates.</p>
        </div>
        <div className="header-right">
          {activeTab === "form" ? (
            <button
              type="button"
              onClick={() => {
                setFormData(emptyForm);
                setGoalSelectValue("");
                setActiveTab("list");
              }}
              style={{
                padding: "10px 18px",
                border: "none",
                borderRadius: "10px",
                background: "#324158",
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
                background: "#324158",
                color: "#fff",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Add Payment
            </button>
          )}
        </div>
      </div>

      {success && <div className="success-message" style={{ marginBottom: "12px" }}>{success}</div>}
      {error && <div className="error-message" style={{ marginBottom: "12px" }}>{error}</div>}

      {activeTab === "form" ? (
        <div className="premium-card" style={{ marginBottom: "16px" }}>
          <div className="premium-card-header">
            <h2>{formData.id ? "Edit Payment Record" : "Add Payment Record"}</h2>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInput}
                  placeholder="Enter name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInput}
                  placeholder="Enter role (e.g. Intern, Representative)"
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Goal (₹) *</label>
                <select
                  value={goalSelectValue}
                  onChange={handleGoalSelect}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "white",
                    color: "#0f172a"
                  }}
                  required
                >
                  <option value="">Select goal amount</option>
                  {[3000, 5000, 6000, 8000, 10000, 12000, 15000, 20000, 25000].map((g) => (
                    <option key={g} value={g}>₹{g}</option>
                  ))}
                  <option value="custom">Custom Amount...</option>
                </select>

                {goalSelectValue === "custom" && (
                  <input
                    type="number"
                    min="0"
                    name="paymentGoal"
                    value={formData.paymentGoal}
                    onChange={handleInput}
                    placeholder="Enter custom goal amount"
                    style={{ marginTop: "8px" }}
                    required
                  />
                )}
              </div>
              <div className="form-group">
                <label>Payment (₹)</label>
                <input
                  type="number"
                  min="0"
                  name="payment"
                  value={formData.payment}
                  onChange={handleInput}
                  placeholder="Enter paid amount"
                />
              </div>
              <div className="form-group">
                <label>Pending Payment (₹)</label>
                <input
                  type="number"
                  name="pendingPayment"
                  value={formData.pendingPayment}
                  readOnly
                  disabled
                  style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                />
              </div>
              <div className="form-group">
                <label>Receive Date</label>
                <input
                  type="date"
                  name="receiveDate"
                  value={formData.receiveDate}
                  onChange={handleInput}
                />
              </div>
              <div className="form-group">
                <label>Send Date</label>
                <input
                  type="date"
                  name="sendDate"
                  value={formData.sendDate}
                  onChange={handleInput}
                />
              </div>
            </div>
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button className="table-action-btn rep-form-submit-btn" disabled={saving} type="submit">
                {saving ? "Saving..." : "Save Payment"}
              </button>
              <button
                className="table-action-btn rep-form-cancel-btn"
                type="button"
                onClick={() => {
                  setFormData(emptyForm);
                  setGoalSelectValue("");
                  setActiveTab("list");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="premium-card" style={{ marginBottom: "14px", padding: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Search Payments</label>
                <input
                  type="text"
                  placeholder="Search by Name or Role"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="premium-card">
            {loading ? (
              <div style={{ padding: "36px", textAlign: "center" }}>Loading...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table view-students-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Payment Goal</th>
                      <th>Payment</th>
                      <th>Pending Payment</th>
                      <th>Receive Date</th>
                      <th>Send Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredPayments().length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center" }}>No payment records found</td>
                      </tr>
                    ) : (
                      getFilteredPayments().map((item) => (
                        <tr key={item._id}>
                          <td style={{ fontWeight: "600" }}>{item.name}</td>
                          <td>{item.role}</td>
                          <td>₹{item.paymentGoal || 0}</td>
                          <td>₹{item.payment || 0}</td>
                          <td style={{ color: (item.pendingPayment > 0) ? "#ef4444" : "#10b981", fontWeight: "600" }}>
                            ₹{item.pendingPayment || 0}
                          </td>
                          <td>{item.receiveDate ? new Date(item.receiveDate).toLocaleDateString("en-IN") : "-"}</td>
                          <td>{item.sendDate ? new Date(item.sendDate).toLocaleDateString("en-IN") : "-"}</td>
                          <td style={{ position: "relative" }}>
                            <button
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
                                      display: "block",
                                    }}
                                    onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                                    onMouseLeave={(e) => (e.target.style.background = "white")}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      downloadReceipt(item);
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
                                      display: "block",
                                      borderTop: "1px solid #f1f5f9"
                                    }}
                                    onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                                    onMouseLeave={(e) => (e.target.style.background = "white")}
                                  >
                                    Download Receipt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDelete(item._id);
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
                                      color: "#ef4444",
                                      display: "block",
                                      borderTop: "1px solid #f1f5f9"
                                    }}
                                    onMouseEnter={(e) => (e.target.style.background = "#fee2e2")}
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
    </div>
  );
}

export default PaymentManagement;
