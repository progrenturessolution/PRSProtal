import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { adminAPI, internAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import "./StudentDetailReport.css";

function StudentDetailReport() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState({
    interviews: [],
    aptitudes: [],
    assessments: [],
    trainings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  const getRecordDate = (record) => record?.date || record?.createdAt || record?.updatedAt || null;

  const getMonthKey = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const formatMonthLabel = (monthKey) => {
    if (!monthKey) return "";
    const [year, month] = monthKey.split("-").map(Number);
    if (!year || !month) return monthKey;
    return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  const allMonthOptions = useMemo(() => {
    const keys = [
      ...(records.interviews || []),
      ...(records.aptitudes || []),
      ...(records.assessments || []),
      ...(records.trainings || []),
    ]
      .map((record) => getMonthKey(getRecordDate(record)))
      .filter(Boolean);

    return Array.from(new Set(keys)).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (!selectedMonth) {
      return {
        interviews: records.interviews || [],
        aptitudes: records.aptitudes || [],
        assessments: records.assessments || [],
        trainings: records.trainings || [],
      };
    }

    const filterByMonth = (items) =>
      (items || []).filter((item) => getMonthKey(getRecordDate(item)) === selectedMonth);

    return {
      interviews: filterByMonth(records.interviews),
      aptitudes: filterByMonth(records.aptitudes),
      assessments: filterByMonth(records.assessments),
      trainings: filterByMonth(records.trainings),
    };
  }, [records, selectedMonth]);

  const hasFilteredRecords =
    filteredRecords.interviews.length > 0 ||
    filteredRecords.aptitudes.length > 0 ||
    filteredRecords.assessments.length > 0 ||
    filteredRecords.trainings.length > 0;

  const getInterviewOverallLevel = (interview) =>
    interview.overallLevel ||
    (interview.interviewType === "Technical"
      ? interview.overallTechnicalLevel
      : interview.overallHRLevel);

  const getInterviewOverallLabel = (level) => {
    switch (level) {
      case "B":
        return "Beginner";
      case "I":
        return "Intermediate";
      case "A":
        return "Advanced";
      case "E":
        return "Expert";
      case "F":
        return "Fail";
      case "C":
        return "Clear";
      case "P":
        return "Pass";
      default:
        return "-";
    }
  };

  const formatInterviewLevel = (level) => {
    if (!level) return "-";
    return getInterviewOverallLabel(level);
  };

  const getInterviewScoreColumns = (interview) => {
    if (interview.interviewType === "Technical") {
      return {
        communication: formatInterviewLevel(interview.technicalKnowledge),
        confidence: formatInterviewLevel(interview.problemSolving),
        clarity: formatInterviewLevel(interview.codingAbility || interview.logicAndApproach),
      };
    }

    return {
      communication: formatInterviewLevel(interview.communicationLevel),
      confidence: formatInterviewLevel(interview.confidenceLevel),
      clarity: formatInterviewLevel(interview.clarityLevel || interview.clarityOfAnswer),
    };
  };

  const getBackPath = () => {
    if (location.pathname.startsWith("/intern")) {
      return "/intern-dashboard";
    }

    if (location.pathname.startsWith("/admin")) {
      return "/admin-dashboard#reports-assessments";
    }

    const userRole = localStorage.getItem("userRole");
    return userRole === "intern" ? "/intern-dashboard" : "/admin-dashboard#reports-assessments";
  };

  const handleBack = () => {
    if (location.state && location.state.activeSection) {
      navigate(getBackPath(), { state: { activeSection: location.state.activeSection } });
    } else {
      navigate(getBackPath());
    }
  };

  useEffect(() => {
    fetchStudentAndRecords();
  }, [studentId]);

  const fetchStudentAndRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const isSelfReport = !studentId;
      const recordsResponse = isSelfReport
        ? await internAPI.getMyStudentRecords()
        : await adminAPI.getStudentRecords(studentId);

      if (recordsResponse.data.success) {
        setStudent(recordsResponse.data.data.student);
        setRecords({
          interviews: recordsResponse.data.data.interviews || [],
          aptitudes: recordsResponse.data.data.aptitudes || [],
          assessments: recordsResponse.data.data.assessments || [],
          trainings: recordsResponse.data.data.trainings || [],
        });
      } else {
        setError("Failed to load student data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const downloadReportPDF = () => {
    if (!hasFilteredRecords) {
      alert(
        selectedMonth
          ? "There are no records available for the selected month to generate a report."
          : "There are no records available to generate a report.",
      );
      return;
    }

    setDownloading(true);
    try {
      let htmlContent = `
        <html>
          <head>
            <title>Aspirant Report - ${student.name}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #1e293b; background-color: #ffffff; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #344158; padding-bottom: 20px; }
              .header .company { font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
              .header h1 { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0 0 8px 0; letter-spacing: -0.02em; }
              .header p { font-size: 14px; color: #475569; margin: 0; }
              .section { margin: 25px 0; }
              .section-title { font-size: 16px; font-weight: bold; color: #344158; margin: 15px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
              .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
              .info-item { padding: 10px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0; }
              .info-label { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
              .info-value { font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 5px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
              th { background-color: #344158; color: white; padding: 12px 10px; text-align: left; border: 1px solid #344158; font-weight: 600; }
              td { padding: 10px; border: 1px solid #e2e8f0; color: #334155; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .stat-section { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
              .stat-box { padding: 15px; background: #f8fafc; border-left: 4px solid #344158; text-align: center; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 0 4px 4px 0; }
              .stat-number { font-size: 24px; font-weight: bold; color: #344158; }
              .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
              .footer { margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; color: #94a3b8; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company">Progrentures Solution Pvt. Ltd.</div>
              <h1>PRS Portal Aspirant Report</h1>
              <p>Month: <strong>${selectedMonth ? formatMonthLabel(selectedMonth) : "Overall"}</strong> &nbsp;|&nbsp; Generated on: <strong>${new Date().toLocaleDateString('en-IN')}</strong></p>
            </div>

            <div class="section">
              <div class="section-title">Student Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Name</div>
                  <div class="info-value">${student.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">ID</div>
                  <div class="info-value">${student.internId}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${student.email}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Type</div>
                  <div class="info-value">${student.studentType}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Status</div>
                  <div class="info-value">${student.status}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Joining Date</div>
                  <div class="info-value">${student.joiningDate ? new Date(student.joiningDate).toLocaleDateString('en-IN') : 'N/A'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Assessment Summary</div>
              <div class="stat-section">
                <div class="stat-box">
                  <div class="stat-number">${records.interviews?.length || 0}</div>
                  <div class="stat-label">Interviews</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${records.aptitudes?.length || 0}</div>
                  <div class="stat-label">Aptitude Tests</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${records.assessments?.length || 0}</div>
                  <div class="stat-label">Assessments</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${records.trainings?.length || 0}</div>
                  <div class="stat-label">Trainings</div>
                </div>
              </div>
            </div>
      `;

      if (filteredRecords.interviews?.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">Interview Records</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Communication</th>
                  <th>Confidence</th>
                  <th>Clarity</th>
                  <th>Overall</th>
                  <th>Level Crossed</th>
                </tr>
              </thead>
              <tbody>
                ${filteredRecords.interviews.map(interview => {
          const scoreColumns = getInterviewScoreColumns(interview);
          const overallLevel = getInterviewOverallLevel(interview);
          return `
                  <tr>
                    <td>${interview.date ? new Date(interview.date).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td>${interview.interviewType}</td>
                    <td>${scoreColumns.communication}</td>
                    <td>${scoreColumns.confidence}</td>
                    <td>${scoreColumns.clarity}</td>
                    <td>${formatInterviewLevel(overallLevel)}</td>
                    <td>${interview.levelCrossed ? 'Yes' : 'No'}</td>
                  </tr>
                `;
        }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      if (filteredRecords.aptitudes?.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">Aptitude Test Records</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Round</th>
                  <th>Score</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                ${filteredRecords.aptitudes.map(apt => `
                  <tr>
                    <td>${apt.date ? new Date(apt.date).toLocaleDateString('en-IN') : apt.createdAt ? new Date(apt.createdAt).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td>Round ${apt.roundNumber}</td>
                    <td>${apt.score}</td>
                    <td>${apt.result}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      if (filteredRecords.assessments?.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">Assessment Records</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredRecords.assessments.map(assess => `
                  <tr>
                    <td>${assess.date ? new Date(assess.date).toLocaleDateString('en-IN') : assess.createdAt ? new Date(assess.createdAt).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td>${assess.assessmentType}</td>
                    <td>${assess.score || '-'}</td>
                    <td>${assess.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      if (filteredRecords.trainings?.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">Training Records</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Attendance</th>
                  <th>Engagement</th>
                </tr>
              </thead>
              <tbody>
                ${filteredRecords.trainings.map(training => `
                  <tr>
                    <td>${training.date ? new Date(training.date).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td>${training.attendance}</td>
                    <td>${training.engagementLevel}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      htmlContent += `
        <div class="footer">
          <p>Thank you. This report was generated on ${new Date().toLocaleString('en-IN')} by PRS Portal</p>
        </div>
          </body>
        </html>
      `;

      const printWindow = window.open("", "", "height=600,width=800");
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  const downloadReportExcel = async () => {
    if (!hasFilteredRecords) {
      alert(
        selectedMonth
          ? "There are no records available for the selected month to export Excel."
          : "There are no records available to export Excel.",
      );
      return;
    }

    setDownloading(true);
    try {
      const ws_data = [
        ["PRS Portal Aspirant Report"],
        ["Company", "Progrentures Solution Pvt. Ltd."],
        ["Generated on", new Date().toLocaleDateString('en-IN')],
        ["Month", selectedMonth ? formatMonthLabel(selectedMonth) : "Overall"],
        [],
        ["Student Information"],
        ["Name", student.name],
        ["ID", student.internId],
        ["Email", student.email],
        ["Type", student.studentType],
        ["Status", student.status],
        ["Joining Date", student.joiningDate ? new Date(student.joiningDate).toLocaleDateString('en-IN') : 'N/A'],
        [],
        ["Assessment Summary"],
        ["Interviews", records.interviews?.length || 0],
        ["Aptitude Tests", records.aptitudes?.length || 0],
        ["Assessments", records.assessments?.length || 0],
        ["Trainings", records.trainings?.length || 0],
      ];

      if (filteredRecords.interviews?.length > 0) {
        ws_data.push([], ["Interview Records"]);
        ws_data.push(["Date", "Type", "Communication", "Confidence", "Clarity", "Overall", "Level Crossed"]);
        filteredRecords.interviews.forEach(interview => {
          const scoreColumns = getInterviewScoreColumns(interview);
          const overallLevel = getInterviewOverallLevel(interview);
          ws_data.push([
            interview.date ? new Date(interview.date).toLocaleDateString('en-IN') : 'N/A',
            interview.interviewType,
            scoreColumns.communication,
            scoreColumns.confidence,
            scoreColumns.clarity,
            formatInterviewLevel(overallLevel),
            interview.levelCrossed ? 'Yes' : 'No'
          ]);
        });
      }

      if (filteredRecords.aptitudes?.length > 0) {
        ws_data.push([], ["Aptitude Test Records"]);
        ws_data.push(["Date", "Round", "Score", "Result"]);
        filteredRecords.aptitudes.forEach(apt => {
          ws_data.push([
            apt.date ? new Date(apt.date).toLocaleDateString('en-IN') : apt.createdAt ? new Date(apt.createdAt).toLocaleDateString('en-IN') : 'N/A',
            `Round ${apt.roundNumber}`,
            apt.score,
            apt.result
          ]);
        });
      }

      if (filteredRecords.assessments?.length > 0) {
        ws_data.push([], ["Assessment Records"]);
        ws_data.push(["Date", "Type", "Score", "Status"]);
        filteredRecords.assessments.forEach(assess => {
          ws_data.push([
            assess.date ? new Date(assess.date).toLocaleDateString('en-IN') : assess.createdAt ? new Date(assess.createdAt).toLocaleDateString('en-IN') : 'N/A',
            assess.assessmentType,
            assess.score || '-',
            assess.status
          ]);
        });
      }

      if (filteredRecords.trainings?.length > 0) {
        ws_data.push([], ["Training Records"]);
        ws_data.push(["Date", "Attendance", "Engagement"]);
        filteredRecords.trainings.forEach(training => {
          ws_data.push([
            training.date ? new Date(training.date).toLocaleDateString('en-IN') : 'N/A',
            training.attendance,
            training.engagementLevel
          ]);
        });
      }

      const csvContent = ws_data
        .map((row) =>
          row
            .map((val) => {
              const text = String(val === null || val === undefined ? "" : val);
              if (text.includes(",") || text.includes("\n") || text.includes('"')) {
                return `"${text.replace(/"/g, '""')}"`;
              }
              return text;
            })
            .join(",")
        )
        .join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Student_Report_${student.internId}_${selectedMonth || "overall"}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating Excel:", err);
      alert("Failed to export Excel report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !student) {
    return (
      <div className="student-detail-wrapper">
        <div className="student-detail-header">
          <div className="header-left">
            <h1>Aspirant Report</h1>
            <p>Complete assessment and training records</p>
          </div>
          <button
            onClick={handleBack}
            className="btn-back-new"
          >
            ← Back to Activity Records
          </button>
        </div>
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error || "Student not found"}</p>
          <button
            onClick={handleBack}
            className="btn-retry"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-detail-wrapper">
      {/* Header */}
      <div className="student-detail-header">
        <div className="header-left">
          <h1>Aspirant Report</h1>
          <p>Complete assessment and training records</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={downloadReportPDF}
            disabled={downloading}
            style={{
              padding: "10px 18px",
              background: "#344158",
              color: "white",
              border: "2px solid #344158",
              borderRadius: "8px",
              cursor: downloading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.3s ease",
              opacity: downloading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!downloading) {
                e.target.style.background = "#1e2d3d";
                e.target.style.borderColor = "#1e2d3d";
              }
            }}
            onMouseLeave={(e) => {
              if (!downloading) {
                e.target.style.background = "#344158";
                e.target.style.borderColor = "#344158";
              }
            }}
          >
            PDF
          </button>
          <button
            onClick={downloadReportExcel}
            disabled={downloading}
            style={{
              padding: "10px 18px",
              background: "#344158",
              color: "white",
              border: "2px solid #344158",
              borderRadius: "8px",
              cursor: downloading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.3s ease",
              opacity: downloading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!downloading) {
                e.target.style.background = "#1e2d3d";
                e.target.style.borderColor = "#1e2d3d";
              }
            }}
            onMouseLeave={(e) => {
              if (!downloading) {
                e.target.style.background = "#344158";
                e.target.style.borderColor = "#344158";
              }
            }}
          >
            Excel
          </button>
          <button
            onClick={handleBack}
            className="btn-back-new"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Month Filter */}
      <div className="report-filter-card">
        <div className="report-filter-header">
          <div>
            <span className="report-filter-kicker">Report Filter</span>
            <h3>Select month (optional)</h3>
            <p>If no month is selected, overall student report is shown.</p>
          </div>
          <div className="report-filter-badge">{allMonthOptions.length} months available</div>
        </div>

        <div className="report-filter-grid">
          <div className="detail-item report-filter-field">
            <span className="detail-label">Month</span>
            <div className="report-select-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="report-month-select"
              >
                <option value="">Select a month</option>
                {allMonthOptions.map((monthKey) => (
                  <option key={monthKey} value={monthKey}>
                    {formatMonthLabel(monthKey)}
                  </option>
                ))}
              </select>
            </div>
            <span className="report-filter-help">
              {selectedMonth ? `Showing ${formatMonthLabel(selectedMonth)}` : "Showing overall report"}
            </span>
          </div>

          <button
            onClick={() => setSelectedMonth("")}
            className="btn-back-new report-clear-button"
            disabled={!selectedMonth}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="student-info-card">
        <div className="student-info-header">
          <div className="student-avatar">{student.name.charAt(0).toUpperCase()}</div>
          <div className="student-basic-info">
            <h2>{student.name}</h2>
            <p className="student-id">{student.internId}</p>
          </div>
          <div className="student-status">
            <span className={`status-badge status-${student.status.toLowerCase()}`}>
              {student.status}
            </span>
          </div>
        </div>

        <div className="student-details-grid">
          <div className="detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-value">{student.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Student Type</span>
            <span className="detail-value">{student.studentType}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Joining Date</span>
            <span className="detail-value">
              {student.joiningDate
                ? new Date(student.joiningDate).toLocaleDateString("en-IN")
                : "N/A"}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Mobile</span>
            <span className="detail-value">{student.mobile || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card interview-card">
          <div className="stat-content">
            <div className="stat-value">{filteredRecords.interviews.length}</div>
            <div className="stat-label">Interviews</div>
          </div>
        </div>
        <div className="stat-card aptitude-card">
          <div className="stat-content">
            <div className="stat-value">{filteredRecords.aptitudes.length}</div>
            <div className="stat-label">Aptitude Tests</div>
          </div>
        </div>
        <div className="stat-card assessment-card">
          <div className="stat-content">
            <div className="stat-value">{filteredRecords.assessments.length}</div>
            <div className="stat-label">Assessments</div>
          </div>
        </div>
        <div className="stat-card training-card">
          <div className="stat-content">
            <div className="stat-value">{filteredRecords.trainings.length}</div>
            <div className="stat-label">Trainings</div>
          </div>
        </div>
      </div>

      {!hasFilteredRecords ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>
            {selectedMonth
              ? `No report found for ${formatMonthLabel(selectedMonth)}`
              : "No overall report records available"}
          </p>
        </div>
      ) : (
        <>

          {/* Interview Records */}
          {filteredRecords.interviews.length > 0 && (
            <div className="record-section">
              <div className="section-header">
                <div className="header-title">
                  <div>
                    <h3>Interview Records</h3>
                    <p className="record-count">{filteredRecords.interviews.length} interviews conducted</p>
                  </div>
                </div>
              </div>
              <div className="table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Attempt</th>
                      <th>Communication</th>
                      <th>Confidence</th>
                      <th>Clarity</th>
                      <th>Overall</th>
                      <th>Level Crossed</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.interviews.map((interview, idx) => {
                      const scoreColumns = getInterviewScoreColumns(interview);
                      const overallLevel = getInterviewOverallLevel(interview);
                      const remarksVal = interview.remarks || (interview.interviewType === "Technical" ? interview.technicalRemarks : interview.hrRemarks) || "";

                      return (
                      <tr key={idx} className="table-row">
                        <td className="date-cell">
                          {interview.date
                            ? new Date(interview.date).toLocaleDateString("en-IN")
                            : "N/A"}
                        </td>
                        <td>
                          <span className="type-badge">{interview.interviewType}</span>
                        </td>
                        <td>{interview.attemptNumber}</td>
                        <td>
                          <span className="level-badge">{scoreColumns.communication}</span>
                        </td>
                        <td>
                          <span className="level-badge">{scoreColumns.confidence}</span>
                        </td>
                        <td>
                          <span className="level-badge">{scoreColumns.clarity}</span>
                        </td>
                        <td>
                          {overallLevel ? (
                              <span className={`result-badge result-${String(overallLevel).toLowerCase()}`}>
                                {formatInterviewLevel(overallLevel)}
                              </span>
                            ) : (
                              "-"
                            )}
                        </td>
                        <td>
                          <span
                            className={`crossed-badge ${interview.levelCrossed ? "crossed-yes" : "crossed-no"}`}
                          >
                            {interview.levelCrossed ? "✓ Yes" : "✗ No"}
                          </span>
                        </td>
                        <td className="remarks-cell" title={remarksVal}>
                          {remarksVal ? (remarksVal.length > 30 ? remarksVal.substring(0, 30) + "..." : remarksVal) : "-"}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aptitude Tests */}
          {filteredRecords.aptitudes.length > 0 && (
            <div className="record-section">
              <div className="section-header">
                <div className="header-title">
                  <div>
                    <h3>Aptitude Test Records</h3>
                    <p className="record-count">{filteredRecords.aptitudes.length} tests completed</p>
                  </div>
                </div>
              </div>
              <div className="table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Round</th>
                      <th>Score</th>
                      <th>Result</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.aptitudes.map((aptitude, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="date-cell">
                          {aptitude.date
                            ? new Date(aptitude.date).toLocaleDateString("en-IN")
                            : aptitude.createdAt
                              ? new Date(aptitude.createdAt).toLocaleDateString("en-IN")
                              : "N/A"}
                        </td>
                        <td className="round-cell">Round {aptitude.roundNumber}</td>
                        <td className="score-cell">{aptitude.score}</td>
                        <td>
                          <span className={`result-badge result-${aptitude.result.toLowerCase()}`}>
                            {aptitude.result}
                          </span>
                        </td>
                        <td className="remarks-cell" title={aptitude.remarks}>
                          {aptitude.remarks ? aptitude.remarks.substring(0, 30) + "..." : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Assessments */}
          {filteredRecords.assessments.length > 0 && (
            <div className="record-section">
              <div className="section-header">
                <div className="header-title">
                  <div>
                    <h3>Assessment Records</h3>
                    <p className="record-count">{filteredRecords.assessments.length} assessments</p>
                  </div>
                </div>
              </div>
              <div className="table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.assessments.map((assessment, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="date-cell">
                          {assessment.date
                            ? new Date(assessment.date).toLocaleDateString("en-IN")
                            : assessment.createdAt
                              ? new Date(assessment.createdAt).toLocaleDateString("en-IN")
                              : "N/A"}
                        </td>
                        <td>
                          <span className="type-badge">{assessment.assessmentType}</span>
                        </td>
                        <td className="score-cell">
                          {assessment.score ? assessment.score : "-"}
                        </td>
                        <td>
                          <span
                            className={`result-badge result-${assessment.status.toLowerCase().replace(" ", "-")}`}
                          >
                            {assessment.status}
                          </span>
                        </td>
                        <td className="remarks-cell" title={assessment.feedback}>
                          {assessment.feedback ? assessment.feedback.substring(0, 30) + "..." : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trainings */}
          {filteredRecords.trainings.length > 0 && (
            <div className="record-section">
              <div className="section-header">
                <div className="header-title">
                  <div>
                    <h3>Training Records</h3>
                    <p className="record-count">{filteredRecords.trainings.length} trainings attended</p>
                  </div>
                </div>
              </div>
              <div className="table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Attendance</th>
                      <th>Engagement</th>
                      <th>Skill Note</th>
                      <th>Trainer Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.trainings.map((training, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="date-cell">
                          {training.date
                            ? new Date(training.date).toLocaleDateString("en-IN")
                            : "N/A"}
                        </td>
                        <td>
                          <span
                            className={`attendance-badge attendance-${training.attendance.toLowerCase()}`}
                          >
                            {training.attendance}
                          </span>
                        </td>
                        <td>
                          <span className="engagement-badge">{training.engagementLevel}</span>
                        </td>
                        <td className="remarks-cell" title={training.skillImprovementNote}>
                          {training.skillImprovementNote
                            ? training.skillImprovementNote.substring(0, 25) + "..."
                            : "-"}
                        </td>
                        <td className="remarks-cell" title={training.trainerRemarks}>
                          {training.trainerRemarks
                            ? training.trainerRemarks.substring(0, 25) + "..."
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
        </>
      )}
    </div>
  );
}

export default StudentDetailReport;
