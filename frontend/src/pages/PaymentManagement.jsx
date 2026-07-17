import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { adminAPI } from "../services/api";
import logo from "../assets/logo.png";

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
            color: #000000;
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
              <p><strong>${item.paymentGoal || "Pending"}</strong></p>
              <p>Generated By: PRS Admin Portal</p>
            </div>
          </div>
          
          <table class="item-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="amount">Goal Status</th>
                <th class="amount">Paid Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Program Fee / Payout Goals Tracking (Role: ${item.role})</td>
                <td class="amount">${item.paymentGoal || "Pending"}</td>
                <td class="amount">₹${item.payment || 0}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="summary-container">
            <table class="summary-table">
              <tr>
                <td>Status:</td>
                <td class="amount">${item.paymentGoal || "Pending"}</td>
              </tr>
              <tr>
                <td>Amount Received:</td>
                <td class="amount">₹${item.payment || 0}</td>
              </tr>
              <tr class="total">
                <td>Pending Balance:</td>
                <td class="amount">₹${item.pendingPayment || 0}</td>
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
  paymentGoal: "Pending",
  payment: "0",
  pendingPayment: "0",
  receiveDate: "",
  sendDate: "",
  connectedBy: "",
  paymentType: "Receive",
  totalPayment: "0",
  firstPayment: "0",
  firstPaymentSendDate: "",
  firstPaymentReceiveDate: "",
  secondPayment: "0",
  secondPaymentSendDate: "",
  secondPaymentReceiveDate: "",
  finalPayment: "0",
  finalPaymentSendDate: "",
  finalPaymentReceiveDate: "",
};



