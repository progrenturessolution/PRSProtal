import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";

function AccessManagement() {
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const [trainerFormData, setTrainerFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "trainer",
  });

  const [selectedTrainerDetails, setSelectedTrainerDetails] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newTrainerCredentials, setNewTrainerCredentials] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch trainers
      const trainersResponse = await adminAPI.getAllTrainers();
      if (trainersResponse.data.success) {
        setTrainers(trainersResponse.data.trainers);
      }

      // Fetch students
      const studentsResponse = await adminAPI.getAllInterns();
      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.interns);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleTrainerFormChange = (e) => {
    setTrainerFormData({
      ...trainerFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTrainer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Store credentials before clearing form
      const credentials = {
        email: trainerFormData.email,
        password: trainerFormData.password,
        name: trainerFormData.name,
        role: trainerFormData.role,
      };

      const response = await adminAPI.addTrainer(trainerFormData);

      if (response.data.success) {
        setSuccess("Trainer added successfully!");

        // Show credentials modal
        setNewTrainerCredentials(credentials);
        setShowCredentialsModal(true);

        setTrainerFormData({
          name: "",
          email: "",
          mobile: "",
          password: "",
          role: "trainer",
        });
        setShowAddForm(false);
        fetchData();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to add trainer. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleAssignStudents = async (e) => {
    e.preventDefault();

    if (!selectedTrainer) {
      setError("Please select a trainer.");
      return;
    }

    if (selectedStudents.length === 0) {
      setError("Please select at least one student.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Sending assign request:", {
        trainerId: selectedTrainer,
        studentIds: selectedStudents,
      });

      const response = await adminAPI.assignStudentsToTrainer({
        trainerId: selectedTrainer,
        studentIds: selectedStudents,
      });

      console.log("Assign response:", response);

      if (response.data.success) {
        setSuccess(
          `${selectedStudents.length} student(s) assigned successfully!`,
        );
        setSelectedTrainer("");
        setSelectedStudents([]);
        setShowAssignForm(false);
        fetchData();
      }
    } catch (err) {
      console.error("Assign error:", err);
      console.error("Error response:", err.response);

      let errorMessage = "Failed to assign students. Please try again.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = `Network error: ${err.message}`;
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1>Access Management</h1>
        <p>Manage trainers and user access permissions</p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setShowAssignForm(false);
          }}
          style={{
            padding: "12px 24px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {showAddForm ? "Cancel" : " Add Trainer"}
        </button>

        <button
          onClick={() => {
            setShowAssignForm(!showAssignForm);
            setShowAddForm(false);
          }}
          style={{
            padding: "12px 24px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {showAssignForm ? "Cancel" : "Assign Students to Trainer"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-message" style={{ marginBottom: "15px" }}>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" style={{ marginBottom: "15px" }}>
          {success}
        </div>
      )}

      {/* Add Trainer Form */}
      {showAddForm && (
        <div className="card">
          <h3>Add New Trainer</h3>

          <form onSubmit={handleAddTrainer} style={{ marginTop: "20px" }}>
            {/* Name */}
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={trainerFormData.name}
                onChange={handleTrainerFormChange}
                placeholder="Enter trainer's full name"
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={trainerFormData.email}
                onChange={handleTrainerFormChange}
                placeholder="Enter email address"
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Mobile */}
            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                type="tel"
                name="mobile"
                value={trainerFormData.mobile}
                onChange={handleTrainerFormChange}
                placeholder="Enter mobile number"
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={trainerFormData.password}
                onChange={handleTrainerFormChange}
                placeholder="Set a password"
                required
                minLength="6"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Role */}
            <div className="form-group">
              <label>Role *</label>
              <select
                name="role"
                value={trainerFormData.role}
                onChange={handleTrainerFormChange}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              >
                <option value="trainer">Trainer</option>
                <option value="hr">HR</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: loading ? "#ccc" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {loading ? "Adding..." : "Add Trainer"}
            </button>
          </form>
        </div>
      )}

      {/* Assign Students Form */}
      {showAssignForm && (
        <div className="card">
          <h3>Assign Students to Trainer</h3>

          <form onSubmit={handleAssignStudents} style={{ marginTop: "20px" }}>
            {/* Select Trainer */}
            <div className="form-group">
              <label>Select Trainer *</label>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              >
                <option value="">Choose a trainer...</option>
                {trainers.map((trainer) => (
                  <option key={trainer._id} value={trainer._id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Students */}
            <div className="form-group">
              <label>Select Students *</label>
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  padding: "10px",
                }}
              >
                {students.length === 0 ? (
                  <p style={{ color: "#6b7280", textAlign: "center" }}>
                    No students available
                  </p>
                ) : (
                  students.map((student) => (
                    <label
                      key={student._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        marginBottom: "5px",
                        background: selectedStudents.includes(student._id)
                          ? "#eff6ff"
                          : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => handleStudentSelection(student._id)}
                        style={{ marginRight: "10px" }}
                      />
                      <span>
                        {student.internId} - {student.name} ({student.email})
                      </span>
                    </label>
                  ))
                )}
              </div>
              <small
                style={{
                  color: "#666",
                  fontSize: "12px",
                  marginTop: "5px",
                  display: "block",
                }}
              >
                Selected: {selectedStudents.length} student(s)
              </small>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: loading ? "#ccc" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {loading ? "Assigning..." : "Assign Students"}
            </button>
          </form>
        </div>
      )}

      {/* Trainers List */}
      <div className="card">
        <h3>Current Trainers</h3>
        {trainers.length === 0 ? (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "#f9fafb",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#6b7280" }}>
              No trainers added yet. Add your first trainer above!
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "20px" }}>
            <table className="data-table">
              <thead>
                <tr>
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
                {trainers.map((trainer) => (
                  <tr key={trainer._id}>
                    <td>{trainer.name}</td>
                    <td>{trainer.email}</td>
                    <td>{trainer.mobile}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {trainer.role}
                    </td>
                    <td>{trainer.assignedStudents?.length || 0}</td>
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
                            right: "40px",
                            top: "0",
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            zIndex: 1000,
                            minWidth: "160px",
                            overflow: "hidden",
                          }}
                        >
                          <button
                            onClick={() => {
                              setSelectedTrainerDetails(trainer);
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
                              (e.target.style.background = "#f9fafb")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "white")
                            }
                          >
                            View Details
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

      {/* Credentials Modal - Shows after adding trainer */}
      {showCredentialsModal && newTrainerCredentials && (
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
          onClick={() => setShowCredentialsModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              maxWidth: "600px",
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
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600" }}>
                  Trainer Added Successfully!
                </h2>
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    fontSize: "24px",
                    width: "36px",
                    height: "36px",
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
              <p
                style={{ margin: "8px 0 0 0", opacity: 0.95, fontSize: "14px" }}
              >
                Share these login credentials with the trainer
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: "32px" }}>
              {/* Warning Message */}
              <div
                style={{
                  background: "#fef3c7",
                  border: "1px solid #fbbf24",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                  display: "flex",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "20px" }}></span>
                <div>
                  <strong
                    style={{
                      color: "#92400e",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Important: Save These Credentials
                  </strong>
                  <p style={{ margin: 0, color: "#78350f", fontSize: "14px" }}>
                    These login credentials will not be shown again. Please save
                    them securely or share them with the trainer immediately.
                  </p>
                </div>
              </div>

              {/* Trainer Info Card */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    color: "#0c4a6e",
                    fontSize: "18px",
                  }}
                >
                  Trainer Information
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#075985",
                        marginBottom: "4px",
                      }}
                    >
                      Full Name
                    </label>
                    <div
                      style={{
                        fontSize: "16px",
                        color: "#0c4a6e",
                        fontWeight: "500",
                      }}
                    >
                      {newTrainerCredentials.name}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#075985",
                        marginBottom: "4px",
                      }}
                    >
                      Role
                    </label>
                    <div
                      style={{
                        fontSize: "16px",
                        color: "#0c4a6e",
                        textTransform: "capitalize",
                        fontWeight: "500",
                      }}
                    >
                      {newTrainerCredentials.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Credentials Card */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  borderRadius: "12px",
                  padding: "24px",
                  border: "2px solid #fbbf24",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    color: "#78350f",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Login Credentials
                </h3>
                <div style={{ display: "grid", gap: "16px" }}>
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
                      Email / Login ID
                    </label>
                    <div
                      style={{
                        background: "white",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        fontSize: "16px",
                        color: "#0f172a",
                        fontWeight: "600",
                        border: "1px solid #fbbf24",
                        fontFamily: "monospace",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {newTrainerCredentials.email}
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
                      Password
                    </label>
                    <div
                      style={{
                        background: "white",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        fontSize: "16px",
                        color: "#0f172a",
                        fontWeight: "600",
                        border: "1px solid #fbbf24",
                        fontFamily: "monospace",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {newTrainerCredentials.password}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div
                style={{
                  marginTop: "24px",
                  background: "#f9fafb",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    color: "#374151",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  How to Login:
                </h4>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    color: "#6b7280",
                    fontSize: "14px",
                    lineHeight: "1.6",
                  }}
                >
                  <li>Go to the login page</li>
                  <li>Click on "Trainer / HR" tab</li>
                  <li>Enter the email and password shown above</li>
                  <li>Click "Sign In" to access the trainer dashboard</li>
                </ol>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowCredentialsModal(false)}
                style={{
                  width: "100%",
                  marginTop: "24px",
                  padding: "14px",
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              >
                I've Saved the Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trainer Details Modal - Shows trainer info from table */}
      {selectedTrainerDetails && (
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
            zIndex: 1100,
          }}
          onClick={() => setSelectedTrainerDetails(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              maxWidth: "600px",
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
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600" }}>
                  Trainer Details
                </h2>
                <button
                  onClick={() => setSelectedTrainerDetails(null)}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    fontSize: "24px",
                    width: "36px",
                    height: "36px",
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
              {/* Info Cards */}
              <div style={{ display: "grid", gap: "16px" }}>
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 16px 0",
                      color: "#0c4a6e",
                      fontSize: "16px",
                    }}
                  >
                    Personal Information
                  </h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#075985",
                          marginBottom: "4px",
                        }}
                      >
                        Full Name
                      </label>
                      <div style={{ fontSize: "15px", color: "#0c4a6e" }}>
                        {selectedTrainerDetails.name}
                      </div>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#075985",
                          marginBottom: "4px",
                        }}
                      >
                        Email Address
                      </label>
                      <div style={{ fontSize: "15px", color: "#0c4a6e" }}>
                        {selectedTrainerDetails.email}
                      </div>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#075985",
                          marginBottom: "4px",
                        }}
                      >
                        Mobile Number
                      </label>
                      <div style={{ fontSize: "15px", color: "#0c4a6e" }}>
                        {selectedTrainerDetails.mobile}
                      </div>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#075985",
                          marginBottom: "4px",
                        }}
                      >
                        Role
                      </label>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#0c4a6e",
                          textTransform: "capitalize",
                        }}
                      >
                        {selectedTrainerDetails.role}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 16px 0",
                      color: "#14532d",
                      fontSize: "16px",
                    }}
                  >
                    Assignment Information
                  </h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#166534",
                          marginBottom: "4px",
                        }}
                      >
                        Assigned Students
                      </label>
                      <div style={{ fontSize: "15px", color: "#14532d" }}>
                        {selectedTrainerDetails.assignedStudents?.length || 0}{" "}
                        students
                      </div>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#166534",
                          marginBottom: "4px",
                        }}
                      >
                        Status
                      </label>
                      <div>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: "600",
                            background:
                              selectedTrainerDetails.status === "Active"
                                ? "#dcfce7"
                                : "#fee2e2",
                            color:
                              selectedTrainerDetails.status === "Active"
                                ? "#166534"
                                : "#991b1b",
                          }}
                        >
                          {selectedTrainerDetails.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Login Info Note */}
                <div
                  style={{
                    background: "#fef3c7",
                    border: "1px solid #fbbf24",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px" }}>
                    <span style={{ fontSize: "18px" }}>🔑</span>
                    <div>
                      <strong
                        style={{
                          color: "#92400e",
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "14px",
                        }}
                      >
                        Login Credentials
                      </strong>
                      <p
                        style={{
                          margin: 0,
                          color: "#78350f",
                          fontSize: "13px",
                          lineHeight: "1.5",
                        }}
                      >
                        Trainer can login using their email address:{" "}
                        <strong>{selectedTrainerDetails.email}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AccessManagement;
