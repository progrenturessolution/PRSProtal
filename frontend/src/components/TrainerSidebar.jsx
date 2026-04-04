import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

function TrainerSidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, selectedStudent, setSelectedStudent, selectedStudentTab, setSelectedStudentTab }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const userRole = localStorage.getItem("userRole");

    if (!storedUser || userRole !== "trainer") {
      navigate("/");
      return;
    }

    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleMenuClick = (tab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else {
      navigate(`/trainer-dashboard?tab=${tab}`);
    }
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <img src={logo} alt="Progrentures" className="sidebar-logo" />
        </div>
        <h2>PROGRENTURES</h2>
        <p>Trainer Portal</p>
      </div>

      <div className="trainer-profile-mini">
        <div className="profile-avatar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div className="profile-info">
          <p className="profile-name">{user?.name}</p>
          <p className="profile-role">Trainer</p>
        </div>
      </div>

      <ul className="sidebar-menu">
        <li className="menu-section-header">MAIN MENU</li>

        <li
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => handleMenuClick("overview")}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
            />
          </svg>
          Dashboard
        </li>

        <li
          className={activeTab === "students" ? "active" : ""}
          onClick={() => handleMenuClick("students")}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          My Students
        </li>

        <li
          className={activeTab === "assignments" ? "active" : ""}
          onClick={() => handleMenuClick("assignments")}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 100-4H5a2 2 0 100 4m14 0a2 2 0 110 4H5a2 2 0 110-4m0 0v6a2 2 0 002 2h10a2 2 0 002-2v-6"
            />
          </svg>
          My Assignments
        </li>

        

        <li className="menu-section-header">COMMUNICATION</li>

        <li
          className={activeTab === "notifications" ? "active" : ""}
          onClick={() => handleMenuClick("notifications")}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          Notifications
        </li>

        {selectedStudent && (
          <>
            <li className="menu-section-header" style={{ color: '#667eea', marginTop: '16px' }}>SELECTED STUDENT</li>
            <li 
              style={{ 
                padding: '12px 16px', 
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                borderRadius: '6px',
                marginBottom: '8px',
                cursor: 'default'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '600', wordBreak: 'break-word' }}>
                {selectedStudent.name}
              </div>
              <div style={{ fontSize: '11px', opacity: '0.8', marginTop: '4px' }}>
                {selectedStudent.internId}
              </div>
            </li>

            <li
              style={{
                padding: '11px 16px 11px 32px',
                background: selectedStudentTab === 'interviews' ? 'linear-gradient(135deg, #667eea15, #764ba215)' : 'transparent',
                borderLeft: selectedStudentTab === 'interviews' ? '4px solid #667eea' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderLeftWidth: '4px',
                paddingLeft: selectedStudentTab === 'interviews' ? '28px' : '32px',
                fontWeight: selectedStudentTab === 'interviews' ? '600' : '500',
                color: selectedStudentTab === 'interviews' ? '#4f46e5' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea10, #764ba210)';
                e.currentTarget.style.color = '#c7d2fe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedStudentTab === 'interviews' ? 'linear-gradient(135deg, #667eea15, #764ba215)' : 'transparent';
                e.currentTarget.style.color = selectedStudentTab === 'interviews' ? '#4f46e5' : '#e5e7eb';
              }}
              onClick={() => {
                setSelectedStudentTab('interviews');
                setActiveTab('student-records');
                if (setSidebarOpen) setSidebarOpen(false);
              }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '12px' }}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Interviews
            </li>

            <li
              style={{
                padding: '11px 16px 11px 32px',
                background: selectedStudentTab === 'aptitude' ? 'linear-gradient(135deg, #667eea15, #764ba215)' : 'transparent',
                borderLeft: selectedStudentTab === 'aptitude' ? '4px solid #667eea' : '2px solid transparent',
                cursor: 'pointer',
                paddingLeft: selectedStudentTab === 'aptitude' ? '28px' : '32px',
                color: selectedStudentTab === 'aptitude' ? '#4f46e5' : '#e5e7eb',
                fontWeight: selectedStudentTab === 'aptitude' ? '600' : '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea10, #764ba210)';
                e.currentTarget.style.color = '#c7d2fe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedStudentTab === 'aptitude' ? 'linear-gradient(135deg, #667eea15, #764ba215)' : 'transparent';
                e.currentTarget.style.color = selectedStudentTab === 'aptitude' ? '#4f46e5' : '#e5e7eb';
              }}
              onClick={() => {
                setSelectedStudentTab('aptitude');
                setActiveTab('student-records');
                if (setSidebarOpen) setSidebarOpen(false);
              }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '12px' }}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7 12a5 5 0 1 0 10 0 5 5 0 0 0-10 0z"
                />
              </svg>
              Aptitude
            </li>

            <li
              style={{
                padding: '11px 16px 11px 32px',
                background: selectedStudentTab === 'assessments' ? 'linear-gradient(135deg, #667eea15, #764ba215)' : 'transparent',
                borderLeft: selectedStudentTab === 'assessments' ? '4px solid #667eea' : '2px solid transparent',
                cursor: 'pointer',
                paddingLeft: selectedStudentTab === 'assessments' ? '28px' : '32px',
                color: selectedStudentTab === 'assessments' ? '#4f46e5' : '#e5e7eb',
                fontWeight: selectedStudentTab === 'assessments' ? '600' : '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea10, #764ba210)';
                e.currentTarget.style.color = '#c7d2fe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedStudentTab === 'assessments' ? 'linear-gradient(135deg, #667eea15, #764ba215)' : 'transparent';
                e.currentTarget.style.color = selectedStudentTab === 'assessments' ? '#4f46e5' : '#e5e7eb';
              }}
              onClick={() => {
                setSelectedStudentTab('assessments');
                setActiveTab('student-records');
                if (setSidebarOpen) setSidebarOpen(false);
              }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '12px' }}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              Assessments
            </li>

            <li
              style={{
                padding: '11px 16px 11px 32px',
                background: selectedStudentTab === 'training' ? 'linear-gradient(135deg, #667eea15, #764ba215)' : 'transparent',
                borderLeft: selectedStudentTab === 'training' ? '4px solid #667eea' : '2px solid transparent',
                cursor: 'pointer',
                paddingLeft: selectedStudentTab === 'training' ? '28px' : '32px',
                color: selectedStudentTab === 'training' ? '#4f46e5' : '#e5e7eb',
                fontWeight: selectedStudentTab === 'training' ? '600' : '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea10, #764ba210)';
                e.currentTarget.style.color = '#c7d2fe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedStudentTab === 'training' ? 'linear-gradient(135deg, #667eea15, #764ba215)' : 'transparent';
                e.currentTarget.style.color = selectedStudentTab === 'training' ? '#4f46e5' : '#e5e7eb';
              }}
              onClick={() => {
                setSelectedStudentTab('training');
                setActiveTab('student-records');
                if (setSidebarOpen) setSidebarOpen(false);
              }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '12px' }}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z"
                />
              </svg>
              Training
            </li>

            <li
              onClick={() => {
                setSelectedStudent(null);
                setSelectedStudentTab(null);
                setActiveTab('students');
              }}
              style={{
                marginTop: '8px',
                padding: '10px 16px',
                borderRadius: '6px',
                background: '#fee2e2',
                color: '#dc2626',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Clear Selection
            </li>
          </>
        )}

        <li className="menu-section-header">SETTINGS</li>

        <li
          className={activeTab === "profile" ? "active" : ""}
          onClick={() => handleMenuClick("profile")}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Profile
        </li>

        <li onClick={handleLogout}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </li>
      </ul>
    </aside>
  );
}

export default TrainerSidebar;
