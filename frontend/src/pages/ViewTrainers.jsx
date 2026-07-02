import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";

function ViewTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllTrainers();
      if (response.data.success) {
        setTrainers(response.data.trainers || []);
      }
    } catch (error) {
      console.error("Failed to fetch trainers:", error);
      setError("Failed to load trainers");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrainer = async (trainerId, trainerName) => {
    if (
      window.confirm(
        `Are you sure you want to delete trainer "${trainerName}"? This action cannot be undone.`
      )
    ) {
      try {
        const response = await adminAPI.deleteTrainer(trainerId);
        if (response.data.success) {
          setTrainers(trainers.filter((t) => t._id !== trainerId));
          setOpenMenuId(null);
          alert("Trainer deleted successfully");
        } else {
          alert(response.data.message || "Failed to delete trainer");
        }
      } catch (error) {
        console.error("Delete trainer error:", error);
        alert("Failed to delete trainer. Please try again.");
      }
    }
  };

  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.mobile?.includes(searchQuery) ||
      trainer.role?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="content-header">
        <h1>Loading trainers...</h1>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1>All Trainers</h1>
        <p>View and manage all trainers in the system</p>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="🔍 Search by name, email, mobile, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "15px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>
          <div
            style={{
              padding: "12px 20px",
              background: "#f3f4f6",
              borderRadius: "8px",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Total: {filteredTrainers.length}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            borderRadius: "12px",
            padding: "20px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Total Trainers
          </div>
          <div style={{ fontSize: "32px", fontWeight: "700" }}>
            {trainers.length}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: "12px",
            padding: "20px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Active Trainers
          </div>
          <div style={{ fontSize: "32px", fontWeight: "700" }}>
            {trainers.filter((t) => t.status === "Active").length}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            borderRadius: "12px",
            padding: "20px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            HR Personnel
          </div>
          <div style={{ fontSize: "32px", fontWeight: "700" }}>
            {trainers.filter((t) => t.role === "hr").length}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
            borderRadius: "12px",
            padding: "20px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Total Assignments
          </div>
          <div style={{ fontSize: "32px", fontWeight: "700" }}>
            {trainers.reduce(
              (sum, t) => sum + (t.assignedStudents?.length || 0),
              0,
            )}
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card">
        <h3 style={{ marginBottom: "20px" }}>Employees List</h3>

        {filteredTrainers.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#f9fafb",
              borderRadius: "12px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}></div>
            <h3 style={{ color: "#6b7280", marginBottom: "8px" }}>
              {searchQuery ? "No trainers found" : "No trainers added yet"}
            </h3>
            <p style={{ color: "#9ca3af" }}>
              {searchQuery
                ? "Try a different search term"
                : "Add employees from Employee Management"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Assigned Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainers.map((trainer, index) => (
                  <tr key={trainer._id}>
                    <td style={{ fontWeight: "600", color: "#6b7280" }}>
                      {index + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: "600", color: "#0f172a" }}>
                        {trainer.name}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "13px",
                          color: "#3b82f6",
                        }}
                      >
                        {trainer.email}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{ fontFamily: "monospace", fontSize: "13px" }}
                      >
                        {trainer.mobile}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          textTransform: "capitalize",
                          background:
                            trainer.role === "hr" ? "#fef3c7" : "#e0e7ff",
                          color: trainer.role === "hr" ? "#92400e" : "#3730a3",
                        }}
                      >
                        {trainer.role}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {trainer.assignedStudents &&
                        trainer.assignedStudents.length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "4px",
                            }}
                          >
                            {trainer.assignedStudents
                              .slice(0, 3)
                              .map((student, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 6px",
                                    background: "#e0f2fe",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "500",
                                    color: "#0277bd",
                                  }}
                                >
                                  {student.name}
                                </span>
                              ))}
                            {trainer.assignedStudents.length > 3 && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#64748b",
                                  fontWeight: "500",
                                }}
                              >
                                +{trainer.assignedStudents.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              color: "#9ca3af",
                              fontStyle: "italic",
                              fontSize: "13px",
                            }}
                          >
                            No students assigned
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          trainer.status === "Active"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {trainer.status}
                      </span>
                    </td>
                    <td style={{ position: "relative" }}>
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === trainer._id ? null : trainer._id,
                          )
                        }
                        style={{
                          background: "#f8fafc",
                          border: "none",
                          borderRadius: "8px",
                          width: "36px",
                          height: "36px",
                          cursor: "pointer",
                          fontSize: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#e2e8f0")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#f8fafc")
                        }
                      >
                        ⋮
                      </button>

                      {openMenuId === trainer._id && (
                        <div
                          style={{
                            position: "absolute",
                            right: "42px",
                            top: "0",
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            zIndex: 10000,
                            minWidth: "160px",
                            overflow: "hidden",
                          }}
                        >
                          <button
                            onClick={() => {
                              setSelectedTrainer(trainer);
                              setOpenMenuId(null);
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              background: "white",
                              border: "none",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#0f172a",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.background =
                                "linear-gradient(135deg, #f97316 0%, #ea580c 100%)")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "white")
                            }
                          >
                            View Full Details
                          </button>
                          <div
                            style={{
                              height: "1px",
                              background: "#e5e7eb",
                              margin: "0",
                            }}
                          ></div>
                          <button
                            onClick={() => {
                              handleDeleteTrainer(trainer._id, trainer.name);
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              background: "white",
                              border: "none",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#dc2626",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.background = "#fee2e2")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "white")
                            }
                          >
                            Delete Trainer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trainer Details Modal */}
      {selectedTrainer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 11000,
          }}
          onClick={() => setSelectedTrainer(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              maxWidth: "700px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                padding: "24px",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                color: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2
                    style={{ margin: 0, fontSize: "28px", fontWeight: "700" }}
                  >
                    {selectedTrainer.name}
                  </h2>
                  <p
                    style={{
                      margin: "8px 0 0 0",
                      opacity: 0.95,
                      fontSize: "15px",
                    }}
                  >
                    Complete Trainer Profile
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTrainer(null)}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    fontSize: "28px",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "rgba(255, 255, 255, 0.3)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "rgba(255, 255, 255, 0.2)")
                  }
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "32px" }}>
              {/* Personal Information */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 20px 0",
                    color: "#0c4a6e",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span></span> Personal Information
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#075985",
                        marginBottom: "6px",
                      }}
                    >
                      Full Name
                    </label>
                    <div
                      style={{
                        fontSize: "16px",
                        color: "#0c4a6e",
                        fontWeight: "600",
                      }}
                    >
                      {selectedTrainer.name}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#075985",
                        marginBottom: "6px",
                      }}
                    >
                      Email Address
                    </label>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#0369a1",
                        fontFamily: "monospace",
                      }}
                    >
                      {selectedTrainer.email}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#075985",
                        marginBottom: "6px",
                      }}
                    >
                      Mobile Number
                    </label>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#0c4a6e",
                        fontFamily: "monospace",
                      }}
                    >
                      {selectedTrainer.mobile}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#075985",
                        marginBottom: "6px",
                      }}
                    >
                      Role
                    </label>
                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 14px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: "600",
                          textTransform: "capitalize",
                          background:
                            selectedTrainer.role === "hr"
                              ? "#fef3c7"
                              : "#e0e7ff",
                          color:
                            selectedTrainer.role === "hr"
                              ? "#92400e"
                              : "#3730a3",
                        }}
                      >
                        {selectedTrainer.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Assignment Information */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 20px 0",
                    color: "#14532d",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span></span> Status & Assignments
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#166534",
                        marginBottom: "6px",
                      }}
                    >
                      Current Status
                    </label>
                    <div>
                      <span
                        className={`status-badge ${
                          selectedTrainer.status === "Active"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                        style={{ fontSize: "14px", padding: "6px 14px" }}
                      >
                        {selectedTrainer.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#166534",
                        marginBottom: "6px",
                      }}
                    >
                      Assigned Students
                    </label>
                    <div
                      style={{
                        fontSize: "24px",
                        color: "#14532d",
                        fontWeight: "700",
                      }}
                    >
                      {selectedTrainer.assignedStudents?.length || 0}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#166534",
                        marginBottom: "6px",
                      }}
                    >
                      Joined Date
                    </label>
                    <div style={{ fontSize: "15px", color: "#14532d" }}>
                      {selectedTrainer.createdAt
                        ? new Date(
                            selectedTrainer.createdAt,
                          ).toLocaleDateString("en-IN")
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Credentials Info */}
              <div
                style={{
                  background: "#fef3c7",
                  border: "2px solid #fbbf24",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    color: "#78350f",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>🔑</span> Login Information
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#92400e",
                        marginBottom: "6px",
                      }}
                    >
                      Login Email
                    </label>
                    <div
                      style={{
                        background: "white",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        fontSize: "15px",
                        color: "#0f172a",
                        fontWeight: "600",
                        fontFamily: "monospace",
                        border: "1px solid #fbbf24",
                      }}
                    >
                      {selectedTrainer.email}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#92400e",
                        marginBottom: "6px",
                      }}
                    >
                      Login Password
                    </label>
                    <div
                      style={{
                        background: "white",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        fontSize: "15px",
                        color: "#0f172a",
                        fontWeight: "600",
                        fontFamily: "monospace",
                        border: "1px solid #fbbf24",
                      }}
                    >
                      {selectedTrainer.plainPassword || "-"}
                    </div>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#78350f",
                      lineHeight: "1.5",
                    }}
                  >
                    <strong>Login Process:</strong> Trainer can login using
                    "Trainer / HR" tab on the login page with their email and
                    password.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ViewTrainers;
