import { useState, useEffect, Fragment } from "react";
import { adminAPI, UPLOADS_BASE } from "../services/api";

function SMSProgramManagement() {
  const [students, setStudents] = useState([]);
  const [uploadState, setUploadState] = useState({}); // { [studentId]: { uploading, success, filenames: [] } }
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDocs, setOpenDocs] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentModalStudent, setDocumentModalStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    mobile: "",
    currentDesignation: "",
    paymentDoneBy: "",
    transactionId: "",
    paymentAmount: "",
    dateOfPayment: "",
    status: "",
  });

  const toggleDocs = (studentId) => {
    setOpenDocs((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSingleDocUpload = async (e, studentId, documentType) => {
    const file = Array.from(e.target.files || [])[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadState((s) => ({
        ...s,
        [studentId]: { ...(s[studentId] || {}), error: "Only PDF allowed" },
      }));
      setTimeout(
        () =>
          setUploadState((s) => ({
            ...s,
            [studentId]: { ...(s[studentId] || {}), error: undefined },
          })),
        3000,
      );
      e.target.value = "";
      return;
    }

    setUploadState((s) => ({
      ...s,
      [studentId]: { ...(s[studentId] || {}), uploading: true },
    }));

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", documentType);

      const resp = await adminAPI.uploadStudentDocument(studentId, fd);
      if (resp.data && resp.data.success) {
        // update students list
        setStudents((prev) =>
          prev.map((s) => {
            if (s._id === studentId) {
              return {
                ...s,
                documents: {
                  ...(s.documents || {}),
                  [documentType]: resp.data.document,
                },
              };
            }
            return s;
          }),
        );

        // update modal if open
        setSelectedStudent((prev) => {
          if (prev && prev._id === studentId) {
            return {
              ...prev,
              documents: {
                ...(prev.documents || {}),
                [documentType]: resp.data.document,
              },
            };
          }
          return prev;
        });

        setUploadState((s) => ({
          ...s,
          [studentId]: {
            ...(s[studentId] || {}),
            uploading: false,
            success: true,
            filenames: [
              (resp.data.document && resp.data.document.filename) || file.name,
            ],
          },
        }));
      } else {
        setUploadState((s) => ({
          ...s,
          [studentId]: {
            ...(s[studentId] || {}),
            uploading: false,
            success: false,
          },
        }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadState((s) => ({
        ...s,
        [studentId]: {
          ...(s[studentId] || {}),
          uploading: false,
          success: false,
        },
      }));
    } finally {
      e.target.value = "";
    }
  };
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, completed

  useEffect(() => {
    fetchSMSStudents();
  }, []);

  const fetchSMSStudents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllInterns();
      if (response.data.success) {
        // Filter only SMS Program type students
        const smsStudents = response.data.interns.filter(
          (intern) => intern.studentType === "SMS Program",
        );
        setStudents(smsStudents);
      }
    } catch (error) {
      console.error("Failed to fetch SMS students:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStudents = () => {
    if (filter === "all") return students;
    if (filter === "active") {
      return students.filter(
        (student) => student.status?.toLowerCase() === "active",
      );
    }
    if (filter === "completed") {
      return students.filter(
        (student) => student.status?.toLowerCase() === "completed",
      );
    }
    return students;
  };

  const handleEditClick = () => {
    setEditForm({
      name: selectedStudent.name || "",
      email: selectedStudent.email || "",
      mobile: selectedStudent.mobile || "",
      currentDesignation: selectedStudent.currentDesignation || "",
      paymentDoneBy: selectedStudent.paymentDoneBy || "",
      transactionId: selectedStudent.transactionId || "",
      paymentAmount: selectedStudent.paymentAmount || "",
      dateOfPayment: selectedStudent.dateOfPayment
        ? selectedStudent.dateOfPayment.split("T")[0]
        : "",
      status: selectedStudent.status || "active",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: "",
      email: "",
      mobile: "",
      currentDesignation: "",
      paymentDoneBy: "",
      transactionId: "",
      paymentAmount: "",
      dateOfPayment: "",
      status: "",
    });
  };

  const handleUpdateStudent = async () => {
    try {
      const response = await adminAPI.updateIntern(
        selectedStudent._id,
        editForm,
      );
      if (response.data.success) {
        setStudents((prev) =>
          prev.map((s) =>
            s._id === selectedStudent._id ? { ...s, ...editForm } : s,
          ),
        );
        setSelectedStudent({ ...selectedStudent, ...editForm });
        setIsEditing(false);
        alert("Student updated successfully!");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update student.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const filteredStudents = getFilteredStudents();

  return (
    <>
      <div className="content-header">
        <h1>SMS Program Management</h1>
        <p>Manage SMS program students and activities</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total SMS Students</h3>
            <p>{students.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Active</h3>
            <p>
              {
                students.filter((s) => s.status?.toLowerCase() === "active")
                  .length
              }
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Completed</h3>
            <p>
              {
                students.filter((s) => s.status?.toLowerCase() === "completed")
                  .length
              }
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Payment Done</h3>
            <p>{students.filter((s) => s.transactionId).length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              background: filter === "all" ? "#324158" : "#f8fafc",
              color: filter === "all" ? "white" : "#324158",
              boxShadow:
                filter === "all" ? "0 8px 20px rgba(15, 23, 42, 0.3)" : "none",
            }}
          >
            All ({students.length})
          </button>

          <button
            onClick={() => setFilter("active")}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              background: filter === "active" ? "#324158" : "#f8fafc",
              color: filter === "active" ? "white" : "#324158",
              boxShadow:
                filter === "active"
                  ? "0 8px 20px rgba(15, 23, 42, 0.3)"
                  : "none",
            }}
          >
            Active (
            {
              students.filter((s) => s.status?.toLowerCase() === "active")
                .length
            }
            )
          </button>

          <button
            onClick={() => setFilter("completed")}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              background: filter === "completed" ? "#324158" : "#f8fafc",
              color: filter === "completed" ? "white" : "#324158",
              boxShadow:
                filter === "completed"
                  ? "0 8px 20px rgba(15, 23, 42, 0.3)"
                  : "none",
            }}
          >
            Completed (
            {
              students.filter((s) => s.status?.toLowerCase() === "completed")
                .length
            }
            )
          </button>
        </div>

        {/* Students Table */}
        {loading ? (
          <p>Loading...</p>
        ) : filteredStudents.length === 0 ? (
          <p>No SMS program students found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>

                  <th>Current Designation</th>
                  <th>Payment Date</th>
                  <th>Amount (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <Fragment key={student._id}>
                    <tr>
                      <td>{student.internId}</td>
                      <td>{student.name}</td>

                      <td>{student.currentDesignation || "N/A"}</td>

                      <td>
                        {student.dateOfPayment
                          ? new Date(student.dateOfPayment).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td style={{ fontWeight: "600", color: "#059669" }}>
                        {student.paymentAmount
                          ? `₹${student.paymentAmount}`
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            student.status?.toLowerCase() === "active"
                              ? "status-active"
                              : student.status?.toLowerCase() === "completed"
                                ? "status-completed"
                                : "status-inactive"
                          }`}
                        >
                          {student.status
                            ? student.status.charAt(0).toUpperCase() +
                              student.status.slice(1)
                            : "N/A"}
                        </span>
                      </td>
                      <td style={{ position: "relative" }}>
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === student._id ? null : student._id,
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

                        {openMenuId === student._id && (
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
                                setSelectedStudent(student);
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
                                color: "#132a5d",
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
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Management Modal */}
      {showDocumentModal && documentModalStudent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 11000,
          }}
          onClick={() => setShowDocumentModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              minWidth: "500px",
              maxWidth: "700px",
              width: "90%",
              maxHeight: "85vh",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Gradient */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                padding: "24px",
                color: "white",
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowDocumentModal(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.background = "rgba(255,255,255,0.3)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = "rgba(255,255,255,0.2)")
                }
              >
                ✕
              </button>
              <h2
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "24px",
                  fontWeight: "600",
                }}
              >
                Document Management
              </h2>
              <div style={{ fontSize: "14px", opacity: 0.95 }}>
                <span>
                  {documentModalStudent.name} - {documentModalStudent.internId}
                </span>
              </div>
            </div>

            {/* Content */}
            <div
              style={{
                padding: "24px",
                maxHeight: "calc(85vh - 100px)",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "grid", gap: 16 }}>
                {/* Offer Letter */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    background: "#f9fafb",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      flex: 1,
                    }}
                  >
                    <strong style={{ color: "#374151", fontSize: "15px" }}>
                      Offer Letter
                    </strong>
                    {documentModalStudent.documents?.offerLetter ? (
                      <a
                        href={
                          UPLOADS_BASE +
                          "/uploads/students/" +
                          documentModalStudent.documents.offerLetter.filename
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "8px 14px",
                          background: "#0f172a",
                          color: "white",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: "500",
                          width: "fit-content",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => (
                          (e.style.background = "#1e293b"),
                          (e.style.boxShadow =
                            "0 4px 12px rgba(15, 23, 42, 0.3)")
                        )}
                        onMouseLeave={(e) => (
                          (e.style.background = "#0f172a"),
                          (e.style.boxShadow = "none")
                        )}
                      >
                        View PDF
                      </a>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                        Not uploaded
                      </span>
                    )}
                  </div>
                  <input
                    id={`modal-upload-offerLetter`}
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      handleSingleDocUpload(
                        e,
                        documentModalStudent._id,
                        "offerLetter",
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      document
                        .getElementById(`modal-upload-offerLetter`)
                        .click()
                    }
                    style={{
                      padding: "10px 18px",
                      background: "#0f172a",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (
                      (e.target.style.background = "#1e293b"),
                      (e.target.style.boxShadow =
                        "0 4px 12px rgba(15, 23, 42, 0.3)")
                    )}
                    onMouseLeave={(e) => (
                      (e.target.style.background = "#0f172a"),
                      (e.target.style.boxShadow = "none")
                    )}
                  >
                    {documentModalStudent.documents?.offerLetter
                      ? "Replace"
                      : "Upload"}
                  </button>
                </div>

                {/* Welcome Letter */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    background: "#f9fafb",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      flex: 1,
                    }}
                  >
                    <strong style={{ color: "#374151", fontSize: "15px" }}>
                      Welcome Letter
                    </strong>
                    {documentModalStudent.documents?.welcomeLetter ? (
                      <a
                        href={
                          UPLOADS_BASE +
                          "/uploads/students/" +
                          documentModalStudent.documents.welcomeLetter.filename
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "8px 14px",
                          background: "#0f172a",
                          color: "white",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: "500",
                          width: "fit-content",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => (
                          (e.style.background = "#1e293b"),
                          (e.style.boxShadow =
                            "0 4px 12px rgba(15, 23, 42, 0.3)")
                        )}
                        onMouseLeave={(e) => (
                          (e.style.background = "#0f172a"),
                          (e.style.boxShadow = "none")
                        )}
                      >
                        View PDF
                      </a>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                        Not uploaded
                      </span>
                    )}
                  </div>
                  <input
                    id={`modal-upload-welcomeLetter`}
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      handleSingleDocUpload(
                        e,
                        documentModalStudent._id,
                        "welcomeLetter",
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      document
                        .getElementById(`modal-upload-welcomeLetter`)
                        .click()
                    }
                    style={{
                      padding: "10px 18px",
                      background: "#0f172a",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (
                      (e.target.style.background = "#1e293b"),
                      (e.target.style.boxShadow =
                        "0 4px 12px rgba(15, 23, 42, 0.3)")
                    )}
                    onMouseLeave={(e) => (
                      (e.target.style.background = "#0f172a"),
                      (e.target.style.boxShadow = "none")
                    )}
                  >
                    {documentModalStudent.documents?.welcomeLetter
                      ? "Replace"
                      : "Upload"}
                  </button>
                </div>

                {/* Payment Receipt */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    background: "#f9fafb",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      flex: 1,
                    }}
                  >
                    <strong style={{ color: "#374151", fontSize: "15px" }}>
                      Payment Receipt
                    </strong>
                    {documentModalStudent.documents?.paymentReceipt ? (
                      <a
                        href={
                          UPLOADS_BASE +
                          "/uploads/students/" +
                          documentModalStudent.documents.paymentReceipt.filename
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "8px 14px",
                          background: "#0f172a",
                          color: "white",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: "500",
                          width: "fit-content",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => (
                          (e.style.background = "#1e293b"),
                          (e.style.boxShadow =
                            "0 4px 12px rgba(15, 23, 42, 0.3)")
                        )}
                        onMouseLeave={(e) => (
                          (e.style.background = "#0f172a"),
                          (e.style.boxShadow = "none")
                        )}
                      >
                        View PDF
                      </a>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                        Not uploaded
                      </span>
                    )}
                  </div>
                  <input
                    id={`modal-upload-paymentReceipt`}
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      handleSingleDocUpload(
                        e,
                        documentModalStudent._id,
                        "paymentReceipt",
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      document
                        .getElementById(`modal-upload-paymentReceipt`)
                        .click()
                    }
                    style={{
                      padding: "10px 18px",
                      background: "#0f172a",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (
                      (e.target.style.background = "#1e293b"),
                      (e.target.style.boxShadow =
                        "0 4px 12px rgba(15, 23, 42, 0.3)")
                    )}
                    onMouseLeave={(e) => (
                      (e.target.style.background = "#0f172a"),
                      (e.target.style.boxShadow = "none")
                    )}
                  >
                    {documentModalStudent.documents?.paymentReceipt
                      ? "Replace"
                      : "Upload"}
                  </button>
                </div>

                {/* Other Certificates */}
                <div
                  style={{
                    padding: "16px",
                    background: "#f9fafb",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <strong style={{ color: "#374151", fontSize: "15px" }}>
                      Other Certificates
                    </strong>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      {documentModalStudent.documents?.otherCertificates &&
                        documentModalStudent.documents.otherCertificates
                          .length > 0 && (
                          <span style={{ color: "#6b7280", fontSize: "13px" }}>
                            {
                              documentModalStudent.documents.otherCertificates
                                .length
                            }{" "}
                            file(s)
                          </span>
                        )}
                      <input
                        id={`modal-upload-otherCertificates`}
                        type="file"
                        accept="application/pdf"
                        multiple
                        style={{ display: "none" }}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          for (const f of files) {
                            const fd = new FormData();
                            fd.append("file", f);
                            fd.append("documentType", f.name);
                            try {
                              const resp = await adminAPI.uploadStudentDocument(
                                documentModalStudent._id,
                                fd,
                              );
                              if (resp.data && resp.data.success) {
                                setStudents((prev) =>
                                  prev.map((s) => {
                                    if (s._id === documentModalStudent._id) {
                                      return {
                                        ...s,
                                        documents: {
                                          ...(s.documents || {}),
                                          otherCertificates: [
                                            ...(s.documents
                                              ?.otherCertificates || []),
                                            resp.data.document,
                                          ],
                                        },
                                      };
                                    }
                                    return s;
                                  }),
                                );
                                setDocumentModalStudent((prev) => ({
                                  ...prev,
                                  documents: {
                                    ...(prev.documents || {}),
                                    otherCertificates: [
                                      ...(prev.documents?.otherCertificates ||
                                        []),
                                      resp.data.document,
                                    ],
                                  },
                                }));
                              }
                            } catch (err) {
                              console.error(
                                "Other certificate upload error",
                                err,
                              );
                            }
                          }
                          e.target.value = "";
                        }}
                      />
                      <button
                        onClick={() =>
                          document
                            .getElementById(`modal-upload-otherCertificates`)
                            .click()
                        }
                        style={{
                          padding: "10px 18px",
                          background: "#8b5cf6",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
                        onMouseLeave={(e) => (e.target.style.opacity = "1")}
                      >
                        Add Certificate
                      </button>
                    </div>
                  </div>
                  {documentModalStudent.documents?.otherCertificates &&
                  documentModalStudent.documents.otherCertificates.length >
                    0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        marginTop: "12px",
                      }}
                    >
                      {documentModalStudent.documents.otherCertificates.map(
                        (c, idx) => (
                          <a
                            key={idx}
                            href={
                              UPLOADS_BASE + "/uploads/students/" + c.filename
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "10px 14px",
                              background: "white",
                              borderRadius: "6px",
                              textDecoration: "none",
                              color: "#4f46e5",
                              fontSize: "13px",
                              border: "1px solid #e5e7eb",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.background = "#e0e7ff")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "white")
                            }
                          >
                            {c.name || c.filename}
                          </a>
                        ),
                      )}
                    </div>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                      No additional certificates
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal for SMS */}
      {selectedStudent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
          }}
          onClick={() => setSelectedStudent(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              minWidth: "400px",
              maxWidth: "650px",
              width: "90%",
              maxHeight: "85vh",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Gradient */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                padding: "24px",
                color: "white",
                position: "relative",
              }}
            >
              <button
                onClick={() => setSelectedStudent(null)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.background = "rgba(255,255,255,0.3)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = "rgba(255,255,255,0.2)")
                }
              >
                ✕
              </button>
              <h2
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "24px",
                  fontWeight: "600",
                }}
              >
                {selectedStudent.name}
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  fontSize: "14px",
                  opacity: 0.95,
                }}
              >
                <span>ID: {selectedStudent.internId}</span>
                <span>•</span>
                <span>SMS Program</span>
              </div>
            </div>

            {/* Content */}
            <div
              style={{
                padding: "24px",
                maxHeight: "calc(85vh - 120px)",
                overflowY: "auto",
              }}
            >
              {/* Contact Information */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Contact Information
                </h3>
                <div
                  style={{
                    background: "#f9fafb",
                    padding: "16px",
                    borderRadius: "8px",
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  {!isEditing ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Name
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.name}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Email
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.email}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Mobile
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.mobile}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Current Designation
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.currentDesignation || "N/A"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Mobile
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          value={editForm.mobile}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Current Designation
                        </label>
                        <input
                          type="text"
                          name="currentDesignation"
                          value={editForm.currentDesignation}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Payment Details
                </h3>
                <div
                  style={{
                    background: "#f9fafb",
                    padding: "16px",
                    borderRadius: "8px",
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  {!isEditing ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Payment By
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.paymentDoneBy || "N/A"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Transaction ID
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.transactionId || "N/A"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Payment Amount
                        </span>
                        <span
                          style={{
                            fontWeight: "700",
                            fontSize: "14px",
                            color: "#059669",
                          }}
                        >
                          {selectedStudent.paymentAmount
                            ? `₹${selectedStudent.paymentAmount}`
                            : "N/A"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Payment Date
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.dateOfPayment
                            ? new Date(
                                selectedStudent.dateOfPayment,
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Status
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color:
                              selectedStudent.status?.toLowerCase() === "active"
                                ? "#059669"
                                : "#d97706",
                            background:
                              selectedStudent.status?.toLowerCase() === "active"
                                ? "#d1fae5"
                                : "#fef3c7",
                            padding: "4px 12px",
                            borderRadius: "12px",
                          }}
                        >
                          {selectedStudent.status || "Active"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Payment By
                        </label>
                        <input
                          type="text"
                          name="paymentDoneBy"
                          value={editForm.paymentDoneBy}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Transaction ID
                        </label>
                        <input
                          type="text"
                          name="transactionId"
                          value={editForm.transactionId}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Payment Amount (₹)
                        </label>
                        <input
                          type="number"
                          name="paymentAmount"
                          value={editForm.paymentAmount}
                          onChange={handleInputChange}
                          placeholder="e.g. 5000"
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Payment Date
                        </label>
                        <input
                          type="date"
                          name="dateOfPayment"
                          value={editForm.dateOfPayment}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Status
                        </label>
                        <select
                          name="status"
                          value={editForm.status}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "16px",
                }}
              >
                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    style={{
                      padding: "10px 24px",
                      background:
                        "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.transform = "scale(1.02)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.transform = "scale(1)")
                    }
                  >
                    Edit Details
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: "10px 24px",
                        background: "#e5e7eb",
                        color: "#374151",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateStudent}
                      style={{
                        padding: "10px 24px",
                        background:
                          "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "transform 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.transform = "scale(1.02)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.transform = "scale(1)")
                      }
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SMSProgramManagement;
