import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";

const ArchivedStudents = () => {
  const [deletedStudents, setDeletedStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchDeletedStudents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(deletedStudents);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = deletedStudents.filter(
        (student) =>
          student.name?.toLowerCase().includes(query) ||
          student.email?.toLowerCase().includes(query) ||
          student.studentId?.toLowerCase().includes(query) ||
          student.mobile?.includes(query) ||
          student.studentType?.toLowerCase().includes(query),
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, deletedStudents]);

  const fetchDeletedStudents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDeletedInterns();
      setDeletedStudents(response.data.data || []);
      setFilteredStudents(response.data.data || []);
    } catch (error) {
      console.error("Error fetching deleted students:", error);
      alert("Failed to load archived students");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id, name) => {
    try {
      await adminAPI.restoreIntern(id);
      setInfoMessage(`"${name}" has been restored successfully!`);
      setTimeout(() => setInfoMessage(""), 4000);
      fetchDeletedStudents();
      setConfirmRestore(null);
    } catch (error) {
      console.error("Error restoring student:", error);
      setErrorMessage("Failed to restore student");
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  const handlePermanentDelete = async (id, name) => {
    try {
      await adminAPI.permanentlyDeleteIntern(id);
      setInfoMessage(`"${name}" has been permanently deleted!`);
      setTimeout(() => setInfoMessage(""), 4000);
      fetchDeletedStudents();
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      setErrorMessage("Failed to delete student permanently");
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="content-header">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1>Archived Students</h1>
        <p>View and restore deleted student accounts</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Archived Students</h3>
            <p>{filteredStudents.length}</p>
          </div>
        </div>
      </div>

      <div className="card">
        {errorMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              marginBottom: "20px",
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#dc2626",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            
            <button
              onClick={() => setErrorMessage("")}
              style={{
                background: "none",
                border: "none",
                color: "#dc2626",
                fontSize: "18px",
                cursor: "pointer",
                padding: "0",
                marginLeft: "8px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {infoMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              marginBottom: "20px",
              backgroundColor: "#dcfce7",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              color: "#166534",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>✅</span>
              {infoMessage}
            </div>
            <button
              onClick={() => setInfoMessage("")}
              style={{
                background: "none",
                border: "none",
                color: "#166534",
                fontSize: "18px",
                cursor: "pointer",
                padding: "0",
                marginLeft: "8px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder=" Search by name, email, ID, mobile, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "14px",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              outline: "none",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </div>

        {/* Students Table */}
        {filteredStudents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#94a3b8",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}></div>
            <p style={{ fontSize: "18px", fontWeight: 500 }}>
              {searchQuery
                ? "No students found matching your search"
                : "No archived students"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Deleted On</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td>{student.studentId || "N/A"}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor:
                            student.studentType === "Internship"
                              ? "#dbeafe"
                              : "#e0e7ff",
                          color:
                            student.studentType === "Internship"
                              ? "#1e40af"
                              : "#4338ca",
                        }}
                      >
                        {student.studentType}
                      </span>
                    </td>
                    <td>{formatDate(student.deletedAt)}</td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={() => setConfirmRestore(student)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 16px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.backgroundColor = "#059669")
                          }
                          onMouseOut={(e) =>
                            (e.target.style.backgroundColor = "#10b981")
                          }
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => setConfirmDelete(student)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 16px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.backgroundColor = "#dc2626")
                          }
                          onMouseOut={(e) =>
                            (e.target.style.backgroundColor = "#ef4444")
                          }
                        >
                          Delete Forever
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {confirmRestore && (
        <div className="modal-overlay" onClick={() => setConfirmRestore(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px",
            
             }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              
              <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
                Restore Student?
              </h3>
            </div>
            <p
              style={{
                color: "#64748b",
                marginBottom: "24px",
                lineHeight: "1.6",
              }}
            >
              Are you sure you want to restore{" "}
              <strong style={{ color: "#0f172a" }}>
                {confirmRestore.name}
              </strong>
              ? This will move the student back to the active students list.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() =>
                  handleRestore(confirmRestore._id, confirmRestore.name)
                }
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Yes, Restore
              </button>
              <button
                onClick={() => setConfirmRestore(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#e2e8f0",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "550px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  margin: 0,
                  color: "#dc2626",
                }}
              >
                Permanent Delete?
              </h3>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <p
                style={{
                  color: "#64748b",
                  marginBottom: "16px",
                  lineHeight: "1.6",
                }}
              >
                Are you sure you want to{" "}
                <strong style={{ color: "#dc2626" }}>PERMANENTLY DELETE</strong>{" "}
                <strong style={{ color: "#0f172a" }}>
                  {confirmDelete.name}
                </strong>
                ?
              </p>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fee2e2",
                  border: "2px solid #fecaca",
                  borderRadius: "8px",
                }}
              >
                <p
                  style={{
                    color: "#dc2626",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}
                >
                  WARNING: This action is IRREVERSIBLE!
                </p>
                <p
                  style={{
                    color: "#475569",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    margin: 0,
                  }}
                >
                  All data including profile information, certificates,
                  documents, and task history will be permanently deleted from
                  the database and cannot be recovered.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() =>
                  handlePermanentDelete(confirmDelete._id, confirmDelete.name)
                }
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Yes, Delete Forever
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#e2e8f0",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArchivedStudents;
