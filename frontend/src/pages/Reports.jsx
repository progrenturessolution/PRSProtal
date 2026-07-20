import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI, taskAPI } from "../services/api";

function Reports({ initialReportType = "assessments" }) {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState(initialReportType);
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
  const [filteredData, setFilteredData] = useState({
    students: [],
    tasks: [],
    stats: {
      totalStudents: 0,
      activeStudents: 0,
      completedStudents: 0,
      totalTasks: 0,
      completedTasks: 0,
    },
  });
  const [customReportGenerated, setCustomReportGenerated] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [assessmentSelectedStudent, setAssessmentSelectedStudent] = useState("");
  const [assessmentSelectedMonth, setAssessmentSelectedMonth] = useState("");
  const [assessmentSearchTerm, setAssessmentSearchTerm] = useState("");

  useEffect(() => {
    fetchReportsData();
  }, []);

  useEffect(() => {
    setReportType(initialReportType);
  }, [initialReportType]);

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
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      setInfoMessage(`Failed to export as ${format}. Please try again.`);
      setTimeout(() => setInfoMessage(""), 4000);
    }
  };

  const handleViewReport = (studentId) => {
    navigate(`/admin/student/${studentId}/report`);
  };

  const handleDeleteAssessmentRecords = async (studentId, studentName) => {
    const confirmed = window.confirm(
      `Delete assessment records for ${studentName}? This will remove only assessment-related records for this student from reports.`
    );

    if (!confirmed) return;

    try {
      const response = await adminAPI.deleteStudentPerformanceRecords(studentId);
      if (response.data && response.data.success) {
        // Do not remove the student from the main list — only assessment records were deleted
        setOpenMenuId(null);
        setInfoMessage(response.data.message || "Assessment records deleted successfully");
        setTimeout(() => setInfoMessage(""), 4000);
      } else {
        setInfoMessage(response.data?.message || "Failed to delete assessment records");
        setTimeout(() => setInfoMessage(""), 4000);
      }
    } catch (error) {
      console.error("Delete assessment records error:", error);
      setInfoMessage(error.response?.data?.message || "Failed to delete assessment records. Please try again.");
      setTimeout(() => setInfoMessage(""), 4000);
    }
  };

  const generateCustomReport = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setInfoMessage("Please select both start and end dates.");
      setTimeout(() => setInfoMessage(""), 4000);
      return;
    }

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date

    if (startDate > endDate) {
      setInfoMessage("Start date cannot be after end date.");
      setTimeout(() => setInfoMessage(""), 4000);
      return;
    }

    // Filter students by joining date
    const filteredStudents = students.filter((student) => {
      if (!student.joiningDate) return false;
      const joinDate = new Date(student.joiningDate);
      return joinDate >= startDate && joinDate <= endDate;
    });

    // For tasks, we'll filter based on creation date (assuming tasks have createdAt field)
    // Since we don't have task creation dates in the current data, we'll show all tasks
    // In a real implementation, you'd filter tasks by their creation/update dates
    const filteredTasks = []; // Placeholder - would need task date data

    // Calculate stats for filtered data
    const filteredStats = {
      totalStudents: filteredStudents.length,
      activeStudents: filteredStudents.filter((s) => s.status === "Active")
        .length,
      completedStudents: filteredStudents.filter(
        (s) => s.status === "Completed",
      ).length,
      totalTasks: filteredTasks.length,
      completedTasks: filteredTasks.filter((t) => t.status === "Completed")
        .length,
    };

    setFilteredData({
      students: filteredStudents,
      tasks: filteredTasks,
      stats: filteredStats,
    });

    setCustomReportGenerated(true);
    setInfoMessage(
      `Custom report generated for ${filteredStudents.length} students from ${dateRange.startDate} to ${dateRange.endDate}.`,
    );
    setTimeout(() => setInfoMessage(""), 5000);
  };

  const exportToPDF = () => {
    try {
      let htmlContent = "";

      // HTML Header
      htmlContent += `
        <html>
          <head>
            <title>Progrenstures Student Report System</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
              body {
                font-family: 'Outfit', sans-serif;
                margin: 40px;
                color: #1e293b;
                background-color: #ffffff;
                line-height: 1.5;
              }
              .header {
                margin-bottom: 40px;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 24px;
                position: relative;
              }
              .header-accent {
                position: absolute;
                top: -40px;
                left: -40px;
                right: -40px;
                height: 6px;
                background: linear-gradient(90deg, #324158, #10b981);
              }
              .header h1 {
                margin: 0 0 8px 0;
                color: #324158;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: -0.02em;
              }
              .header .meta-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-top: 20px;
              }
              .header .meta-item {
                font-size: 13px;
                color: #64748b;
              }
              .header .meta-item strong {
                color: #334155;
                font-weight: 600;
              }
              .report-type {
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 16px 0;
                color: #324158;
                border-left: 4px solid #10b981;
                padding-left: 12px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 16px 0;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
              }
              th {
                background-color: #324158;
                color: white;
                padding: 12px 16px;
                text-align: left;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              td {
                padding: 12px 16px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 14px;
                color: #334155;
              }
              tr:last-child td {
                border-bottom: none;
              }
              tr:nth-child(even) {
                background-color: #f8fafc;
              }
              .stat-label {
                font-weight: 600;
                color: #475569;
                width: 50%;
              }
              .stat-value {
                text-align: right;
                font-weight: 700;
                color: #0f172a;
              }
              .kpi-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin: 24px 0;
              }
              .kpi-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 18px 12px;
                text-align: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.02);
              }
              .kpi-card .value {
                font-size: 24px;
                font-weight: 700;
                color: #324158;
                margin-bottom: 4px;
              }
              .kpi-card .label {
                font-size: 11px;
                color: #64748b;
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.05em;
              }
              .badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
              }
              .badge-active { background-color: #e8f5e9; color: #2e7d32; }
              .badge-completed { background-color: #e3f2fd; color: #1565c0; }
              .badge-inactive { background-color: #ffebee; color: #c62828; }
              
              .type-tag {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                background-color: #f1f5f9;
                color: #475569;
              }
              .type-sms { background-color: #f3e5f5; color: #6a1b9a; }
              .type-internship { background-color: #e0f7fa; color: #00838f; }

              .section {
                margin: 32px 0;
                page-break-inside: avoid;
              }
              .footer {
                margin-top: 60px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
                padding-top: 24px;
                color: #94a3b8;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-accent"></div>
              <h1>Progrenstures Student Report System</h1>
              <div class="meta-grid">
                <div class="meta-item">Report Type: <strong>${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</strong></div>
                <div class="meta-item">Generated on: <strong>${new Date().toLocaleDateString()}</strong></div>
              </div>
            </div>
      `;

      if (reportType === "overview") {
        htmlContent += `
          <div class="section">
            <div class="report-type">Overview Statistics</div>
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="value">${stats.totalInterns}</div>
                <div class="label">Total Students</div>
              </div>
              <div class="kpi-card">
                <div class="value">${stats.activeInterns}</div>
                <div class="label">Active Students</div>
              </div>
              <div class="kpi-card">
                <div class="value">${stats.completedInterns}</div>
                <div class="label">Completed Students</div>
              </div>
              <div class="kpi-card">
                <div class="value">${stats.internshipStudents}</div>
                <div class="label">Internship Program</div>
              </div>
              <div class="kpi-card">
                <div class="value">${stats.smsStudents}</div>
                <div class="label">SMS Program</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="report-type">Task Statistics</div>
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="value">${taskStats.totalTasks}</div>
                <div class="label">Total Tasks</div>
              </div>
              <div class="kpi-card">
                <div class="value">${taskStats.assignedTasks}</div>
                <div class="label">Assigned Tasks</div>
              </div>
              <div class="kpi-card">
                <div class="value">${taskStats.inProgressTasks}</div>
                <div class="label">In Progress</div>
              </div>
              <div class="kpi-card">
                <div class="value">${taskStats.completedTasks}</div>
                <div class="label">Completed</div>
              </div>
              <div class="kpi-card">
                <div class="value">${taskStats.totalTasks > 0 ? ((taskStats.completedTasks / taskStats.totalTasks) * 100).toFixed(1) : 0}%</div>
                <div class="label">Completion Rate</div>
              </div>
            </div>
          </div>
        `;
      } else if (reportType === "students") {
        const sourceArray = customReportGenerated
          ? filteredData.students
          : students;
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

        sourceArray.slice(0, 100).forEach((student) => {
          const statusClass = String(student.status || "").toLowerCase() === "active" ? "active" : (String(student.status || "").toLowerCase() === "completed" ? "completed" : "inactive");
          const typeClass = String(student.studentType || "").toLowerCase() === "sms" ? "sms" : "internship";
          htmlContent += `
            <tr>
              <td style="font-family: monospace; font-weight: 600;">${student.internId}</td>
              <td style="font-weight: 500;">${student.name}</td>
              <td><span class="type-tag type-${typeClass}">${student.studentType}</span></td>
              <td>${student.email}</td>
              <td><span class="badge badge-${statusClass}">${student.status}</span></td>
              <td>${student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : "N/A"}</td>
            </tr>
          `;
        });

        htmlContent += `
              </tbody>
            </table>
            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 15px;">
              Showing ${Math.min(100, sourceArray.length)} of ${sourceArray.length} students
            </p>
          </div>
        `;
      } else if (reportType === "tasks") {
        const sourceStats = customReportGenerated
          ? filteredData.stats
          : taskStats;
        htmlContent += `
          <div class="section">
            <div class="report-type">Task Completion Report</div>
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="value">${sourceStats.totalTasks}</div>
                <div class="label">Total Tasks Created</div>
              </div>
              <div class="kpi-card">
                <div class="value">${sourceStats.assignedTasks || 0}</div>
                <div class="label">Tasks Assigned</div>
              </div>
              <div class="kpi-card">
                <div class="value">${sourceStats.inProgressTasks || 0}</div>
                <div class="label">Tasks In Progress</div>
              </div>
              <div class="kpi-card">
                <div class="value">${sourceStats.completedTasks || 0}</div>
                <div class="label">Tasks Completed</div>
              </div>
              <div class="kpi-card">
                <div class="value">${sourceStats.totalTasks > 0 ? ((sourceStats.completedTasks / sourceStats.totalTasks) * 100).toFixed(1) : 0}%</div>
                <div class="label">Completion Rate</div>
              </div>
            </div>
          </div>
        `;
      }

      htmlContent += `
            <div class="footer">
              <p>This report was automatically generated by the Progrenstures Student Report System</p>
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



  const renderOverviewReport = () => (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "4px",
              fontWeight: "500",
            }}
          >
            Total Students
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
            {stats.totalInterns}
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "4px",
              fontWeight: "500",
            }}
          >
            Active
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
            {stats.activeInterns}
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "4px",
              fontWeight: "500",
            }}
          >
            Completed
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
            {stats.completedInterns}
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "4px",
              fontWeight: "500",
            }}
          >
            This Month
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
            {stats.thisMonthInterns}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "4px",
              fontWeight: "500",
            }}
          >
            Internship Students
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
            {students.filter((s) => s.studentType === "Internship").length}
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "4px",
              fontWeight: "500",
            }}
          >
            SMS Program
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
            {students.filter((s) => s.studentType === "SMS Program").length}
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "4px",
              fontWeight: "500",
            }}
          >
            Total Tasks
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
            {taskStats.totalTasks}
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "4px",
              fontWeight: "500",
            }}
          >
            Completed Tasks
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
            {taskStats.completedTasks}
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
              padding: "20px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "#64748b", fontWeight: 600, fontSize: "14px" }}>
              Assigned
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#0f172a",
                marginTop: "5px",
              }}
            >
              {taskStats.assignedTasks}
            </p>
          </div>
          <div
            style={{
              padding: "20px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "#64748b", fontWeight: 600, fontSize: "14px" }}>
              In Progress
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#0f172a",
                marginTop: "5px",
              }}
            >
              {taskStats.inProgressTasks}
            </p>
          </div>
          <div
            style={{
              padding: "20px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          >
            <p style={{ color: "#64748b", fontWeight: 600, fontSize: "14px" }}>
              Completed
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#0f172a",
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
              (() => {
                const normalizedStatus = String(student.status || "").toLowerCase();
                return (
              <tr key={student._id}>
                <td>{student.internId}</td>
                <td>{student.name}</td>
                <td>{student.studentType}</td>
                <td>{student.email}</td>
                <td>
                  <span
                    className={`status-badge ${
                      normalizedStatus === "active"
                        ? "status-active"
                        : normalizedStatus === "completed"
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
                );
              })()
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
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "8px",
              }}
            >
              Total Tasks Created
            </p>
            <p style={{ fontSize: "32px", fontWeight: 700, color: "#0f172a" }}>
              {taskStats.totalTasks}
            </p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "5px" }}>
              All time
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "8px",
              }}
            >
              Tasks Assigned
            </p>
            <p style={{ fontSize: "32px", fontWeight: 700, color: "#0f172a" }}>
              {taskStats.assignedTasks}
            </p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "5px" }}>
              Waiting to start
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "8px",
              }}
            >
              In Progress
            </p>
            <p style={{ fontSize: "32px", fontWeight: 700, color: "#0f172a" }}>
              {taskStats.inProgressTasks}
            </p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "5px" }}>
              Currently working
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "8px",
              }}
            >
              Completed
            </p>
            <p style={{ fontSize: "32px", fontWeight: 700, color: "#0f172a" }}>
              {taskStats.completedTasks}
            </p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "5px" }}>
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
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
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
                    background: "#344158",
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
                    background: "#344158",
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
                    background: "#344158",
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

  const renderAssessmentRecordsReport = () => {
    const filteredStudents = students.filter((student) => {
      const matchesStudent = !assessmentSelectedStudent || student._id === assessmentSelectedStudent;
      const searchValue = assessmentSearchTerm.trim().toLowerCase();
      const matchesSearch =
        searchValue === "" ||
        student.name.toLowerCase().includes(searchValue) ||
        student.internId.toLowerCase().includes(searchValue) ||
        student.email.toLowerCase().includes(searchValue);

      let matchesMonth = true;
      if (assessmentSelectedMonth) {
        const joiningDate = new Date(student.joiningDate);
        const selectedDate = new Date(`${assessmentSelectedMonth}-01`);
        matchesMonth =
          !Number.isNaN(joiningDate.getTime()) &&
          joiningDate.getMonth() === selectedDate.getMonth() &&
          joiningDate.getFullYear() === selectedDate.getFullYear();
      }

      return matchesStudent && matchesSearch && matchesMonth;
    });

    return (
      <div className="card">
        <h3>Student Activity Records</h3>
        <p style={{ color: "#6b7280", marginTop: "5px", marginBottom: "15px" }}>
          View and manage all student activity records including interviews, aptitude tests, and assessments
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
            padding: "15px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Search</label>
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={assessmentSearchTerm}
              onChange={(e) => setAssessmentSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                marginTop: "4px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>


          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Month</label>
            <input
              type="month"
              value={assessmentSelectedMonth}
              onChange={(e) => setAssessmentSelectedMonth(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                marginTop: "4px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={() => {
                setAssessmentSelectedStudent("");
                setAssessmentSelectedMonth("");
                setAssessmentSearchTerm("");
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#e2e8f0",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                color: "#475569",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#cbd5e1")}
              onMouseLeave={(e) => (e.target.style.background = "#e2e8f0")}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "15px", fontSize: "13px", color: "#64748b" }}>
          Showing {filteredStudents.length} of {students.length} students
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table assessment-records-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                (() => {
                  const normalizedStatus = String(student.status || "").toLowerCase();
                  return (
                <tr key={student._id}>
                  <td>{student.internId}</td>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.studentType}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        normalizedStatus === "active"
                          ? "status-active"
                          : normalizedStatus === "completed"
                            ? "status-completed"
                            : "status-inactive"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td>{student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : "N/A"}</td>
                  <td>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === student._id ? null : student._id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "18px",
                          color: "#6b7280",
                          padding: "4px 8px",
                        }}
                        title="More options"
                      >
                        •••
                      </button>
                      {openMenuId === student._id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "30px",
                            right: "0",
                            background: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                            zIndex: 100,
                            minWidth: "150px",
                          }}
                        >
                          <button
                            onClick={() => {
                              handleViewReport(student._id);
                              setOpenMenuId(null);
                            }}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "10px 15px",
                              border: "none",
                              background: "none",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: "#344158",
                              fontWeight: 500,
                              borderRadius: "6px",
                            }}
                            onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
                            onMouseLeave={(e) => (e.target.style.background = "none")}
                          >
                            View Report
                          </button>
                          <button
                            onClick={() => handleDeleteAssessmentRecords(student._id, student.name)}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "10px 15px",
                              border: "none",
                              background: "none",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: "#dc2626",
                              fontWeight: 500,
                              borderRadius: "6px",
                            }}
                            onMouseEnter={(e) => (e.target.style.background = "#fef2f2")}
                            onMouseLeave={(e) => (e.target.style.background = "none")}
                          >
                            Delete Records
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <p style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
              {students.length === 0 ? "No students found" : "No results matching your filters"}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderCustomReport = () => (
    <div className="card">
      <h3>Custom Report Generator</h3>
      <p style={{ color: "#6b7280", marginTop: "5px", marginBottom: "15px" }}>
        Generate a date-based filtered report for students and tasks
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
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                background: "#f8fafc",
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
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                background: "#f8fafc",
              }}
            />
          </div>
        </div>

        <button
          onClick={generateCustomReport}
          style={{
            marginTop: "15px",
            padding: "12px 24px",
            background: "#344158",
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

      {customReportGenerated && (
        <div style={{ marginTop: "30px" }}>
          <h4>Filtered Students ({filteredData.stats.totalStudents})</h4>
          <div style={{ overflowX: "auto", marginTop: "10px" }}>
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
                {filteredData.students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.internId}</td>
                    <td>{student.name}</td>
                    <td>{student.studentType}</td>
                    <td>{student.email}</td>
                    <td>{student.status}</td>
                    <td>
                      {student.joiningDate
                        ? new Date(student.joiningDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!customReportGenerated && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#6b7280" }}>
            Set dates above and click generate to view results
          </p>
        </div>
      )}
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
            background: "#344158",
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
      </div>

      {/* Report Type Tabs */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "6px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "4px",
          }}
        >

          <button
            onClick={() => setReportType("assessments")}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s",
              background: reportType === "assessments" ? "#344158" : "transparent",
              color: reportType === "assessments" ? "white" : "#64748b",
            }}
          >
            Activity Records
          </button>
          <button
            onClick={() => setReportType("custom")}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s",
              background: reportType === "custom" ? "#344158" : "transparent",
              color: reportType === "custom" ? "white" : "#64748b",
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
          {reportType === "assessments" && renderAssessmentRecordsReport()}
          {reportType === "custom" && renderCustomReport()}
        </>
      )}
    </>
  );
}

export default Reports;
