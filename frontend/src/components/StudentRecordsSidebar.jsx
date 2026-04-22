import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { trainerAPI } from "../services/api";

const tabs = [
  { key: "interviews", label: "Interviews" },
  { key: "aptitude", label: "Aptitude" },
  { key: "assessments", label: "Assessments" },
  { key: "training", label: "Training" },
];

function StudentRecordsSidebar({ studentId, activeTab }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState(location.state?.student || null);

  useEffect(() => {
    const navStudent = location.state?.student;
    if (navStudent && navStudent._id === studentId) {
      setStudentInfo(navStudent);
      return;
    }

    const fetchStudent = async () => {
      try {
        const response = await trainerAPI.getAssignedStudents();
        if (!response.data?.success) return;
        const found = (response.data.students || []).find((s) => s?._id === studentId);
        if (found) {
          setStudentInfo(found);
        }
      } catch (error) {
        console.error("Failed to fetch student info for sidebar:", error);
      }
    };

    fetchStudent();
  }, [location.state, studentId]);

  const statusText = studentInfo?.status
    ? `${studentInfo.status.charAt(0).toUpperCase()}${studentInfo.status.slice(1)}`
    : "N/A";

  return (
    <div>
      <h3 className="student-records-nav-title">Student Records</h3>

      <div className="student-records-student-card">
        <div className="student-records-student-name">{studentInfo?.name || "Loading student..."}</div>
        <div className="student-records-student-id">ID: {studentInfo?.internId || "-"}</div>

        <div className="student-records-student-meta">
          <span>Email</span>
          <strong>{studentInfo?.email || "-"}</strong>
        </div>
        <div className="student-records-student-meta">
          <span>Mobile</span>
          <strong>{studentInfo?.mobile || "-"}</strong>
        </div>
        <div className="student-records-student-meta">
          <span>Status</span>
          <strong>{statusText}</strong>
        </div>
      </div>

      <div className="student-records-nav-list">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`student-records-nav-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() =>
              navigate(`/trainer/student/${studentId}/${tab.key}`, {
                state: {
                  student: studentInfo || location.state?.student || null,
                  fromTab: location.state?.fromTab || "assignments",
                },
              })
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StudentRecordsSidebar;
