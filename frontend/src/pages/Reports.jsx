import { useState, useEffect } from "react";
import { adminAPI, taskAPI } from "../services/api";

function Reports() {
  const [reportType, setReportType] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalInterns: 0,
    activeInterns: 0,
    completedInterns: 0,
    internshipStudents: 0,
    smsStudents: 0,
  });
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    assignedTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
  });
  const [students, setStudents] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);

      // Fetch student stats
      const statsResponse = await adminAPI.getStats();
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Fetch task stats
      const taskStatsResponse = await taskAPI.getTaskStats();
      if (taskStatsResponse.data.success) {
        setTaskStats(taskStatsResponse.data.stats);
      }

      // Fetch all students
      const studentsResponse = await adminAPI.getAllInterns();
      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.interns);
      }
    } catch (error) {
      console.error("Failed to fetch reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      if (format === "PDF") {
        await exportToPDF();
      } else if (format === "Excel") {
        await exportToExcel();
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      setInfoMessage(`Failed to export as ${format}. Please try again.`);
      setTimeout(() => setInfoMessage(""), 4000);
    }
  };

  const exportToPDF = () => {
    try {
      let htmlContent = "";

      // HTML Header
      htmlContent += `
        <html>
          <head>
            <title>Internship Management Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0f172a; padding-bottom: 15px; }
              .header h1 { margin: 10px 0; color: #0f172a; }
              .header p { margin: 5px 0; color: #666; }
              .report-type { font-size: 18px; font-weight: bold; margin: 20px 0 15px 0; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background-color: #0f172a; color: white; padding: 12px; text-align: left; border: 1px solid #ddd; }
              td { padding: 10px; border: 1px solid #ddd; }
              tr:nth-child(even) { background-color: #f9fafb; }
              .stat-label { font-weight: bold; color: #0f172a; width: 40%; }
              .stat-value { text-align: right; font-weight: bold; color: #333; }
              .section { margin: 30px 0; page-break-inside: avoid; }
              .footer { margin-top: 40px; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Internship Management System</h1>
              <h2>Report</h2>
              <p>Report Type: <strong>${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</strong></p>
              <p>Generated on: <strong>${new Date().toLocaleDateString()}</strong></p>
            </div>
      `;

      if (reportType === "overview") {
        htmlContent += `
          <div class="section">
            <div class="report-type">Overview Statistics</div>
            <table>
              <tr>
                <td class="stat-label">Total Students</td>
                <td class="stat-value">${stats.totalInterns}</td>
              </tr>
              <tr>
                <td class="stat-label">Active Students</td>
                <td class="stat-value">${stats.activeInterns}</td>
              </tr>
              <tr>
                <td class="stat-label">Completed Students</td>
                <td class="stat-value">${stats.completedInterns}</td>
              </tr>
              <tr>
                <td class="stat-label">Internship Students</td>
                <td class="stat-value">${stats.internshipStudents}</td>
              </tr>
              <tr>
                <td class="stat-label">SMS Students</td>
                <td class="stat-value">${stats.smsStudents}</td>
              </tr>
            </table>
          </div>
          
          <div class="section">
            <div class="report-type">Task Statistics</div>
            <table>
              <tr>
                <td class="stat-label">Total Tasks</td>
                <td class="stat-value">${taskStats.totalTasks}</td>
              </tr>
              <tr>
                <td class="stat-label">Assigned Tasks</td>
                <td class="stat-value">${taskStats.assignedTasks}</td>
              </tr>
              <tr>
                <td class="stat-label">In Progress Tasks</td>
                <td class="stat-value">${taskStats.inProgressTasks}</td>
              </tr>
              <tr>
                <td class="stat-label">Completed Tasks</td>
                <td class="stat-value">${taskStats.completedTasks}</td>
              </tr>
              <tr>
                <td class="stat-label">Completion Rate</td>
                <td class="stat-value">${taskStats.totalTasks > 0 ? ((taskStats.completedTasks / taskStats.totalTasks) * 100).toFixed(1) : 0}%</td>
              </tr>
            </table>
          </div>
        `;
      } else if (reportType === "students") {
        htmlContent += `
          <div class="section">
            <div class="report-type">Student Performance Report</div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
        `;

        students.slice(0, 100).forEach((student) => {
          htmlContent += `
            <tr>
              <td>${student.internId}</td>
              <td>${student.name}</td>
              <td>${student.studentType}</td>
              <td>${student.email}</td>
              <td>${student.status}</td>
              <td>${student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : "N/A"}</td>
            </tr>
          `;
        });

        htmlContent += `
              </tbody>
            </table>
            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 15px;">
              Showing ${Math.min(100, students.length)} of ${students.length} students
            </p>
          </div>
        `;
      } else if (reportType === "tasks") {
        htmlContent += `
          <div class="section">
            <div class="report-type">Task Completion Report</div>
            <table>
              <tr>
                <td class="stat-label">Total Tasks Created</td>
                <td class="stat-value">${taskStats.totalTasks}</td>
              </tr>
              <tr>
                <td class="stat-label">Tasks Assigned</td>
                <td class="stat-value">${taskStats.assignedTasks}</td>
              </tr>
              <tr>
                <td class="stat-label">Tasks In Progress</td>
                <td class="stat-value">${taskStats.inProgressTasks}</td>
              </tr>
              <tr>
                <td class="stat-label">Tasks Completed</td>
                <td class="stat-value">${taskStats.completedTasks}</td>
              </tr>
              <tr>
                <td class="stat-label">Completion Rate</td>
                <td class="stat-value">${taskStats.totalTasks > 0 ? ((taskStats.completedTasks / taskStats.totalTasks) * 100).toFixed(1) : 0}%</td>
              </tr>
            </table>
          </div>
        `;
      }

      htmlContent += `
            <div class="footer">
              <p>This report was automatically generated by the Internship Management System</p>
              <p>${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `;

      // Open in new window and print
      const printWindow = window.open("", "", "height=600,width=800");
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Trigger print dialog
      setTimeout(() => {
        printWindow.print();
        setInfoMessage(
          "PDF exported successfully! Use your browser's print dialog to save as PDF.",
        );
        setTimeout(() => setInfoMessage(""), 5000);
      }, 500);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      setInfoMessage("Failed to export as PDF. Please try again.");
      setTimeout(() => setInfoMessage(""), 4000);
    }
  };

  const exportToExcel = async () => {
    try {
      // Dynamically import xlsx
      const XLSX =
        await import("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm");

      let data = [];
      let sheetName = "";

      if (reportType === "overview") {
        sheetName = "Overview";
        data = [
          ["Internship Management System - Report"],
          ["Report Type", "Overview"],
          ["Generated on", new Date().toLocaleDateString()],
          [],
          ["Statistics", "Value"],
          ["Total Students", stats.totalInterns],
          ["Active Students", stats.activeInterns],
          ["Completed Students", stats.completedInterns],
          ["Internship Students", stats.internshipStudents],
          ["SMS Students", stats.smsStudents],
          [],
          ["Task Statistics", "Value"],
          ["Total Tasks", taskStats.totalTasks],
          ["Assigned Tasks", taskStats.assignedTasks],
          ["In Progress Tasks", taskStats.inProgressTasks],
          ["Completed Tasks", taskStats.completedTasks],
        ];
      } else if (reportType === "students") {
        sheetName = "Students";
        data = [
          ["ID", "Name", "Type", "Email", "Status", "Join Date"],
          ...students
            .slice(0, 100)
            .map((student) => [
              student.internId,
              student.name,
              student.studentType,
              student.email,
              student.status,
              student.joiningDate
                ? new Date(student.joiningDate).toLocaleDateString()
                : "N/A",
            ]),
        ];
      } else if (reportType === "tasks") {
        sheetName = "Tasks";
        data = [
          ["Task Statistics", "Value"],
          ["Total Tasks Created", taskStats.totalTasks],
          ["Tasks Assigned", taskStats.assignedTasks],
          ["Tasks In Progress", taskStats.inProgressTasks],
          ["Tasks Completed", taskStats.completedTasks],
          [
            "Completion Rate",
            `${taskStats.totalTasks > 0 ? ((taskStats.completedTasks / taskStats.totalTasks) * 100).toFixed(1) : 0}%`,
          ],
        ];
      }

      // Create workbook
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Save file
      XLSX.writeFile(
        wb,
        `report-${reportType}-${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      setInfoMessage("Excel exported successfully!");
      setTimeout(() => setInfoMessage(""), 4000);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setInfoMessage("Failed to export as Excel. Please try again.");
      setTimeout(() => setInfoMessage(""), 4000);
    }
  };

  const renderOverviewReport = () => (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Students</h3>
            <p>{stats.totalInterns}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Active</h3>
            <p>{stats.activeInterns}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Completed</h3>
            <p>{stats.completedInterns}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>This Month</h3>
            <p>{stats.thisMonthInterns}</p>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginTop: "20px" }}>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Internship Students</h3>
            <p>
              {students.filter((s) => s.studentType === "Internship").length}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>SMS Program</h3>
            <p>
              {students.filter((s) => s.studentType === "SMS Program").length}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Tasks</h3>
            <p>{taskStats.totalTasks}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Completed Tasks</h3>
            <p>{taskStats.completedTasks}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h3>Task Progress Overview</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              padding: "15px",
              background: "#eff6ff",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "#1e40af", fontWeight: 600, fontSize: "14px" }}>
              Assigned
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#1e40af",
                marginTop: "5px",
              }}
            >
              {taskStats.assignedTasks}
            </p>
          </div>
          <div
            style={{
              padding: "15px",
              background: "#fef3c7",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "#92400e", fontWeight: 600, fontSize: "14px" }}>
              In Progress
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#92400e",
                marginTop: "5px",
              }}
            >
              {taskStats.inProgressTasks}
            </p>
          </div>
          <div
            style={{
              padding: "15px",
              background: "#d1fae5",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "#065f46", fontWeight: 600, fontSize: "14px" }}>
              Completed
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#065f46",
                marginTop: "5px",
              }}
            >
              {taskStats.completedTasks}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const renderStudentReport = () => (
    <div className="card">
      <h3>Student Performance Report</h3>
      <div style={{ overflowX: "auto", marginTop: "20px" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>Status</th>
              <th>Join Date</th>
            </tr>
          </thead>
          <tbody>
            {students.slice(0, 20).map((student) => (
              <tr key={student._id}>
                <td>{student.internId}</td>
                <td>{student.name}</td>
                <td>{student.studentType}</td>
                <td>{student.email}</td>
                <td>
                  <span
                    className={`status-badge ${
                      student.status === "Active"
                        ? "status-active"
                        : student.status === "Completed"
                          ? "status-completed"
                          : "status-inactive"
                    }`}
                  >
                    {student.status}
                  </span>
                </td>
                <td>
                  {student.joiningDate
                    ? new Date(student.joiningDate).toLocaleDateString()
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length > 20 && (
          <p
            style={{ textAlign: "center", marginTop: "15px", color: "#6b7280" }}
          >
            Showing first 20 of {students.length} students
          </p>
        )}
      </div>
    </div>
  );

  const renderTaskReport = () => (
    <div className="card">
      <h3>Task Completion Report</h3>
      <div style={{ marginTop: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "15px",
          }}
        >
          <div
            style={{
              padding: "20px",
              background: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              Total Tasks Created
            </p>
            <p style={{ fontSize: "32px", fontWeight: 700, color: "#111827" }}>
              {taskStats.totalTasks}
            </p>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "5px" }}>
              All time
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              background: "#eff6ff",
              borderRadius: "8px",
              border: "1px solid #bfdbfe",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#1e40af",
                marginBottom: "8px",
              }}
            >
              Tasks Assigned
            </p>
            <p style={{ fontSize: "32px", fontWeight: 700, color: "#1e3a8a" }}>
              {taskStats.assignedTasks}
            </p>
            <p style={{ fontSize: "12px", color: "#60a5fa", marginTop: "5px" }}>
              Waiting to start
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              background: "#fef3c7",
              borderRadius: "8px",
              border: "1px solid #fde68a",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#92400e",
                marginBottom: "8px",
              }}
            >
              In Progress
            </p>
            <p style={{ fontSize: "32px", fontWeight: 700, color: "#78350f" }}>
              {taskStats.inProgressTasks}
            </p>
            <p style={{ fontSize: "12px", color: "#f59e0b", marginTop: "5px" }}>
              Currently working
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              background: "#d1fae5",
              borderRadius: "8px",
              border: "1px solid #a7f3d0",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#065f46",
                marginBottom: "8px",
              }}
            >
              Completed
            </p>
            <p style={{ fontSize: "32px", fontWeight: 700, color: "#064e3b" }}>
              {taskStats.completedTasks}
            </p>
            <p style={{ fontSize: "12px", color: "#10b981", marginTop: "5px" }}>
              {taskStats.totalTasks > 0
                ? (
                    (taskStats.completedTasks / taskStats.totalTasks) *
                    100
                  ).toFixed(1)
                : 0}
              % completion rate
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            background: "#f9fafb",
            borderRadius: "8px",
          }}
        >
          <h4 style={{ marginBottom: "15px" }}>Task Distribution</h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "5px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  Completed
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  {taskStats.completedTasks} / {taskStats.totalTasks}
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "#e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${taskStats.totalTasks > 0 ? (taskStats.completedTasks / taskStats.totalTasks) * 100 : 0}%`,
                    height: "100%",
                    background: "#10b981",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "5px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  In Progress
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  {taskStats.inProgressTasks} / {taskStats.totalTasks}
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "#e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${taskStats.totalTasks > 0 ? (taskStats.inProgressTasks / taskStats.totalTasks) * 100 : 0}%`,
                    height: "100%",
                    background: "#f59e0b",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "5px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  Assigned
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  {taskStats.assignedTasks} / {taskStats.totalTasks}
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "#e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${taskStats.totalTasks > 0 ? (taskStats.assignedTasks / taskStats.totalTasks) * 100 : 0}%`,
                    height: "100%",
                    background: "#3b82f6",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomReport = () => (
    <div className="card">
      <h3>Custom Report Generator</h3>
      <p style={{ color: "#6b7280", marginTop: "10px" }}>
        Generate custom reports based on date ranges and specific criteria
      </p>

      <div style={{ marginTop: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontSize: "14px",
              }}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        <button
          style={{
            marginTop: "15px",
            padding: "12px 24px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Generate Report
        </button>
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "#f9fafb",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#6b7280" }}>
          Custom report generation features coming soon!
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="content-header">
        <h1>Reports & Analytics</h1>
        <p>View comprehensive reports and analytics</p>
      </div>

      {infoMessage && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            backgroundColor: "#ecfccb",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            color: "#166534",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {infoMessage}
        </div>
      )}

      {/* Export Options */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => handleExport("PDF")}
          style={{
            padding: "10px 20px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Export as PDF
        </button>
        <button
          onClick={() => handleExport("Excel")}
          style={{
            padding: "10px 20px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Export as Excel
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="card">
        <div
          style={{
            display: "flex",
            gap: "10px",
            borderBottom: "2px solid #e5e7eb",
            paddingBottom: "10px",
          }}
        >
          <button
            onClick={() => setReportType("overview")}
            style={{
              padding: "10px 20px",
              background: reportType === "overview" ? "#3b82f6" : "transparent",
              color: reportType === "overview" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setReportType("students")}
            style={{
              padding: "10px 20px",
              background: reportType === "students" ? "#3b82f6" : "transparent",
              color: reportType === "students" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Students
          </button>
          <button
            onClick={() => setReportType("tasks")}
            style={{
              padding: "10px 20px",
              background: reportType === "tasks" ? "#3b82f6" : "transparent",
              color: reportType === "tasks" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Tasks
          </button>
          <button
            onClick={() => setReportType("custom")}
            style={{
              padding: "10px 20px",
              background: reportType === "custom" ? "#3b82f6" : "transparent",
              color: reportType === "custom" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="card">
          <p>Loading reports...</p>
        </div>
      ) : (
        <>
          {reportType === "overview" && renderOverviewReport()}
          {reportType === "students" && renderStudentReport()}
          {reportType === "tasks" && renderTaskReport()}
          {reportType === "custom" && renderCustomReport()}
        </>
      )}
    </>
  );
}

export default Reports;
