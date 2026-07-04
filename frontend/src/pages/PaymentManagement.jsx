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
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");

  const calculateMonthlyData = () => {
    const monthlyGroups = {};

    payments.forEach((item) => {
      // 1. Process Receive Date (Revenue & Pending)
      if (item.receiveDate) {
        const dateObj = new Date(item.receiveDate);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const monthIndex = dateObj.getMonth(); // 0-11
          const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`; // e.g. "2025-11"
          
          if (!monthlyGroups[monthKey]) {
            monthlyGroups[monthKey] = {
              monthKey,
              monthName: dateObj.toLocaleDateString("en-IN", { month: "long", year: "numeric" }), // e.g. "November 2025"
              year,
              monthIndex,
              revenue: 0,
              burnRate: 0,
              pending: 0,
            };
          }
          
          monthlyGroups[monthKey].revenue += Number(item.payment) || 0;
          monthlyGroups[monthKey].pending += Number(item.pendingPayment) || 0;
        }
      }

      // 2. Process Send Date (Burn Rate)
      if (item.sendDate) {
        const dateObj = new Date(item.sendDate);
        if (!isNaN(dateObj.getTime())) {
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
          
          monthlyGroups[monthKey].burnRate += Number(item.payment) || 0;
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
      if (item.receiveDate) {
        const d = new Date(item.receiveDate);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (key === monthKey) match = true;
        }
      }
      if (item.sendDate) {
        const d = new Date(item.sendDate);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (key === monthKey) match = true;
        }
      }
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
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 14px;
              background-color: #f8fafc;
              box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            }
            .metric-card.accent-blue { border-left: 3px solid #3b82f6; }
            .metric-card.accent-slate { border-left: 3px solid #64748b; }
            .metric-card.accent-indigo { border-left: 3px solid #6366f1; }
            .metric-card.accent-sky { border-left: 3px solid #0ea5e9; }
            .metric-card.accent-cyan { border-left: 3px solid #06b6d4; }
            .metric-card.accent-red { border-left: 3px solid #f43f5e; }
            
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
              <div class="metric-card accent-blue">
                <div class="metric-label">${isAll ? "Total Revenue" : "Revenue"}</div>
                <div class="metric-value">₹${displayRevenue.toLocaleString("en-IN")}</div>
                <div class="metric-desc">${isAll ? "Inflow payments received" : "Monthly inflow received"}</div>
              </div>
              <div class="metric-card accent-slate">
                <div class="metric-label">${isAll ? "Total Burn" : "Burn Rate"}</div>
                <div class="metric-value">₹${displayBurnRate.toLocaleString("en-IN")}</div>
                <div class="metric-desc">${isAll ? "Outflow payments sent" : "Monthly outflow sent"}</div>
              </div>
              <div class="metric-card accent-indigo">
                <div class="metric-label">${isAll ? "Total Pending" : "Pending"}</div>
                <div class="metric-value">₹${displayPending.toLocaleString("en-IN")}</div>
                <div class="metric-desc">${isAll ? "Unpaid balances" : "Monthly unpaid balance"}</div>
              </div>
              <div class="metric-card ${displayNetWithout >= 0 ? "accent-sky" : "accent-red"}">
                <div class="metric-label">Net Profit (Excl.)</div>
                <div class="metric-value ${displayNetWithout < 0 ? "neg" : ""}">
                  ${displayNetWithout < 0 ? "-" : ""}₹${Math.abs(displayNetWithout).toLocaleString("en-IN")}
                </div>
                <div class="metric-desc">Revenue minus Burn Rate</div>
              </div>
              <div class="metric-card ${displayNetWith >= 0 ? "accent-cyan" : "accent-red"}">
                <div class="metric-label">Net Profit (Incl.)</div>
                <div class="metric-value ${displayNetWith < 0 ? "neg" : ""}">
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
      { label: isAll ? "Total Revenue" : "Revenue", value: displayRevenue, desc: isAll ? "Inflow payments received" : "Monthly inflow received", color1: "#3b82f6", color2: "#1d4ed8" },
      { label: isAll ? "Total Burn Rate" : "Burn Rate", value: displayBurnRate, desc: isAll ? "Outflow payments sent" : "Monthly outflow sent", color1: "#64748b", color2: "#475569" },
      { label: isAll ? "Total Pending" : "Pending", value: displayPending, desc: isAll ? "Unpaid balances" : "Monthly unpaid balance", color1: "#6366f1", color2: "#4f46e5" },
      { label: "Net Profit (Excl. Pending)", value: displayNetWithout, desc: "Revenue minus Burn Rate", 
        color1: displayNetWithout >= 0 ? "#0ea5e9" : "#f43f5e", color2: displayNetWithout >= 0 ? "#0284c7" : "#e11d48" },
      { label: "Net Profit (Incl. Pending)", value: displayNetWith, desc: "Adjusted with pending balance", 
        color1: displayNetWith >= 0 ? "#06b6d4" : "#f43f5e", color2: displayNetWith >= 0 ? "#0891b2" : "#e11d48" },
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    const goalVal = entry.paymentGoal || "Pending";

    setFormData({
      id: entry._id,
      name: entry.name || "",
      role: entry.role || "",
      paymentGoal: String(goalVal),
      payment: String(entry.payment || 0),
      pendingPayment: String(entry.pendingPayment || 0),
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
        paymentGoal: formData.paymentGoal,
        payment: Number(formData.payment) || 0,
        pendingPayment: Number(formData.pendingPayment) || 0,
        receiveDate: formData.receiveDate || null,
        sendDate: formData.sendDate || null,
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
        <div className="header-right" style={{ display: "flex", gap: "10px" }}>
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
          ) : activeTab === "report" ? (
            <button
              type="button"
              onClick={() => {
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
                        {/* Total Row - No Background/Text Colors, just Bolded */}
                        <tr style={{ fontWeight: "800" }}>
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
                <label>Payment Goal *</label>
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
                </select>
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
                  min="0"
                  name="pendingPayment"
                  value={formData.pendingPayment}
                  onChange={handleInput}
                  placeholder="Enter pending amount"
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
                          <td>{item.paymentGoal || "Pending"}</td>
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
