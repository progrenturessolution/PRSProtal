import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminAPI, trainerAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import "./StudentDetailReport.css";

function StudentDetailReport() {
  const { studentId } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchStudentAndRecords();
  }, [studentId]);

  const fetchStudentAndRecords = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all students to find the one we need
      const studentsResponse = await adminAPI.getAllInterns();
      if (studentsResponse.data.success) {
        const foundStudent = studentsResponse.data.interns.find(
          (s) => s._id === studentId
        );
        setStudent(foundStudent);

        if (!foundStudent) {
          setError("Student not found");
          setLoading(false);
          return;
        }
      }

      // Fetch student records
      try {
        const recordsResponse = await trainerAPI.getStudentRecords(studentId);
        if (recordsResponse.data.success) {
          setRecords(recordsResponse.data.data);
        }
      } catch (err) {
        // If trainer API fails, continue with empty records
        console.log("Could not fetch trainer records");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const downloadReportPDF = () => {
    setDownloading(true);
    try {
      let htmlContent = `
        <html>
          <head>
            <title>Student Report - ${student.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #324158; padding-bottom: 15px; }
              .header h1 { margin: 10px 0; color: #324158; }
              .section { margin: 20px 0; }
              .section-title { font-size: 16px; font-weight: bold; color: #324158; margin: 15px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
              .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
              .info-item { padding: 10px; background: #f8fafc; border-radius: 4px; }
              .info-label { font-size: 12px; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
              .info-value { font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 5px; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th { background-color: #324158; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }
              td { padding: 8px; border: 1px solid #e2e8f0; }
              tr:nth-child(even) { background-color: #f9fafb; }
              .stat-section { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
              .stat-box { padding: 15px; background: #f8fafc; border-left: 4px solid #324158; text-align: center; }
              .stat-number { font-size: 24px; font-weight: bold; color: #324158; }
              .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
              .footer { margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Student Assessment Report</h1>
              <p>${new Date().toLocaleDateString('en-IN')}</p>
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

      if (records.interviews?.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">Interview Records</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Overall</th>
                  <th>Level Crossed</th>
                </tr>
              </thead>
              <tbody>
                ${records.interviews.map(interview => `
                  <tr>
                    <td>${interview.date ? new Date(interview.date).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td>${interview.interviewType}</td>
                    <td>${interview.overallLevel === 'E' ? 'Excellent' : interview.overallLevel === 'P' ? 'Pass' : interview.overallLevel === 'C' ? 'Clear' : 'Fail'}</td>
                    <td>${interview.levelCrossed ? 'Yes' : 'No'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      if (records.aptitudes?.length > 0) {
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
                ${records.aptitudes.map(apt => `
                  <tr>
                    <td>${apt.createdAt ? new Date(apt.createdAt).toLocaleDateString('en-IN') : 'N/A'}</td>
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

      if (records.assessments?.length > 0) {
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
                ${records.assessments.map(assess => `
                  <tr>
                    <td>${assess.createdAt ? new Date(assess.createdAt).toLocaleDateString('en-IN') : 'N/A'}</td>
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

      if (records.trainings?.length > 0) {
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
                ${records.trainings.map(training => `
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
          <p>This report was generated on ${new Date().toLocaleString('en-IN')}</p>
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
    setDownloading(true);
    try {
      const XLSX = await import("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm");

      const ws_data = [
        ["Student Assessment Report"],
        ["Generated on", new Date().toLocaleDateString('en-IN')],
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

      if (records.interviews?.length > 0) {
        ws_data.push([], ["Interview Records"]);
        ws_data.push(["Date", "Type", "Overall", "Level Crossed"]);
        records.interviews.forEach(interview => {
          ws_data.push([
            interview.date ? new Date(interview.date).toLocaleDateString('en-IN') : 'N/A',
            interview.interviewType,
            interview.overallLevel === 'E' ? 'Excellent' : interview.overallLevel === 'P' ? 'Pass' : interview.overallLevel === 'C' ? 'Clear' : 'Fail',
            interview.levelCrossed ? 'Yes' : 'No'
          ]);
        });
      }

      if (records.aptitudes?.length > 0) {
        ws_data.push([], ["Aptitude Test Records"]);
        ws_data.push(["Date", "Round", "Score", "Result"]);
        records.aptitudes.forEach(apt => {
          ws_data.push([
            apt.createdAt ? new Date(apt.createdAt).toLocaleDateString('en-IN') : 'N/A',
            `Round ${apt.roundNumber}`,
            apt.score,
            apt.result
          ]);
        });
      }

      if (records.assessments?.length > 0) {
        ws_data.push([], ["Assessment Records"]);
        ws_data.push(["Date", "Type", "Score", "Status"]);
        records.assessments.forEach(assess => {
          ws_data.push([
            assess.createdAt ? new Date(assess.createdAt).toLocaleDateString('en-IN') : 'N/A',
            assess.assessmentType,
            assess.score || '-',
            assess.status
          ]);
        });
      }

      if (records.trainings?.length > 0) {
        ws_data.push([], ["Training Records"]);
        ws_data.push(["Date", "Attendance", "Engagement"]);
        records.trainings.forEach(training => {
          ws_data.push([
            training.date ? new Date(training.date).toLocaleDateString('en-IN') : 'N/A',
            training.attendance,
            training.engagementLevel
          ]);
        });
      }

      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Student Report");

      XLSX.writeFile(wb, `Student_Report_${student.internId}_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err) {
      console.error("Error generating Excel:", err);
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
            <h1>Student Report</h1>
            <p>Complete assessment and training records</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn-back-new">
            ← Back to Reports
          </button>
        </div>
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error || "Student not found"}</p>
          <button onClick={() => navigate(-1)} className="btn-retry">
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
          <h1>Student Report</h1>
          <p>Complete assessment and training records</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={downloadReportPDF}
            disabled={downloading}
            style={{
              padding: "10px 18px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: downloading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.3s ease",
              opacity: downloading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!downloading) e.target.style.background = "#dc2626";
            }}
            onMouseLeave={(e) => {
              if (!downloading) e.target.style.background = "#ef4444";
            }}
          >
            PDF
          </button>
          <button
            onClick={downloadReportExcel}
            disabled={downloading}
            style={{
              padding: "10px 18px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: downloading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.3s ease",
              opacity: downloading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!downloading) e.target.style.background = "#059669";
            }}
            onMouseLeave={(e) => {
              if (!downloading) e.target.style.background = "#10b981";
            }}
          >
            Excel
          </button>
          <button onClick={() => navigate(-1)} className="btn-back-new">
            ← Back
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
            <div className="stat-value">{records.interviews?.length || 0}</div>
            <div className="stat-label">Interviews</div>
          </div>
        </div>
        <div className="stat-card aptitude-card">
          <div className="stat-content">
            <div className="stat-value">{records.aptitudes?.length || 0}</div>
            <div className="stat-label">Aptitude Tests</div>
          </div>
        </div>
        <div className="stat-card assessment-card">
          <div className="stat-content">
            <div className="stat-value">{records.assessments?.length || 0}</div>
            <div className="stat-label">Assessments</div>
          </div>
        </div>
        <div className="stat-card training-card">
          <div className="stat-content">
            <div className="stat-value">{records.trainings?.length || 0}</div>
            <div className="stat-label">Trainings</div>
          </div>
        </div>
      </div>

      {/* Interview Records */}
      {records.interviews && records.interviews.length > 0 && (
        <div className="record-section">
          <div className="section-header">
            <div className="header-title">
              <div>
                <h3>Interview Records</h3>
                <p className="record-count">{records.interviews.length} interviews conducted</p>
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
                {records.interviews.map((interview, idx) => (
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
                      <span className="level-badge">{interview.communicationLevel}</span>
                    </td>
                    <td>
                      <span className="level-badge">{interview.confidenceLevel}</span>
                    </td>
                    <td>
                      <span className="level-badge">{interview.clarityLevel}</span>
                    </td>
                    <td>
                      <span
                        className={`result-badge result-${interview.overallLevel.toLowerCase()}`}
                      >
                        {interview.overallLevel === "E"
                          ? "Excellent"
                          : interview.overallLevel === "P"
                            ? "Pass"
                            : interview.overallLevel === "C"
                              ? "Clear"
                              : "Fail"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`crossed-badge ${interview.levelCrossed ? "crossed-yes" : "crossed-no"}`}
                      >
                        {interview.levelCrossed ? "✓ Yes" : "✗ No"}
                      </span>
                    </td>
                    <td className="remarks-cell" title={interview.remarks}>
                      {interview.remarks ? interview.remarks.substring(0, 30) + "..." : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aptitude Tests */}
      {records.aptitudes && records.aptitudes.length > 0 && (
        <div className="record-section">
          <div className="section-header">
            <div className="header-title">
              <div>
                <h3>Aptitude Test Records</h3>
                <p className="record-count">{records.aptitudes.length} tests completed</p>
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
                {records.aptitudes.map((aptitude, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="date-cell">
                      {aptitude.createdAt
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
      {records.assessments && records.assessments.length > 0 && (
        <div className="record-section">
          <div className="section-header">
            <div className="header-title">
              <div>
                <h3>Assessment Records</h3>
                <p className="record-count">{records.assessments.length} assessments</p>
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
                {records.assessments.map((assessment, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="date-cell">
                      {assessment.createdAt
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
      {records.trainings && records.trainings.length > 0 && (
        <div className="record-section">
          <div className="section-header">
            <div className="header-title">
              <div>
                <h3>Training Records</h3>
                <p className="record-count">{records.trainings.length} trainings attended</p>
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
                {records.trainings.map((training, idx) => (
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
      {!records.interviews?.length &&
        !records.aptitudes?.length &&
        !records.assessments?.length &&
        !records.trainings?.length && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No assessment records found for this student</p>
          </div>
        )}
    </div>
  );
}

export default StudentDetailReport;
