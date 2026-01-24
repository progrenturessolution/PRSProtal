import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

function TrainerSidebar({ activeTab, setActiveTab }) {
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
  };

  return (
    <aside className="sidebar">
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
