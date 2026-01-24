import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { trainerAPI } from "../services/api";
import logo from "../assets/logo.png";
import TrainerSidebar from "../components/TrainerSidebar";

function TrainerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [studentFilter, setStudentFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const userRole = localStorage.getItem("userRole");

    if (!storedUser || userRole !== "trainer") {
      navigate("/");
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchAssignedStudents();
  }, [navigate]);

  const fetchAssignedStudents = async () => {
    try {
      const response = await trainerAPI.getAssignedStudents();
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (studentId, newStatus) => {
    try {
      await trainerAPI.updateStudentStatus(studentId, newStatus);
      // Update local state
      setStudents(
        students.map((student) =>
          student._id === studentId
            ? { ...student, status: newStatus }
            : student,
        ),
      );
      setSuccessMessage(`Student marked as ${newStatus}`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("Error updating student status:", error);
      alert("Failed to update student status");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <TrainerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Clean Enterprise Content */}
      <main className="main-content">
        <div className="dashboard-content">
          {activeTab === "overview" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Dashboard</h1>
                  <p className="header-subtitle">Welcome back, {user?.name}</p>
                </div>
                <div className="header-right">
                  <div className="date-badge">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Premium Stats Cards */}
              <div className="premium-stats-grid">
                <div
                  className="premium-stat-card accent-blue"
                  onClick={() => {
                    setActiveTab("students");
                    setStudentFilter("all");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Total Students</div>
                    <div className="stat-value">{students.length}</div>
                    <div className="stat-meta">Assigned to you</div>
                  </div>
                </div>

                <div
                  className="premium-stat-card accent-teal"
                  onClick={() => {
                    setActiveTab("students");
                    setStudentFilter("active");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Active Training</div>
                    <div className="stat-value">
                      {students.filter((s) => s.status === "active").length}
                    </div>
                    <div className="stat-meta">Currently enrolled</div>
                  </div>
                </div>

                <div
                  className="premium-stat-card accent-indigo"
                  onClick={() => {
                    setActiveTab("students");
                    setStudentFilter("completed");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Completed</div>
                    <div className="stat-value">
                      {students.filter((s) => s.status === "completed").length}
                    </div>
                    <div className="stat-meta">Training finished</div>
                  </div>
                </div>

                <div className="premium-stat-card accent-slate">
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Pending Reviews</div>
                    <div className="stat-value">0</div>
                    <div className="stat-meta">Awaiting feedback</div>
                  </div>
                </div>
              </div>

              {/* Premium Action Cards */}
              <div className="premium-action-grid">
                <div className="premium-action-card">
                  <div className="action-card-icon blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="action-card-content">
                    <h3>Manage Students</h3>
                    <p>View and track student progress</p>
                  </div>
                  <button
                    className="action-card-btn"
                    onClick={() => setActiveTab("students")}
                  >
                    View
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "students" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Assigned Students List</h1>
                  <p className="header-subtitle">
                    Manage your assigned students
                  </p>
                </div>
              </div>

              <div
                className="filter-section"
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ marginRight: "10px" }}>
                    Filter Students:
                  </label>
                  <select
                    value={studentFilter}
                    onChange={(e) => setStudentFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="all">All Students</option>
                    <option value="active">Active Training</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {successMessage && (
                <div
                  className="success-message"
                  style={{ marginBottom: "20px" }}
                >
                  {successMessage}
                </div>
              )}

              <div className="premium-card">
                {(() => {
                  const filteredStudents = students.filter((student) => {
                    if (studentFilter === "all") return true;
                    return (
                      student.status ===
                      (studentFilter === "active" ? "active" : "completed")
                    );
                  });
                  return filteredStudents.length === 0 ? (
                    <div className="premium-empty-state">
                      <div className="empty-icon">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <p className="empty-title">No students assigned</p>
                      <p className="empty-subtitle">
                        Students assigned to you will appear here
                      </p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="premium-table">
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Student Name</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student) => (
                            <tr key={student._id}>
                              <td className="mono-text">{student.internId}</td>
                              <td className="font-medium">{student.name}</td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/trainer/student/${student._id}/interviews`,
                                      )
                                    }
                                    className="table-action-btn"
                                  >
                                    Interviews
                                  </button>
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/trainer/student/${student._id}/aptitude`,
                                      )
                                    }
                                    className="table-action-btn"
                                  >
                                    Aptitude
                                  </button>
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/trainer/student/${student._id}/assessments`,
                                      )
                                    }
                                    className="table-action-btn"
                                  >
                                    Assessments
                                  </button>
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/trainer/student/${student._id}/training`,
                                      )
                                    }
                                    className="table-action-btn"
                                  >
                                    Training
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(student._id, "active")
                                    }
                                    className="table-action-btn"
                                    style={{ backgroundColor: "#10b981" }}
                                  >
                                    Mark Active
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(
                                        student._id,
                                        "completed",
                                      )
                                    }
                                    className="table-action-btn"
                                    style={{ backgroundColor: "#3b82f6" }}
                                  >
                                    Mark Completed
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Notifications</h1>
                  <p className="header-subtitle">
                    Stay updated with recent activities
                  </p>
                </div>
              </div>

              <div className="premium-card">
                <div className="premium-empty-state">
                  <div className="empty-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <p className="empty-title">No notifications</p>
                  <p className="empty-subtitle">
                    You're all caught up! New updates will appear here
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === "profile" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>My Profile</h1>
                  <p className="header-subtitle">
                    Manage your personal information
                  </p>
                </div>
                <div className="header-right">
                  <button className="premium-btn-secondary">
                    Edit Profile
                  </button>
                </div>
              </div>

              <div className="premium-card">
                <div className="premium-card-header">
                  <h2>Personal Information</h2>
                </div>

                <div className="profile-info-grid">
                  <div className="profile-field">
                    <label>Full Name</label>
                    <div className="field-value">{user?.name}</div>
                  </div>
                  <div className="profile-field">
                    <label>Email Address</label>
                    <div className="field-value mono-text">{user?.email}</div>
                  </div>
                  <div className="profile-field">
                    <label>Mobile Number</label>
                    <div className="field-value mono-text">
                      {user?.mobile || "Not available"}
                    </div>
                  </div>
                  <div className="profile-field">
                    <label>Role</label>
                    <div className="field-value">
                      <span className="badge-neutral">
                        {user?.role || "Trainer"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="info-banner">
                  <strong>Need to update your information?</strong>
                  <p>
                    Please contact your administrator to update your profile
                    information.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default TrainerDashboard;