function PaymentManagement() {
  const [activeTab, setActiveTab] = useState("list");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });
  const [payments, setPayments] = useState([]);
  const [deletedPayments, setDeletedPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [loadingDeletedPayments, setLoadingDeletedPayments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minAmountFilter, setMinAmountFilter] = useState("");
  const [maxAmountFilter, setMaxAmountFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState(null);
  const [isCustomPayType, setIsCustomPayType] = useState(false);

  const [notes, setNotes] = useState([]);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [searchTermNotes, setSearchTermNotes] = useState("");



  // Editing notes state
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingText, setEditingText] = useState("");

  const NOTE_COLORS = [
    { name: "Theme", bg: "#324158", border: "#1f2937", text: "#ffffff" },
    { name: "Yellow", bg: "#fef08a", border: "#facc15", text: "#854d0e" },
    { name: "Pink", bg: "#fbcfe8", border: "#f472b6", text: "#9d174d" },
    { name: "Green", bg: "#bbf7d0", border: "#4ade80", text: "#166534" },
    { name: "Blue", bg: "#bfdbfe", border: "#60a5fa", text: "#1e40af" },
    { name: "Orange", bg: "#fed7aa", border: "#fb923c", text: "#9a3412" },
    { name: "Purple", bg: "#e9d5ff", border: "#c084fc", text: "#6b21a8" },
    { name: "Red", bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
    { name: "Teal", bg: "#ccfbf1", border: "#5eead4", text: "#115e59" },
    { name: "Indigo", bg: "#e0e7ff", border: "#a5b4fc", text: "#3730a3" },
    { name: "Slate", bg: "#e2e8f0", border: "#cbd5e1", text: "#1e293b" }
  ];

  const fetchNotes = async () => {
    try {
      const res = await adminAPI.getPaymentNotes();
      if (res.data.success) {
        setNotes(res.data.notes);
      }
    } catch (err) {
      console.error("Failed to fetch payment notes:", err);
    }
  };



  const handleUpdateNoteColor = async (id, colorBg) => {
    const matchedColor = NOTE_COLORS.find(c => c.bg === colorBg) || NOTE_COLORS[0];
    try {
      const res = await adminAPI.updatePaymentNote(id, {
        color: matchedColor.bg,
        textColor: matchedColor.text,
        borderColor: matchedColor.border
      });
      if (res.data.success) {
        setNotes((prevNotes) =>
          prevNotes.map((n) => (n._id === id ? res.data.note : n))
        );
      }
    } catch (err) {
      console.error("Failed to update note color:", err);
    }
  };

  const handleTogglePin = async (note) => {
    try {
      const res = await adminAPI.updatePaymentNote(note._id, {
        isPinned: !note.isPinned
      });
      if (res.data.success) {
        setNotes((prevNotes) =>
          prevNotes.map((n) => (n._id === note._id ? res.data.note : n))
        );
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note._id);
    setEditingTitle(note.title);
    setEditingText(note.text);
  };

  const handleSaveEdit = async (id) => {
    const editor = document.getElementById(`note-editor-${id}`);
    const content = editor ? editor.innerHTML : "";
    try {
      const res = await adminAPI.updatePaymentNote(id, {
        title: editingTitle.trim() || "Untitled Note",
        text: content
      });
      if (res.data.success) {
        setNotes((prevNotes) =>
          prevNotes.map((n) => (n._id === id ? res.data.note : n))
        );
        setEditingNoteId(null);
      }
    } catch (err) {
      console.error("Failed to update note:", err);
      alert("Failed to save changes. Please try again.");
    }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        const res = await adminAPI.deletePaymentNote(id);
        if (res.data.success) {
          setNotes((prevNotes) => prevNotes.filter((note) => note._id !== id));
        }
      } catch (err) {
        console.error("Failed to delete note:", err);
        alert("Failed to delete note. Please try again.");
      }
    }
  };

  useEffect(() => {
    const total = Number(formData.totalPayment) || 0;
    const first = Number(formData.firstPayment) || 0;
    const second = Number(formData.secondPayment) || 0;
    const final = Number(formData.finalPayment) || 0;
    const pending = total - (first + second + final);
    setFormData((prev) => ({
      ...prev,
      pendingPayment: String(pending),
      payment: String(first + second + final)
    }));
  }, [formData.totalPayment, formData.firstPayment, formData.secondPayment, formData.finalPayment]);

  const getUniquePaymentMonths = () => {
    const months = {};
    payments.forEach((item) => {
      const datesToCheck = [
        item.receiveDate, 
        item.sendDate,
        item.firstPaymentReceiveDate, 
        item.firstPaymentSendDate,
        item.secondPaymentReceiveDate,
        item.secondPaymentSendDate,
        item.finalPaymentReceiveDate,
        item.finalPaymentSendDate
      ].filter(Boolean);
      datesToCheck.forEach((dStr) => {
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
          months[key] = { key, label, year: d.getFullYear(), monthIndex: d.getMonth() };
        }
      });
    });
    return Object.values(months).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthIndex - a.monthIndex;
    });
  };

  const calculateMonthlyData = () => {
    const monthlyGroups = {};

    const getMonthGroup = (dateStr) => {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return null;
      const year = dateObj.getFullYear();
      const monthIndex = dateObj.getMonth();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          monthKey,
          monthName: dateObj.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
          year,
          monthIndex,
          revenue: 0,
          burnRate: 0,
          pending: 0,
        };
      }
      return monthlyGroups[monthKey];
    };

    payments.forEach((item) => {
      // 1. Process 1st Installment
      if (item.firstPaymentReceiveDate) {
        const group = getMonthGroup(item.firstPaymentReceiveDate);
        if (group) group.revenue += Number(item.firstPayment) || 0;
      }
      if (item.firstPaymentSendDate) {
        const group = getMonthGroup(item.firstPaymentSendDate);
        if (group) group.burnRate += Number(item.firstPayment) || 0;
      }

      // 2. Process 2nd Installment
      if (item.secondPaymentReceiveDate) {
        const group = getMonthGroup(item.secondPaymentReceiveDate);
        if (group) group.revenue += Number(item.secondPayment) || 0;
      }
      if (item.secondPaymentSendDate) {
        const group = getMonthGroup(item.secondPaymentSendDate);
        if (group) group.burnRate += Number(item.secondPayment) || 0;
      }

      // 3. Process Final Installment
      if (item.finalPaymentReceiveDate) {
        const group = getMonthGroup(item.finalPaymentReceiveDate);
        if (group) group.revenue += Number(item.finalPayment) || 0;
      }
      if (item.finalPaymentSendDate) {
        const group = getMonthGroup(item.finalPaymentSendDate);
        if (group) group.burnRate += Number(item.finalPayment) || 0;
      }

      // 4. Process Fallback Dates (existing simple payment records)
      if (!item.firstPaymentReceiveDate && !item.secondPaymentReceiveDate && !item.finalPaymentReceiveDate) {
        if (item.receiveDate) {
          const group = getMonthGroup(item.receiveDate);
          if (group) group.revenue += Number(item.payment) || 0;
        }
      }
      if (!item.firstPaymentSendDate && !item.secondPaymentSendDate && !item.finalPaymentSendDate) {
        if (item.sendDate) {
          const group = getMonthGroup(item.sendDate);
          if (group) group.burnRate += Number(item.payment) || 0;
        }
      }

      // 5. Attribute Pending Amount (to the month of firstPaymentReceiveDate or general receiveDate)
      // Skip pending amount for payments with status "Cancel" or "Completed"
      if (item.paymentGoal !== "Cancel" && item.paymentGoal !== "Completed") {
        const pendingDate = item.firstPaymentReceiveDate || item.receiveDate;
        if (pendingDate && (Number(item.pendingPayment) > 0)) {
          const group = getMonthGroup(pendingDate);
          if (group) group.pending += Number(item.pendingPayment) || 0;
        }
      }
    });

    // Convert to array and sort chronologically
    const sortedData = Object.values(monthlyGroups).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthIndex - b.monthIndex;
    });

    // Calculate net profits for each month
    return sortedData.map((m) => {
      const netProfitWithoutPending = m.revenue - m.burnRate;
      const netProfitWithPending = netProfitWithoutPending + m.pending;
      return {
        ...m,
        netProfitWithoutPending,
        netProfitWithPending,
      };
    });
  };

  const getTransactionsForMonth = (monthKey) => {
    return payments.filter((item) => {
      let match = false;
      const datesToCheck = [
        item.receiveDate,
        item.sendDate,
        item.firstPaymentReceiveDate,
        item.firstPaymentSendDate,
        item.secondPaymentReceiveDate,
        item.secondPaymentSendDate,
        item.finalPaymentReceiveDate,
        item.finalPaymentSendDate
      ].filter(Boolean);

      datesToCheck.forEach((dStr) => {
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (key === monthKey) match = true;
        }
      });
      return match;
    });
  };

  const downloadMonthlyReportPDF = () => {
    const mData = calculateMonthlyData();
    const totRev = mData.reduce((sum, item) => sum + item.revenue, 0);
    const totBurn = mData.reduce((sum, item) => sum + item.burnRate, 0);
    const totPend = mData.reduce((sum, item) => sum + item.pending, 0);
    const totNetWithout = totRev - totBurn;
    const totNetWith = totNetWithout + totPend;

    const isAll = selectedMonthFilter === "all";
    const selectedMonthObj = isAll ? null : mData.find(m => m.monthKey === selectedMonthFilter);

    const displayRevenue = isAll ? totRev : (selectedMonthObj ? selectedMonthObj.revenue : 0);
    const displayBurnRate = isAll ? totBurn : (selectedMonthObj ? selectedMonthObj.burnRate : 0);
    const displayPending = isAll ? totPend : (selectedMonthObj ? selectedMonthObj.pending : 0);
    const displayNetWithout = isAll ? totNetWithout : (selectedMonthObj ? selectedMonthObj.netProfitWithoutPending : 0);
    const displayNetWith = isAll ? totNetWith : (selectedMonthObj ? selectedMonthObj.netProfitWithPending : 0);

    const reportTitle = isAll 
      ? "FINANCIAL METRICS REPORT — OVERALL SUMMARY" 
      : `FINANCIAL METRICS REPORT — ${selectedMonthObj?.monthName.toUpperCase()}`;

    const printWindow = window.open("", "_blank", "width=900,height=900");

    // Generate table rows for the PDF
    const tableRowsHtml = (isAll ? mData : mData.filter(m => m.monthKey === selectedMonthFilter))
      .map((m) => `
        <tr>
          <td style="font-weight: 600; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${m.monthName}</td>
          <td style="text-align: right; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; font-variant-numeric: tabular-nums;">₹${m.revenue.toLocaleString("en-IN")}</td>
          <td style="text-align: right; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; font-variant-numeric: tabular-nums;">₹${m.burnRate.toLocaleString("en-IN")}</td>
          <td style="text-align: right; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; font-variant-numeric: tabular-nums;">₹${m.pending.toLocaleString("en-IN")}</td>
          <td style="text-align: right; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; color: ${m.netProfitWithoutPending >= 0 ? "#2563eb" : "#dc2626"};">
            ${m.netProfitWithoutPending < 0 ? "-" : ""}₹${Math.abs(m.netProfitWithoutPending).toLocaleString("en-IN")}
          </td>
          <td style="text-align: right; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; color: ${m.netProfitWithPending >= 0 ? "#2563eb" : "#dc2626"};">
            ${m.netProfitWithPending < 0 ? "-" : ""}₹${Math.abs(m.netProfitWithPending).toLocaleString("en-IN")}
          </td>
        </tr>
      `).join("");

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle.replace(/\s+/g, "_")}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
            }
            .report-container {
              max-width: 900px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 24px;
              margin-bottom: 30px;
            }
            .company-brand {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .company-logo {
              height: 60px;
              object-fit: contain;
            }
            .company-details h1 {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px 0;
              letter-spacing: -0.02em;
            }
            .company-details p {
              font-size: 12px;
              color: #64748b;
              margin: 0;
            }
            .report-meta {
              text-align: right;
            }
            .report-meta h2 {
              font-size: 14px;
              font-weight: 800;
              color: #344158;
              margin: 0 0 6px 0;
              letter-spacing: 0.05em;
            }
            .report-meta p {
              font-size: 12px;
              color: #64748b;
              margin: 0;
            }
            .report-title-section {
              text-align: center;
              margin-bottom: 30px;
            }
            .report-title-section h3 {
              font-size: 18px;
              font-weight: 800;
              color: #1e293b;
              margin: 0;
              letter-spacing: -0.01em;
              text-transform: uppercase;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 12px;
              margin-bottom: 35px;
            }
            .metric-card {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 14px;
              background-color: #ffffff;
              border-top: 3px solid #324158;
            }
            
            .metric-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 6px;
              letter-spacing: 0.05em;
            }
            .metric-value {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
              font-family: monospace;
            }
            .metric-value.neg {
              color: #dc2626;
            }
            .metric-desc {
              font-size: 9px;
              color: #94a3b8;
              margin-top: 4px;
            }
            .table-title {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
              margin: 0 0 12px 0;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 35px;
            }
            .data-table th {
              background-color: #f8fafc;
              color: #475569;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              text-align: left;
              padding: 10px 16px;
              border-bottom: 2px solid #e2e8f0;
              letter-spacing: 0.05em;
            }
            .data-table th.num { text-align: right; }
            
            .total-row {
              font-weight: 800;
            }
            .total-row td {
              border-top: 2px solid #cbd5e1;
              border-bottom: 2px solid #cbd5e1;
              padding: 14px 16px;
              font-size: 13px;
              color: #0f172a;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #f1f5f9;
              padding-top: 20px;
              text-align: center;
            }
            .footer p {
              font-size: 11px;
              color: #94a3b8;
              margin: 0 0 4px 0;
            }
            @media print {
              body {
                padding: 0;
              }
              .print-btn-container {
                display: none;
              }
            }
            .print-btn-container {
              display: flex;
              justify-content: center;
              margin-bottom: 24px;
            }
            .print-btn {
              background-color: #344158;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 14px;
              font-weight: 600;
              border-radius: 8px;
              cursor: pointer;
              box-shadow: 0 4px 6px -1px rgba(50, 65, 88, 0.2);
              transition: all 0.2s;
            }
            .print-btn:hover {
              background-color: #1e293b;
            }
          </style>
        </head>
        <body>
          <div class="print-btn-container">
            <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
          </div>
          <div class="report-container">
            <div class="header">
              <div class="company-brand">
                <img src="${logo}" alt="Progrentures Logo" class="company-logo" onerror="this.style.display='none'" />
                <div class="company-details">
                  <h1>Progrentures Solution Pvt. Ltd.</h1>
                  <p>Industrial Training & IT Development Center</p>
                  <p>Email: contact@progrentures.com</p>
                </div>
              </div>
              <div class="report-meta">
                <h2>FINANCIAL REPORT</h2>
                <p>Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p>Source: PRS Admin Portal</p>
              </div>
            </div>

            <div class="report-title-section">
              <h3>${reportTitle}</h3>
            </div>

            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">${isAll ? "Total Revenue" : "Revenue"}</div>
                <div class="metric-value">₹${displayRevenue.toLocaleString("en-IN")}</div>
                <div class="metric-desc">${isAll ? "Inflow payments received" : "Monthly inflow received"}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">${isAll ? "Total Burn" : "Burn Rate"}</div>
                <div class="metric-value">₹${displayBurnRate.toLocaleString("en-IN")}</div>
                <div class="metric-desc">${isAll ? "Outflow payments sent" : "Monthly outflow sent"}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">${isAll ? "Total Pending" : "Pending"}</div>
                <div class="metric-value">₹${displayPending.toLocaleString("en-IN")}</div>
                <div class="metric-desc">${isAll ? "Unpaid balances" : "Monthly unpaid balance"}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Net Profit (Excl.)</div>
                <div class="metric-value">
                  ${displayNetWithout < 0 ? "-" : ""}₹${Math.abs(displayNetWithout).toLocaleString("en-IN")}
                </div>
                <div class="metric-desc">Revenue minus Burn Rate</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Net Profit (Incl.)</div>
                <div class="metric-value">
                  ${displayNetWith < 0 ? "-" : ""}₹${Math.abs(displayNetWith).toLocaleString("en-IN")}
                </div>
                <div class="metric-desc">Adjusted with pending</div>
              </div>
            </div>

            <h4 class="table-title">Aggregated Monthly Summary</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th class="num">Revenue</th>
                  <th class="num">Burn Rate</th>
                  <th class="num">Pending</th>
                  <th class="num">Net Profit (Excl. Pending)</th>
                  <th class="num">Net Profit (Incl. Pending)</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
                <tr class="total-row">
                  <td>TOTAL</td>
                  <td style="text-align: right;">₹${displayRevenue.toLocaleString("en-IN")}</td>
                  <td style="text-align: right;">₹${displayBurnRate.toLocaleString("en-IN")}</td>
                  <td style="text-align: right;">₹${displayPending.toLocaleString("en-IN")}</td>
                  <td style="text-align: right;">
                    ${displayNetWithout < 0 ? "-" : ""}₹${Math.abs(displayNetWithout).toLocaleString("en-IN")}
                  </td>
                  <td style="text-align: right;">
                    ${displayNetWith < 0 ? "-" : ""}₹${Math.abs(displayNetWith).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
              <p>Progrentures Solution Pvt. Ltd. — Internal Financial Record</p>
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

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const renderMonthlyGraph = (displayRevenue, displayBurnRate, displayPending, displayNetWithout, displayNetWith, isAll) => {
    const data = [
      { label: isAll ? "Total Revenue" : "Revenue", value: displayRevenue, desc: isAll ? "Inflow payments received" : "Monthly inflow received", color1: "#324158", color2: "#1e293b" },
      { label: isAll ? "Total Burn Rate" : "Burn Rate", value: displayBurnRate, desc: isAll ? "Outflow payments sent" : "Monthly outflow sent", color1: "rgba(50, 65, 88, 0.75)", color2: "rgba(30, 41, 59, 0.75)" },
      { label: isAll ? "Total Pending" : "Pending", value: displayPending, desc: isAll ? "Unpaid balances" : "Monthly unpaid balance", color1: "rgba(50, 65, 88, 0.45)", color2: "rgba(30, 41, 59, 0.45)" },
      { label: "Net Profit (Excl. Pending)", value: displayNetWithout, desc: "Revenue minus Burn Rate", 
        color1: displayNetWithout >= 0 ? "#324158" : "#ef4444", color2: displayNetWithout >= 0 ? "#1e293b" : "#b91c1c" },
      { label: "Net Profit (Incl. Pending)", value: displayNetWith, desc: "Adjusted with pending balance", 
        color1: displayNetWith >= 0 ? "#324158" : "#ef4444", color2: displayNetWith >= 0 ? "#1e293b" : "#b91c1c" },
    ];

    const values = data.map(d => d.value);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 100);
    const absMax = maxValue - minValue;

    const chartHeight = 220;
    const chartWidth = 700;
    const padding = 30;

    const graphHeightRange = chartHeight - padding * 2;
    const zeroY = padding + (maxValue / (absMax || 1)) * graphHeightRange;

    return (
      <div className="premium-card" style={{ padding: "24px", marginBottom: "20px" }}>
        <div className="premium-card-header" style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          borderBottom: "1px solid #f1f5f9", 
          paddingBottom: "12px", 
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            Financial Metrics Visualization (Graph)
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                fontWeight: "500",
                background: "#fff",
                color: "#0f172a",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">All Months (Summary)</option>
              {calculateMonthlyData().map((m) => (
                <option key={m.monthKey} value={m.monthKey}>{m.monthName}</option>
              ))}
            </select>
            <button
              onClick={downloadMonthlyReportPDF}
              style={{
                padding: "8px 14px",
                border: "none",
                borderRadius: "6px",
                background: "#344158",
                color: "#fff",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
        
        <div style={{ display: "flex", justifyContent: "center", width: "100%", overflowX: "auto" }}>
          <div style={{ minWidth: "650px", position: "relative" }}>
            <svg width="100%" height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} style={{ overflow: "visible" }}>
              <defs>
                {data.map((d, idx) => (
                  <linearGradient key={idx} id={`bar-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={d.color1} />
                    <stop offset="100%" stopColor={d.color2} />
                  </linearGradient>
                ))}
              </defs>

              {/* Y-axis helper grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = padding + ratio * graphHeightRange;
                const val = maxValue - ratio * absMax;
                return (
                  <g key={idx}>
                    <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                    <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="10px" fill="#94a3b8" fontFamily="monospace">
                      ₹{Math.round(val).toLocaleString("en-IN")}
                    </text>
                  </g>
                );
              })}

              {/* Zero Line */}
              <line x1={padding} y1={zeroY} x2={chartWidth - padding} y2={zeroY} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Render Bars */}
              {data.map((d, idx) => {
                const numBars = data.length;
                const barSpacing = (chartWidth - padding * 2) / numBars;
                const barWidth = 60;
                const x = padding + idx * barSpacing + (barSpacing - barWidth) / 2;

                const valY = zeroY - (d.value / (absMax || 1)) * graphHeightRange;
                
                let y, height;
                if (d.value >= 0) {
                  y = valY;
                  height = zeroY - valY;
                } else {
                  y = zeroY;
                  height = valY - zeroY;
                }

                const displayHeight = Math.max(height, d.value !== 0 ? 2 : 0);

                return (
                  <g key={idx}>
                    {/* Main Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={displayHeight}
                      rx="4"
                      fill={`url(#bar-grad-${idx})`}
                      style={{ transition: "all 0.3s ease-in-out" }}
                    />

                    {/* Value Label */}
                    <text
                      x={x + barWidth / 2}
                      y={d.value >= 0 ? y - 8 : y + displayHeight + 16}
                      textAnchor="middle"
                      fontSize="11px"
                      fontWeight="700"
                      fill={d.value >= 0 ? "#1e293b" : "#ef4444"}
                      fontFamily="monospace"
                    >
                      ₹{d.value.toLocaleString("en-IN")}
                    </text>

                    {/* X-axis labels */}
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight + 15}
                      textAnchor="middle"
                      fontSize="11px"
                      fontWeight="600"
                      fill="#475569"
                    >
                      {d.label}
                    </text>
                    
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight + 28}
                      textAnchor="middle"
                      fontSize="9px"
                      fill="#94a3b8"
                    >
                      {d.desc}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    );
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminAPI.getAdminPayments();
      if (res.data.success) {
        const sortedPayments = [...(res.data.payments || [])].sort((a, b) => {
          const createdAtA = new Date(a?.createdAt || 0).getTime();
          const createdAtB = new Date(b?.createdAt || 0).getTime();

          if (createdAtA !== createdAtB) {
            return createdAtB - createdAtA;
          }

          return String(b?._id || "").localeCompare(String(a?._id || ""));
        });

        setPayments(sortedPayments);
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

  const fetchDeletedPayments = async () => {
    try {
      setLoadingDeletedPayments(true);
      const res = await adminAPI.getDeletedAdminPayments();
      if (res.data.success) {
        setDeletedPayments(res.data.payments || []);
      }
    } catch (err) {
      console.error("Deleted payment fetch error:", err);
    } finally {
      setLoadingDeletedPayments(false);
    }
  };

  const refreshPaymentViews = async () => {
    await Promise.all([fetchPayments(), fetchDeletedPayments()]);
  };

  useEffect(() => {
    fetchPayments();
    fetchDeletedPayments();
    fetchNotes();
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getFilteredPayments = () => {
    let filtered = payments;

    // 1. Text Search Filter (Name / Role / Connected By / Payment Type)
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((item) => {
        const name = item.name || "";
        const role = item.role || "";
        const connectedBy = item.connectedBy || "";
        const paymentType = item.paymentType || "";
        return (
          name.toLowerCase().includes(query) ||
          role.toLowerCase().includes(query) ||
          connectedBy.toLowerCase().includes(query) ||
          paymentType.toLowerCase().includes(query)
        );
      });
    }

    // 2. Status Filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.paymentGoal === statusFilter);
    }

    // 3. Amount Filters (based on total paid amount `payment`)
    if (minAmountFilter !== "") {
      const minVal = Number(minAmountFilter);
      if (!isNaN(minVal)) {
        filtered = filtered.filter((item) => (item.payment || 0) >= minVal);
      }
    }
    if (maxAmountFilter !== "") {
      const maxVal = Number(maxAmountFilter);
      if (!isNaN(maxVal)) {
        filtered = filtered.filter((item) => (item.payment || 0) <= maxVal);
      }
    }

    // 4. Month Filter
    if (monthFilter !== "all") {
      filtered = filtered.filter((item) => {
        let match = false;
        const datesToCheck = [
          item.receiveDate, 
          item.sendDate,
          item.firstPaymentReceiveDate, 
          item.firstPaymentSendDate,
          item.secondPaymentReceiveDate,
          item.secondPaymentSendDate,
          item.finalPaymentReceiveDate,
          item.finalPaymentSendDate
        ].filter(Boolean);
        datesToCheck.forEach((dStr) => {
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (key === monthFilter) match = true;
          }
        });
        return match;
      });
    }

    return filtered;
  };

  const getRelevantDate = (item) => {
    // Collect all possible dates
    const allDates = [
      { date: item.finalPaymentReceiveDate, type: 'receive' },
      { date: item.finalPaymentSendDate, type: 'send' },
      { date: item.secondPaymentReceiveDate, type: 'receive' },
      { date: item.secondPaymentSendDate, type: 'send' },
      { date: item.firstPaymentReceiveDate, type: 'receive' },
      { date: item.firstPaymentSendDate, type: 'send' },
      { date: item.receiveDate, type: 'receive' },
      { date: item.sendDate, type: 'send' },
    ].filter(x => x.date);

    if (allDates.length === 0) return null;

    // Sort by date descending (newest first)
    allDates.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // If payment type is Receive, prioritize receive dates; if Send, prioritize send dates
    if (item.paymentType === 'Receive') {
      const receiveDate = allDates.find(d => d.type === 'receive');
      return receiveDate ? receiveDate.date : allDates[0].date;
    } else if (item.paymentType === 'Send') {
      const sendDate = allDates.find(d => d.type === 'send');
      return sendDate ? sendDate.date : allDates[0].date;
    }

    // Otherwise, just return the newest date
    return allDates[0].date;
  };

  const editEntry = (entry) => {
    const goalVal = entry.paymentGoal || "Pending";
    const payType = entry.paymentType || "Receive";
    setIsCustomPayType(payType !== "Send" && payType !== "Receive");

    setFormData({
      id: entry._id,
      name: entry.name || "",
      role: entry.role || "",
      paymentGoal: String(goalVal),
      payment: String(entry.payment || 0),
      pendingPayment: String(entry.pendingPayment || 0),
      receiveDate: entry.receiveDate ? new Date(entry.receiveDate).toISOString().slice(0, 10) : "",
      sendDate: entry.sendDate ? new Date(entry.sendDate).toISOString().slice(0, 10) : "",
      connectedBy: entry.connectedBy || "",
      paymentType: entry.paymentType || "Receive",
      totalPayment: String(entry.totalPayment || 0),
      firstPayment: String(entry.firstPayment || 0),
      firstPaymentSendDate: entry.firstPaymentSendDate ? new Date(entry.firstPaymentSendDate).toISOString().slice(0, 10) : "",
      firstPaymentReceiveDate: entry.firstPaymentReceiveDate ? new Date(entry.firstPaymentReceiveDate).toISOString().slice(0, 10) : "",
      secondPayment: String(entry.secondPayment || 0),
      secondPaymentSendDate: entry.secondPaymentSendDate ? new Date(entry.secondPaymentSendDate).toISOString().slice(0, 10) : "",
      secondPaymentReceiveDate: entry.secondPaymentReceiveDate ? new Date(entry.secondPaymentReceiveDate).toISOString().slice(0, 10) : "",
      finalPayment: String(entry.finalPayment || 0),
      finalPaymentSendDate: entry.finalPaymentSendDate ? new Date(entry.finalPaymentSendDate).toISOString().slice(0, 10) : "",
      finalPaymentReceiveDate: entry.finalPaymentReceiveDate ? new Date(entry.finalPaymentReceiveDate).toISOString().slice(0, 10) : "",
    });
    setActiveTab("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to move this payment record to recycle bin?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const res = await adminAPI.deleteAdminPayment(id);
      if (res.data.success) {
        setSuccess("Payment record moved to recycle bin successfully");
        await refreshPaymentViews();
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

  const handleRestorePayment = async (id) => {
    try {
      setLoadingDeletedPayments(true);
      setError("");
      setSuccess("");
      const res = await adminAPI.restoreAdminPayment(id);
      if (res.data.success) {
        setSuccess("Payment record restored successfully");
        await refreshPaymentViews();
      } else {
        setError("Failed to restore payment record");
      }
    } catch (err) {
      console.error("Restore payment error:", err);
      setError(err.response?.data?.message || "Failed to restore payment record");
    } finally {
      setLoadingDeletedPayments(false);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("This payment will be permanently deleted. Do you want to continue?")) {
      return;
    }

    try {
      setLoadingDeletedPayments(true);
      setError("");
      setSuccess("");
      const res = await adminAPI.permanentlyDeleteAdminPayment(id);
      if (res.data.success) {
        setSuccess("Payment record permanently deleted");
        await refreshPaymentViews();
      } else {
        setError("Failed to permanently delete payment record");
      }
    } catch (err) {
      console.error("Permanent delete payment error:", err);
      setError(err.response?.data?.message || "Failed to permanently delete payment record");
    } finally {
      setLoadingDeletedPayments(false);
    }
  };

  const getRecycleBinDaysLeft = (deletedAt) => {
    if (!deletedAt) return 0;
    const deletedTime = new Date(deletedAt).getTime();
    if (Number.isNaN(deletedTime)) return 0;
    const expiresAt = deletedTime + 5 * 24 * 60 * 60 * 1000;
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
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
        paymentGoal: formData.paymentGoal,
        connectedBy: formData.connectedBy,
        paymentType: formData.paymentType,
        totalPayment: Number(formData.totalPayment) || 0,
        firstPayment: Number(formData.firstPayment) || 0,
        firstPaymentSendDate: formData.firstPaymentSendDate || null,
        firstPaymentReceiveDate: formData.firstPaymentReceiveDate || null,
        secondPayment: Number(formData.secondPayment) || 0,
        secondPaymentSendDate: formData.secondPaymentSendDate || null,
        secondPaymentReceiveDate: formData.secondPaymentReceiveDate || null,
        finalPayment: Number(formData.finalPayment) || 0,
        finalPaymentSendDate: formData.finalPaymentSendDate || null,
        finalPaymentReceiveDate: formData.finalPaymentReceiveDate || null,
      };

      if (formData.id) {
        const res = await adminAPI.updateAdminPayment(formData.id, payload);
        if (res.data.success) {
          setSuccess("Payment record updated successfully");
          setActiveTab("list");
          setFormData(emptyForm);
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
        <div className="header-right" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {activeTab === "form" || activeTab === "report" || activeTab === "recycleBin" ? (
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
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("report");
                  setSelectedMonthFilter("all");
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
                View Monthly Report
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("recycleBin");
                  fetchDeletedPayments();
                }}
                style={{
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#475569",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                Recycle Bin
                {deletedPayments.length > 0 && (
                  <span style={{ background: "#ffffff", color: "#475569", borderRadius: "999px", padding: "2px 8px", fontSize: "11px", fontWeight: "700" }}>
                    {deletedPayments.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowNotesDrawer(true)}
                style={{
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#324158",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Note {notes.length > 0 && <span style={{ background: "#ffffff", color: "#324158", borderRadius: "50%", padding: "2px 6px", fontSize: "11px", fontWeight: "bold" }}>{notes.length}</span>}
              </button>
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
                Add Payment
              </button>
            </>
          )}
        </div>
      </div>

      {success && <div className="success-message" style={{ marginBottom: "12px" }}>{success}</div>}
      {error && <div className="error-message" style={{ marginBottom: "12px" }}>{error}</div>}

      {activeTab === "report" ? (
        <div>
          {/* Dynamic Summary Chart (Graph) & Table */}
          {(() => {
            const mData = calculateMonthlyData();
            const totRev = mData.reduce((sum, item) => sum + item.revenue, 0);
            const totBurn = mData.reduce((sum, item) => sum + item.burnRate, 0);
            const totPend = mData.reduce((sum, item) => sum + item.pending, 0);
            const totNetWithout = totRev - totBurn;
            const totNetWith = totNetWithout + totPend;

            const isAll = selectedMonthFilter === "all";
            const selectedMonthObj = isAll ? null : mData.find(m => m.monthKey === selectedMonthFilter);

            const displayRevenue = isAll ? totRev : (selectedMonthObj ? selectedMonthObj.revenue : 0);
            const displayBurnRate = isAll ? totBurn : (selectedMonthObj ? selectedMonthObj.burnRate : 0);
            const displayPending = isAll ? totPend : (selectedMonthObj ? selectedMonthObj.pending : 0);
            const displayNetWithout = isAll ? totNetWithout : (selectedMonthObj ? selectedMonthObj.netProfitWithoutPending : 0);
            const displayNetWith = isAll ? totNetWith : (selectedMonthObj ? selectedMonthObj.netProfitWithPending : 0);

            return (
              <>
                {/* Visual Graph instead of simple stats cards */}
                {renderMonthlyGraph(displayRevenue, displayBurnRate, displayPending, displayNetWithout, displayNetWith, isAll)}

                {/* Report Table Card */}
                <div className="premium-card" style={{ padding: "20px", marginBottom: "20px" }}>
                  <div className="premium-card-header" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                      {isAll ? "Monthly Aggregated Summary" : `Monthly Summary — ${selectedMonthObj?.monthName}`}
                    </h2>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table view-students-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th style={{ textAlign: "right" }}>Revenue (₹)</th>
                          <th style={{ textAlign: "right" }}>Burn Rate (₹)</th>
                          <th style={{ textAlign: "right" }}>Pending (₹)</th>
                          <th style={{ textAlign: "right" }}>Current Net Profit without pending (₹)</th>
                          <th style={{ textAlign: "right" }}>Net Profit with pending (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isAll ? mData : mData.filter(m => m.monthKey === selectedMonthFilter)).map((m) => (
                          <tr key={m.monthKey}>
                            <td style={{ fontWeight: "600" }}>{m.monthName}</td>
                            <td style={{ textAlign: "right" }}>₹{m.revenue.toLocaleString("en-IN")}</td>
                            <td style={{ textAlign: "right" }}>₹{m.burnRate.toLocaleString("en-IN")}</td>
                            <td style={{ textAlign: "right" }}>₹{m.pending.toLocaleString("en-IN")}</td>
                            <td style={{
                              textAlign: "right", 
                              fontWeight: "600", 
                              color: m.netProfitWithoutPending >= 0 ? "#3b82f6" : "#ef4444"
                            }}>
                              {m.netProfitWithoutPending < 0 ? "-" : ""}₹{Math.abs(m.netProfitWithoutPending).toLocaleString("en-IN")}
                            </td>
                            <td style={{
                              textAlign: "right", 
                              fontWeight: "600", 
                              color: m.netProfitWithPending >= 0 ? "#3b82f6" : "#ef4444"
                            }}>
                              {m.netProfitWithPending < 0 ? "-" : ""}₹{Math.abs(m.netProfitWithPending).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                        {/* Total Row - Simple background styling, no bold */}
                        <tr style={{ backgroundColor: "#e2e8f0", color: "#1f2937" }}>
                          <td>TOTAL</td>
                          <td style={{ textAlign: "right" }}>₹{displayRevenue.toLocaleString("en-IN")}</td>
                          <td style={{ textAlign: "right" }}>₹{displayBurnRate.toLocaleString("en-IN")}</td>
                          <td style={{ textAlign: "right" }}>₹{displayPending.toLocaleString("en-IN")}</td>
                          <td style={{ textAlign: "right" }}>
                            {displayNetWithout < 0 ? "-" : ""}₹{Math.abs(displayNetWithout).toLocaleString("en-IN")}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {displayNetWith < 0 ? "-" : ""}₹{Math.abs(displayNetWith).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : activeTab === "form" ? (
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
                <label>Connected By</label>
                <input
                  type="text"
                  name="connectedBy"
                  value={formData.connectedBy}
                  onChange={handleInput}
                  placeholder="Connected by"
                />
              </div>
              <div className="form-group">
                <label>Payment Type *</label>
                <select
                  name="paymentType"
                  value={
                    formData.paymentType === "Send" || formData.paymentType === "Receive" || formData.paymentType === ""
                      ? formData.paymentType
                      : "Other"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      setIsCustomPayType(true);
                      setFormData((prev) => ({ ...prev, paymentType: "" }));
                    } else {
                      setIsCustomPayType(false);
                      setFormData((prev) => ({ ...prev, paymentType: val }));
                    }
                  }}
                  required
                >
                  <option value="Receive">Receive</option>
                  <option value="Send">Send</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {isCustomPayType && (
                <div className="form-group">
                  <label>Specify Custom Payment Type *</label>
                  <input
                    type="text"
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleInput}
                    placeholder="Enter custom payment type"
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Total Payment (₹)</label>
                <input
                  type="number"
                  min="0"
                  name="totalPayment"
                  value={formData.totalPayment}
                  onChange={handleInput}
                  placeholder="Total payment"
                />
              </div>
              
              <div className="form-group">
                <label>1st Payment (₹)</label>
                <input
                  type="number"
                  min="0"
                  name="firstPayment"
                  value={formData.firstPayment}
                  onChange={handleInput}
                  placeholder="1st Payment Amount"
                />
              </div>
              <div className="form-group">
                <label>1st Payment Send Date</label>
                <input
                  type="date"
                  name="firstPaymentSendDate"
                  value={formData.firstPaymentSendDate}
                  onChange={handleInput}
                />
              </div>
              <div className="form-group">
                <label>1st Payment Receive Date</label>
                <input
                  type="date"
                  name="firstPaymentReceiveDate"
                  value={formData.firstPaymentReceiveDate}
                  onChange={handleInput}
                />
              </div>

              <div className="form-group">
                <label>2nd Payment (₹)</label>
                <input
                  type="number"
                  min="0"
                  name="secondPayment"
                  value={formData.secondPayment}
                  onChange={handleInput}
                  placeholder="2nd Payment Amount"
                />
              </div>
              <div className="form-group">
                <label>2nd Payment Send Date</label>
                <input
                  type="date"
                  name="secondPaymentSendDate"
                  value={formData.secondPaymentSendDate}
                  onChange={handleInput}
                />
              </div>
              <div className="form-group">
                <label>2nd Payment Receive Date</label>
                <input
                  type="date"
                  name="secondPaymentReceiveDate"
                  value={formData.secondPaymentReceiveDate}
                  onChange={handleInput}
                />
              </div>

              <div className="form-group">
                <label>Last/Final Payment (₹)</label>
                <input
                  type="number"
                  min="0"
                  name="finalPayment"
                  value={formData.finalPayment}
                  onChange={handleInput}
                  placeholder="Final Payment Amount"
                />
              </div>
              <div className="form-group">
                <label>Last Payment Send Date</label>
                <input
                  type="date"
                  name="finalPaymentSendDate"
                  value={formData.finalPaymentSendDate}
                  onChange={handleInput}
                />
              </div>
              <div className="form-group">
                <label>Last Payment Receive Date</label>
                <input
                  type="date"
                  name="finalPaymentReceiveDate"
                  value={formData.finalPaymentReceiveDate}
                  onChange={handleInput}
                />
              </div>

              <div className="form-group">
                <label>Pending Payment (₹) — Auto Calculated</label>
                <input
                  type="number"
                  name="pendingPayment"
                  value={formData.pendingPayment}
                  readOnly
                  style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                />
              </div>

              <div className="form-group">
                <label>Payment Status *</label>
                <select
                  name="paymentGoal"
                  value={formData.paymentGoal}
                  onChange={handleInput}
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
                  <option value="">Select status</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Failed">Failed</option>
                  <option value="Cancel">Cancel</option>
                  <option value="Refund">Refund</option>
                </select>
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
      ) : activeTab === "recycleBin" ? (
        <div className="premium-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Recycle Bin</h2>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748b" }}>
                Deleted payments stay here for 5 days, then they are removed automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchDeletedPayments}
              style={{
                padding: "8px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#334155",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Refresh
            </button>
          </div>

          {loadingDeletedPayments ? (
            <div style={{ padding: "36px", textAlign: "center" }}>Loading recycle bin...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table view-students-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Payment Type</th>
                    <th>Date</th>
                    <th>Total Payment</th>
                    <th>Total Paid</th>
                    <th style={{ textAlign: "center" }}>Pending Payment</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th>Deleted On</th>
                    <th>Days Left</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center" }}>Recycle bin is empty</td>
                    </tr>
                  ) : (
                    deletedPayments.map((item) => {
                      const relevantDate = getRelevantDate(item);
                      return (
                      <tr key={item._id}>
                        <td style={{ fontWeight: "600" }}>{item.name}</td>
                        <td>{item.role}</td>
                        <td>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            backgroundColor: item.paymentType === "Send" ? "#fee2e2" : item.paymentType === "Receive" ? "#dcfce7" : "#f1f5f9",
                            color: item.paymentType === "Send" ? "#991b1b" : item.paymentType === "Receive" ? "#166534" : "#475569",
                            fontWeight: "600",
                            fontSize: "12px"
                          }}>
                            {item.paymentType || "Receive"}
                          </span>
                        </td>
                        <td>{relevantDate ? new Date(relevantDate).toLocaleDateString("en-IN") : "-"}</td>
                        <td>₹{item.totalPayment || 0}</td>
                        <td>₹{item.payment || 0}</td>
                        <td style={{ textAlign: "center", color: (item.paymentGoal === "Cancel" || item.paymentGoal === "Completed" || item.pendingPayment <= 0) ? "#10b981" : "#ef4444", fontWeight: "600" }}>
                          ₹{(item.paymentGoal === "Cancel" || item.paymentGoal === "Completed") ? 0 : (item.pendingPayment || 0)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "96px",
                            padding: "6px 12px",
                            borderRadius: "999px",
                            backgroundColor: "#324158",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 700,
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                            textTransform: "capitalize"
                          }}>
                            {item.paymentGoal || "Pending"}
                          </span>
                        </td>
                        <td>{item.deletedAt ? new Date(item.deletedAt).toLocaleDateString("en-IN") : "-"}</td>
                        <td>{getRecycleBinDaysLeft(item.deletedAt)} day(s)</td>
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
                                    handleRestorePayment(item._id);
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
                                    color: "#16a34a",
                                    display: "block",
                                  }}
                                  onMouseEnter={(e) => (e.target.style.background = "#dcfce7")}
                                  onMouseLeave={(e) => (e.target.style.background = "white")}
                                >
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handlePermanentDelete(item._id);
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
                                  Delete Permanently
                                </button>
                              </div>,
                              document.body
                            )
                          }
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="premium-card" style={{ marginBottom: "16px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#324158", fontWeight: 700, letterSpacing: "-0.01em" }}>Filters & Bank-Statement Query</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {/* Search text */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Search Name / Role / Connector</label>
                <input
                  type="text"
                  placeholder="e.g. Shrikant, Intern..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>
              
              {/* Status Filter */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Payment Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Failed">Failed</option>
                  <option value="Cancel">Cancel</option>
                  <option value="Refund">Refund</option>
                </select>
              </div>

              {/* Min amount */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Min Paid Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={minAmountFilter}
                  onChange={(e) => setMinAmountFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              {/* Max amount */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Max Paid Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 20000"
                  value={maxAmountFilter}
                  onChange={(e) => setMaxAmountFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              {/* Month selector */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Select Month</label>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white" }}
                >
                  <option value="all">All Months</option>
                  {getUniquePaymentMonths().map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Reset Filters button */}
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setMinAmountFilter("");
                  setMaxAmountFilter("");
                  setMonthFilter("all");
                }}
                style={{ padding: "6px 14px", border: "1px solid #324158", borderRadius: "6px", background: "transparent", color: "#324158", fontWeight: "600", fontSize: "12px", cursor: "pointer" }}
              >
                Reset Filters
              </button>
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
                      <th>Payment Type</th>
                      <th>Date</th>
                      <th>Total Payment</th>
                      <th>Total Paid</th>
                      <th style={{ textAlign: "center" }}>Pending Payment</th>
                      <th style={{ textAlign: "center" }}>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredPayments().length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center" }}>No payment records found</td>
                      </tr>
                    ) : (
                      getFilteredPayments().map((item) => {
                        const relevantDate = getRelevantDate(item);
                        return (
                        <tr key={item._id}>
                          <td style={{ fontWeight: "600" }}>{item.name}</td>
                          <td>{item.role}</td>
                          <td>
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              backgroundColor: item.paymentType === "Send" ? "#fee2e2" : item.paymentType === "Receive" ? "#dcfce7" : "#f1f5f9",
                              color: item.paymentType === "Send" ? "#991b1b" : item.paymentType === "Receive" ? "#166534" : "#475569",
                              fontWeight: "600",
                              fontSize: "12px"
                            }}>
                              {item.paymentType || "Receive"}
                            </span>
                          </td>
                          <td>{relevantDate ? new Date(relevantDate).toLocaleDateString("en-IN") : "-"}</td>
                          <td>₹{item.totalPayment || 0}</td>
                          <td>₹{item.payment || 0}</td>
                          <td style={{ textAlign: "center", color: (item.paymentGoal === "Cancel" || item.paymentGoal === "Completed" || item.pendingPayment <= 0) ? "#10b981" : "#ef4444", fontWeight: "600" }}>
                    ₹{(item.paymentGoal === "Cancel" || item.paymentGoal === "Completed") ? 0 : (item.pendingPayment || 0)}
                  </td>
                          <td style={{ textAlign: "center" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "96px",
                              padding: "6px 12px",
                              borderRadius: "999px",
                              backgroundColor: "#324158",
                              color: "#ffffff",
                              fontSize: "11px",
                              fontWeight: 700,
                              lineHeight: 1,
                              whiteSpace: "nowrap",
                              textTransform: "capitalize"
                            }}>
                              {item.paymentGoal || "Pending"}
                            </span>
                          </td>
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
                                      setSelectedPaymentDetails(item);
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
                                    View Details
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Detailed Payment View Modal */}
      {selectedPaymentDetails && createPortal(
         <div onClick={() => setSelectedPaymentDetails(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "20px" }}>
           <div onClick={(e) => e.stopPropagation()} style={{ width: "90%", maxWidth: "700px", background: "#ffffff", borderRadius: "20px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
             {/* Header */}
             <div style={{ background: "#324158", color: "#ffffff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div>
                 <div style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.7)", fontWeight: 700 }}>Payment Details</div>
                 <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>{selectedPaymentDetails.name}</h2>
               </div>
               <button
                 type="button"
                 onClick={() => setSelectedPaymentDetails(null)}
                 style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#ffffff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: "12px", height: "12px" }}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             {/* Content */}
             <div style={{ padding: "24px", overflowY: "auto" }}>
               {/* Quick Info Grid */}
               <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                 <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px" }}>
                   <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Role / Designation</div>
                   <div style={{ fontSize: "14px", fontWeight: 700, color: "#324158", marginTop: "4px" }}>{selectedPaymentDetails.role}</div>
                 </div>
                 <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px" }}>
                   <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Connected By</div>
                   <div style={{ fontSize: "14px", fontWeight: 700, color: "#324158", marginTop: "4px" }}>{selectedPaymentDetails.connectedBy || "-"}</div>
                 </div>
                 <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px" }}>
                   <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Payment Type</div>
                   <div style={{ fontSize: "14px", fontWeight: 700, color: "#324158", marginTop: "4px" }}>{selectedPaymentDetails.paymentType || "Receive"}</div>
                 </div>
               </div>

               {/* Metrics */}
               <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
                 <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", borderLeft: "4px solid #324158" }}>
                   <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>Total Payment</div>
                   <div style={{ fontSize: "18px", fontWeight: 800, color: "#324158", marginTop: "4px" }}>₹{selectedPaymentDetails.totalPayment || 0}</div>
                 </div>
                 <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", borderLeft: "4px solid #16a34a" }}>
                   <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>Total Paid</div>
                   <div style={{ fontSize: "18px", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>₹{selectedPaymentDetails.payment || 0}</div>
                 </div>
                 <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", borderLeft: `4px solid ${(selectedPaymentDetails.paymentGoal === "Cancel" || selectedPaymentDetails.paymentGoal === "Completed") ? "#16a34a" : "#dc2626"}` }}>
                   <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>Pending Amount</div>
                   <div style={{ fontSize: "18px", fontWeight: 800, color: `${(selectedPaymentDetails.paymentGoal === "Cancel" || selectedPaymentDetails.paymentGoal === "Completed") ? "#16a34a" : "#dc2626"}`, marginTop: "4px" }}>₹{(selectedPaymentDetails.paymentGoal === "Cancel" || selectedPaymentDetails.paymentGoal === "Completed") ? 0 : (selectedPaymentDetails.pendingPayment || 0)}</div>
                 </div>
               </div>

               {/* Installment Timeline */}
               <h3 style={{ margin: "0 0 12px", color: "#324158", fontSize: "14px", fontWeight: 700 }}>Installments Payment Status</h3>
               <table style={{ width: "100%", borderCollapse: "collapse" }}>
                 <thead>
                   <tr style={{ background: "#324158", color: "#ffffff", borderBottom: "1px solid #cbd5e1" }}>
                     <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "11px", textTransform: "uppercase", fontWeight: 700, backgroundColor: "#324158" }}>Installment</th>
                     <th style={{ textAlign: "right", padding: "10px 12px", fontSize: "11px", textTransform: "uppercase", fontWeight: 700, backgroundColor: "#324158" }}>Amount</th>
                     <th style={{ textAlign: "center", padding: "10px 12px", fontSize: "11px", textTransform: "uppercase", fontWeight: 700, backgroundColor: "#324158" }}>Send Date</th>
                     <th style={{ textAlign: "center", padding: "10px 12px", fontSize: "11px", textTransform: "uppercase", fontWeight: 700, backgroundColor: "#324158" }}>Receive Date</th>
                   </tr>
                 </thead>
                 <tbody>
                   {[
                     { name: "1st Installment", amount: selectedPaymentDetails.firstPayment || 0, send: selectedPaymentDetails.firstPaymentSendDate, recv: selectedPaymentDetails.firstPaymentReceiveDate },
                     { name: "2nd Installment", amount: selectedPaymentDetails.secondPayment || 0, send: selectedPaymentDetails.secondPaymentSendDate, recv: selectedPaymentDetails.secondPaymentReceiveDate },
                     { name: "Final Installment", amount: selectedPaymentDetails.finalPayment || 0, send: selectedPaymentDetails.finalPaymentSendDate, recv: selectedPaymentDetails.finalPaymentReceiveDate },
                   ].map((inst) => (
                     <tr key={inst.name} style={{ borderBottom: "1px solid #cbd5e1" }}>
                       <td style={{ padding: "12px", fontSize: "13px", fontWeight: 600, color: "#324158" }}>{inst.name}</td>
                       <td style={{ padding: "12px", fontSize: "13px", fontWeight: 700, color: "#324158", textAlign: "right" }}>₹{inst.amount}</td>
                       <td style={{ padding: "12px", fontSize: "12px", color: "#64748b", textAlign: "center" }}>{inst.send ? new Date(inst.send).toLocaleDateString("en-IN") : "-"}</td>
                       <td style={{ padding: "12px", fontSize: "12px", color: "#64748b", textAlign: "center" }}>{inst.recv ? new Date(inst.recv).toLocaleDateString("en-IN") : "-"}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>

                {/* Goal/Status Badge */}
                <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Payment Status:</span>
                  <span style={{
                    padding: "6px 16px",
                    borderRadius: "999px",
                    backgroundColor: "#324158",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "capitalize",
                  }}>
                    {selectedPaymentDetails.paymentGoal}
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
       )}

      {showNotesDrawer && createPortal(
        <>
          {/* Backdrop Overlay */}
          <div 
            className="notes-drawer-overlay"
            onClick={() => setShowNotesDrawer(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              animation: "fadeIn 0.2s ease-out"
            }}
          />

          {/* Style Injection */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .notes-drawer-container {
              position: fixed;
              right: 0;
              top: 0;
              bottom: 0;
              width: 420px;
              background-color: #f8fafc;
              box-shadow: -10px 0 30px rgba(0, 0, 0, 0.15);
              z-index: 10000;
              display: flex;
              flex-direction: column;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @media (max-width: 480px) {
              .notes-drawer-container {
                width: 100%;
              }
            }
            .notes-drawer-header {
              padding: 20px;
              border-bottom: 1px solid #e2e8f0;
              background-color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .notes-drawer-header h2 {
              margin: 0;
              font-size: 18px;
              font-weight: 700;
              color: #0f172a;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .notes-drawer-close {
              background: none;
              border: none;
              color: #64748b;
              cursor: pointer;
              padding: 4px;
              border-radius: 6px;
              transition: background-color 0.2s;
            }
            .notes-drawer-close:hover {
              background-color: #f1f5f9;
              color: #0f172a;
            }
            .notes-drawer-body {
              flex: 1;
              overflow-y: auto;
              padding: 20px;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .add-note-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;
            }
            .sticky-note-card {
              border-radius: 12px;
              padding: 16px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
              position: relative;
              transition: transform 0.2s, box-shadow 0.2s;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .sticky-note-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
            .note-card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .note-date {
              font-size: 11px;
              font-weight: 500;
              opacity: 0.8;
            }
            .note-pin-btn {
              background: none;
              border: none;
              cursor: pointer;
              opacity: 0.6;
              padding: 2px;
              transition: opacity 0.2s;
            }
            .note-pin-btn:hover {
              opacity: 1;
            }
            .note-textarea {
              width: 100%;
              min-height: 100px;
              border: none;
              background: transparent;
              resize: vertical;
              font-family: inherit;
              font-size: 14px;
              line-height: 1.5;
              color: inherit;
              padding: 0;
            }
            .note-textarea:focus {
              outline: none;
            }
            .note-card-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid rgba(0,0,0,0.06);
              padding-top: 10px;
            }
            .color-picker-row {
              display: flex;
              gap: 6px;
            }
            .color-dot {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              cursor: pointer;
              border: 1px solid rgba(0, 0, 0, 0.15);
              transition: transform 0.1s;
            }
            .color-dot:hover {
              transform: scale(1.2);
            }
            .color-dot.active {
              box-shadow: 0 0 0 2px #324158;
            }
            .note-delete-btn {
              background: none;
              border: none;
              cursor: pointer;
              color: #dc2626;
              opacity: 0.7;
              padding: 4px;
              border-radius: 6px;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .note-delete-btn:hover {
              opacity: 1;
              background-color: rgba(220, 38, 38, 0.1);
            }
            .sticky-note-card ul {
              margin: 4px 0;
              padding-left: 18px;
              list-style-type: disc;
            }
            .sticky-note-card li {
              margin-bottom: 2px;
            }
            .note-content-editor {
              width: 100%;
              padding: 8px;
              border-radius: 6px;
              border: 1px solid rgba(0,0,0,0.15);
              font-size: 13px;
              min-height: 95px;
              background-color: rgba(255,255,255,0.8);
              color: #1e293b;
              outline: none;
              overflow-y: auto;
              font-family: inherit;
              line-height: 1.5;
            }
            .note-content-editor:focus {
              border-color: rgba(0,0,0,0.3);
            }
            .note-content-editor[contenteditable]:empty::before {
              content: attr(placeholder);
              color: #94a3b8;
              font-style: italic;
              cursor: text;
            }
          `}</style>

          {/* Drawer Wrapper */}
          {/* Drawer Wrapper */}
          <div className="notes-drawer-container">
            {/* Header */}
            <div className="notes-drawer-header">
              <h2>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Sticky Notes
              </h2>
              <button 
                type="button" 
                className="notes-drawer-close"
                onClick={() => setShowNotesDrawer(false)}
                title="Close notes"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="notes-drawer-body">
              {/* Button to Create New Note */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await adminAPI.createPaymentNote({
                      title: "New Note",
                      text: "",
                      color: "#324158"
                    });
                    if (res.data.success) {
                      const createdNote = res.data.note;
                      setNotes([createdNote, ...notes]);
                      // Automatically select and edit this new note
                      startEditing(createdNote);
                    }
                  } catch (err) {
                    console.error("Failed to create note:", err);
                    alert("Failed to create note. Please try again.");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#324158",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 2px 4px rgba(50, 65, 88, 0.15)",
                  transition: "background 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "#243042"}
                onMouseOut={(e) => e.currentTarget.style.background = "#324158"}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create Sticky Note
              </button>

              <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "8px 0" }} />

              {/* Search bar for existing notes */}
              <div className="add-note-bar">
                <input 
                  type="text" 
                  placeholder="Search notes..." 
                  value={searchTermNotes}
                  onChange={(e) => setSearchTermNotes(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    width: "100%",
                    outline: "none",
                    color: "#1e293b"
                  }}
                />
              </div>

              {/* Note Cards List */}
              {notes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24" style={{ margin: "0 auto 12px", opacity: 0.5 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>No notes saved yet.</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.8 }}>Use the form above to add a note that will sync across devices.</p>
                </div>
              ) : (
                (() => {
                  const filteredNotes = notes.filter(n => 
                    (n.title && n.title.toLowerCase().includes(searchTermNotes.toLowerCase())) ||
                    (n.text && n.text.toLowerCase().includes(searchTermNotes.toLowerCase()))
                  );

                  const sortedNotes = [...filteredNotes].sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return 0;
                  });

                  if (sortedNotes.length === 0) {
                    return (
                      <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "13px" }}>
                        No matching notes found.
                      </div>
                    );
                  }

                  return sortedNotes.map((note) => {
                    const isEditing = editingNoteId === note._id;
                    const displayDate = note.updatedAt 
                      ? new Date(note.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        })
                      : "Just now";

                    return (
                      <div 
                        key={note._id}
                        className="sticky-note-card"
                        style={{ 
                          backgroundColor: note.color, 
                          color: note.textColor || "#1e293b",
                          borderLeftColor: note.borderColor || "rgba(0,0,0,0.15)"
                        }}
                      >
                        {/* Header: Date, Pin & Edit Toggle */}
                        <div className="note-card-header">
                          <span className="note-date">{displayDate}</span>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            {/* Pin */}
                            <button
                              type="button"
                              className="note-pin-btn"
                              onClick={() => handleTogglePin(note)}
                              title={note.isPinned ? "Unpin Note" : "Pin Note"}
                              style={{ color: note.textColor }}
                            >
                              <svg 
                                width="14" 
                                height="14" 
                                fill={note.isPinned ? "currentColor" : "none"} 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                              </svg>
                            </button>

                            {/* Edit Icon */}
                            {!isEditing && (
                              <button
                                type="button"
                                className="note-pin-btn"
                                onClick={() => startEditing(note)}
                                title="Edit Note"
                                style={{ color: note.textColor }}
                              >
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title and Text Content */}
                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <input 
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(0,0,0,0.15)",
                                fontSize: "14px",
                                fontWeight: "bold",
                                backgroundColor: "rgba(255,255,255,0.8)",
                                color: "#1e293b",
                                outline: "none"
                              }}
                              placeholder="Title..."
                            />

                            {/* Formatting Toolbar */}
                            <div style={{ 
                              display: "flex", 
                              gap: "6px", 
                              background: "rgba(255,255,255,0.5)", 
                              padding: "4px 8px", 
                              borderRadius: "6px", 
                              border: "1px solid rgba(0,0,0,0.1)",
                              alignItems: "center"
                            }}>
                              <button
                                type="button"
                                title="Bold"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  const sel = window.getSelection();
                                  if (sel && sel.rangeCount > 0) {
                                    e.currentTarget._savedRange = sel.getRangeAt(0).cloneRange();
                                  }
                                }}
                                onClick={(e) => {
                                  const saved = e.currentTarget._savedRange;
                                  if (saved) {
                                    const sel = window.getSelection();
                                    sel.removeAllRanges();
                                    sel.addRange(saved);
                                  }
                                  document.execCommand('bold', false, null);
                                }}
                                style={{
                                  background: "rgba(255,255,255,0.8)",
                                  border: "1px solid rgba(0,0,0,0.1)",
                                  borderRadius: "4px",
                                  padding: "2px 6px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  color: "#1e293b"
                                }}
                              >
                                B
                              </button>
                              <button
                                type="button"
                                title="Italic"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  const sel = window.getSelection();
                                  if (sel && sel.rangeCount > 0) {
                                    e.currentTarget._savedRange = sel.getRangeAt(0).cloneRange();
                                  }
                                }}
                                onClick={(e) => {
                                  const saved = e.currentTarget._savedRange;
                                  if (saved) {
                                    const sel = window.getSelection();
                                    sel.removeAllRanges();
                                    sel.addRange(saved);
                                  }
                                  document.execCommand('italic', false, null);
                                }}
                                style={{
                                  background: "rgba(255,255,255,0.8)",
                                  border: "1px solid rgba(0,0,0,0.1)",
                                  borderRadius: "4px",
                                  padding: "2px 6px",
                                  fontSize: "11px",
                                  fontStyle: "italic",
                                  cursor: "pointer",
                                  color: "#1e293b"
                                }}
                              >
                                I
                              </button>
                              <button
                                type="button"
                                title="Bullet List"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  const sel = window.getSelection();
                                  if (sel && sel.rangeCount > 0) {
                                    e.currentTarget._savedRange = sel.getRangeAt(0).cloneRange();
                                  }
                                }}
                                onClick={(e) => {
                                  const saved = e.currentTarget._savedRange;
                                  if (saved) {
                                    const sel = window.getSelection();
                                    sel.removeAllRanges();
                                    sel.addRange(saved);
                                  }
                                  document.execCommand('insertUnorderedList', false, null);
                                }}
                                style={{
                                  background: "rgba(255,255,255,0.8)",
                                  border: "1px solid rgba(0,0,0,0.1)",
                                  borderRadius: "4px",
                                  padding: "2px 6px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  color: "#1e293b"
                                }}
                              >
                                • List
                              </button>

                            </div>

                            {/* Uncontrolled WYSIWYG ContentEditor */}
                            <div
                              id={`note-editor-${note._id}`}
                              contentEditable
                              placeholder="Type note content here..."
                              dangerouslySetInnerHTML={{ __html: note.text || "" }}
                              className="note-content-editor"
                            />

                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid rgba(0,0,0,0.15)",
                                  background: "rgba(255,255,255,0.5)",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  color: note.textColor
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(note._id)}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "#324158",
                                  color: "#fff",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  cursor: "pointer"
                                }}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => startEditing(note)}
                            style={{ display: "flex", flexDirection: "column", gap: "4px", cursor: "pointer" }}
                            title="Click to edit note"
                          >
                            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", letterSpacing: "-0.2px", color: "inherit" }}>{note.title}</h4>
                            <div 
                              style={{ margin: 0, fontSize: "13px", opacity: 0.95, lineHeight: 1.5 }}
                              dangerouslySetInnerHTML={{ __html: note.text || "<p style='font-style: italic; opacity: 0.6;'>Click to add details...</p>" }}
                            />
                          </div>
                        )}

                        {/* Note Footer: Color Dots & Delete */}
                        <div className="note-card-footer">
                          {/* Color Picker */}
                          <div className="color-picker-row">
                            {NOTE_COLORS.map((c) => (
                              <div 
                                key={c.name}
                                className={`color-dot ${note.color === c.bg ? "active" : ""}`}
                                style={{ backgroundColor: c.bg }}
                                onClick={() => handleUpdateNoteColor(note._id, c.bg)}
                                title={c.name}
                              />
                            ))}
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            className="note-delete-btn"
                            onClick={() => handleDeleteNote(note._id)}
                            title="Delete note"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

export default PaymentManagement;
