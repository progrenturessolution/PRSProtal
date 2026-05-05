import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI, taskAPI } from "../services/api";

function Reports() {
  const navigate = useNavigate();
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

  const handleViewReport = (studentId) => {
    navigate(`/admin/student/${studentId}/report`);
  };

  const handleDeleteAssessmentRecords = async (studentId, studentName) => {
    const confirmed = window.confirm(
      `Delete ${studentName}? This will move the student to the recycle bin and remove the row from this report.`
    );

    if (!confirmed) return;

    try {
      const response = await adminAPI.deleteIntern(studentId);
      if (response.data.success) {
        setStudents((prev) => prev.filter((student) => student._id !== studentId));
        setOpenMenuId(null);
        setInfoMessage(response.data.message || "Student deleted successfully");
        setTimeout(() => setInfoMessage(""), 4000);
      } else {
        setInfoMessage(response.data.message || "Failed to delete student");
        setTimeout(() => setInfoMessage(""), 4000);
      }
    } catch (error) {
      console.error("Delete student error:", error);
      setInfoMessage(error.response?.data?.message || "Failed to delete student. Please try again.");
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
            <table>
              <tr>
                <td class="stat-label">Total Tasks Created</td>
                <td class="stat-value">${sourceStats.totalTasks}</td>
              </tr>
              <tr>
                <td class="stat-label">Tasks Assigned</td>
                <td class="stat-value">${sourceStats.assignedTasks || 0}</td>
              </tr>
              <tr>
                <td class="stat-label">Tasks In Progress</td>
                <td class="stat-value">${sourceStats.inProgressTasks || 0}</td>
              </tr>
              <tr>
                <td class="stat-label">Tasks Completed</td>
                <td class="stat-value">${sourceStats.completedTasks || 0}</td>
              </tr>
              <tr>
                <td class="stat-label">Completion Rate</td>
                <td class="stat-value">${sourceStats.totalTasks > 0 ? ((sourceStats.completedTasks / sourceStats.totalTasks) * 100).toFixed(1) : 0}%</td>
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
        const sourceStudents = customReportGenerated
          ? filteredData.students
          : students;
        data = [
          ["ID", "Name", "Type", "Email", "Status", "Join Date"],
          ...sourceStudents
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
        const sourceStats = customReportGenerated
          ? filteredData.stats
          : taskStats;
        data = [
          ["Task Statistics", "Value"],
          ["Total Tasks Created", sourceStats.totalTasks],
          ["Tasks Assigned", sourceStats.assignedTasks || 0],
          ["Tasks In Progress", sourceStats.inProgressTasks || 0],
          ["Tasks Completed", sourceStats.completedTasks || 0],
          [
            "Completion Rate",
            `${sourceStats.totalTasks > 0 ? ((sourceStats.completedTasks / sourceStats.totalTasks) * 100).toFixed(1) : 0}%`,
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
                    background: "#324158",
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
                    background: "#324158",
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
                    background: "#324158",
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
        <h3>Student Assessment Records</h3>
        <p style={{ color: "#6b7280", marginTop: "5px", marginBottom: "15px" }}>
          View and manage all student assessment records including interviews, aptitude tests, and assessments
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
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Student</label>
            <select
              value={assessmentSelectedStudent}
              onChange={(e) => setAssessmentSelectedStudent(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                marginTop: "4px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.internId})
                </option>
              ))}
            </select>
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
                <tr key={student._id}>
                  <td>{student.internId}</td>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.studentType}</td>
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
                              color: "#324158",
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
            background: "#324158",
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
            background: "#324158",
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
            background: "#324158",
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
            onClick={() => setReportType("overview")}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s",
              background: reportType === "overview" ? "#324158" : "transparent",
              color: reportType === "overview" ? "white" : "#64748b",
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setReportType("students")}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s",
              background: reportType === "students" ? "#324158" : "transparent",
              color: reportType === "students" ? "white" : "#64748b",
            }}
          >
            Students
          </button>
          <button
            onClick={() => setReportType("tasks")}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s",
              background: reportType === "tasks" ? "#324158" : "transparent",
              color: reportType === "tasks" ? "white" : "#64748b",
            }}
          >
            Tasks
          </button>
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
              background: reportType === "assessments" ? "#324158" : "transparent",
              color: reportType === "assessments" ? "white" : "#64748b",
            }}
          >
            Assessment Records
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
              background: reportType === "custom" ? "#324158" : "transparent",
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
          {reportType === "tasks" && renderTaskReport()}
          {reportType === "assessments" && renderAssessmentRecordsReport()}
          {reportType === "custom" && renderCustomReport()}
        </>
      )}
    </>
  );
}

export default Reports;
