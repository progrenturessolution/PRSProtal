import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { key: "interviews", label: "Interviews" },
  { key: "aptitude", label: "Aptitude" },
  { key: "assessments", label: "Assessments" },
  { key: "training", label: "Training" },
  { key: "gd", label: "GD" },
];

function StudentRecordsSidebar({ studentId, activeTab, onTabChange, studentInfo: providedStudentInfo, interviewOnly = false, lockedTab = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const studentInfo = providedStudentInfo || location.state?.student || null;
  const [notice, setNotice] = useState("");

  const handleTabClick = (tab) => {
    // If a lockedTab is set, prevent switching to other tabs but keep them visible
    if (lockedTab && tab.key !== lockedTab) {
      const lockedLabelObj = tabs.find(t => t.key === lockedTab);
      const lockedLabel = lockedLabelObj ? lockedLabelObj.label : (lockedTab || 'records').toString().toUpperCase();
      setNotice(`You can only record ${lockedLabel} from here.`);
      setTimeout(() => setNotice(""), 3000);
      return;
    }

    if (interviewOnly && tab.key !== "interviews") {
      setNotice("You can only record Interviews from here.");
      setTimeout(() => setNotice(""), 3000);
      return;
    }

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
  };

  return (
    <div className="student-records-sidebar">
      <section className="student-records-nav-card">
        <p className="student-records-nav-label">Record Modules</p>
        <div className="student-records-nav-list">
        {notice && (
          <div style={{ padding: '8px 12px', background: '#fff7ed', color: '#92400e', borderRadius: 6, marginBottom: 8, fontSize: 13 }}>
            {notice}
          </div>
        )}

        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`student-records-nav-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => handleTabClick(tab)}
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
