import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { key: "interviews", label: "Interviews" },
  { key: "aptitude", label: "Aptitude" },
  { key: "assessments", label: "Assessments" },
  { key: "training", label: "Training" },
];

function StudentRecordsSidebar({ studentId, activeTab, onTabChange, studentInfo: providedStudentInfo }) {
  const location = useLocation();
  const navigate = useNavigate();
  const studentInfo = providedStudentInfo || location.state?.student || null;

  return (
    <div className="student-records-sidebar">
      <section className="student-records-nav-card">
        <p className="student-records-nav-label">Record Modules</p>
        <div className="student-records-nav-list">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`student-records-nav-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => {
              if (onTabChange) {
                onTabChange(tab.key);
                return;
              }

              navigate(`/trainer/student/${studentId}/${tab.key}`, {
                state: {
                  student: studentInfo || location.state?.student || null,
                  fromTab: location.state?.fromTab || "assignments",
                },
              });
            }}
          >
            {tab.label}
          </button>
        ))}
        </div>
      </section>
    </div>
  );
}

export default StudentRecordsSidebar;
