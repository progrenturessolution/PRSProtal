import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";

function Notifications() {
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [notificationType, setNotificationType] = useState("Individual");
  const [recipientType, setRecipientType] = useState("Student");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterRecipients();
  }, [searchTerm, students, trainers, recipientType]);

  const fetchData = async () => {
    try {
      const studentsResponse = await adminAPI.getAllInterns();
      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.interns);
      }

      const trainersResponse = await adminAPI.getAllTrainers();
      if (trainersResponse.data.success) {
        setTrainers(trainersResponse.data.trainers);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const filterRecipients = () => {
    const term = searchTerm.toLowerCase();
    if (recipientType === "Student") {
      const filtered = students.filter(
        (student) =>
          student.internId.toLowerCase().includes(term) ||
          student.name.toLowerCase().includes(term) ||
          student.email.toLowerCase().includes(term),
      );
      setFilteredStudents(filtered);
    } else {
      const filtered = trainers.filter(
        (trainer) =>
          trainer.name.toLowerCase().includes(term) ||
          trainer.email.toLowerCase().includes(term),
      );
      setFilteredTrainers(filtered);
    }
  };

  const handleRecipientSelection = (recipientId) => {
    setSelectedRecipients((prev) => {
      if (prev.includes(recipientId)) {
        return prev.filter((id) => id !== recipientId);
      } else {
        return [...prev, recipientId];
      }
    });
  };

  const handleSelectAll = () => {
    const currentList =
      recipientType === "Student" ? filteredStudents : filteredTrainers;
    const allIds = currentList.map((item) => item._id);

    if (selectAll) {
      setSelectedRecipients((prev) =>
        prev.filter((id) => !allIds.includes(id)),
      );
    } else {
      setSelectedRecipients((prev) => [...new Set([...prev, ...allIds])]);
    }
    setSelectAll(!selectAll);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size should be less than 10MB.");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("notificationType", notificationType);
      formData.append("recipientType", recipientType);
      formData.append("subject", subject);
      formData.append("message", message);

      if (notificationType === "Individual") {
        if (selectedRecipients.length === 0) {
          setError("Please select at least one recipient.");
          setLoading(false);
          return;
        }
        // Send recipientIds as comma-separated string
        formData.append("recipientId", selectedRecipients.join(","));
      } else if (notificationType === "Group") {
        formData.append("groupType", recipientType);
      }

      if (file) {
        formData.append("attachment", file);
      }

      const response = await adminAPI.createNotification(formData);

      if (response.data.success) {
        setSuccess("Notification sent successfully!");
        // Reset form
        setSubject("");
        setMessage("");
        setFile(null);
        setSelectedRecipients([]);
        setSelectAll(false);
        setSearchTerm("");
        document.getElementById("fileInput").value = "";
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to send notification. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1>Notifications</h1>
        <p>Send notifications to students and trainers</p>
      </div>

      <div className="card">
        <h3>Create New Notification</h3>

        {error && (
          <div className="error-message" style={{ marginTop: "15px" }}>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message" style={{ marginTop: "15px" }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          {/* Notification Type */}
          <div className="form-group">
            <label>Notification Type *</label>
            <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="notificationType"
                  value="Individual"
                  checked={notificationType === "Individual"}
                  onChange={(e) => setNotificationType(e.target.value)}
                  style={{ marginRight: "8px" }}
                />
                Individual
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="notificationType"
                  value="Group"
                  checked={notificationType === "Group"}
                  onChange={(e) => setNotificationType(e.target.value)}
                  style={{ marginRight: "8px" }}
                />
                Group
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="notificationType"
                  value="All"
                  checked={notificationType === "All"}
                  onChange={(e) => setNotificationType(e.target.value)}
                  style={{ marginRight: "8px" }}
                />
                All Users
              </label>
            </div>
          </div>

          {/* Recipient Type (if Individual or Group) */}
{notificationType !== "All" && (
  <div className="form-group">
    <label>Recipient Type *</label>
    <select
      value={recipientType}
      onChange={(e) => {
        setRecipientType(e.target.value);
        setSelectedRecipients([]);
        setSelectAll(false);
        setSearchTerm("");
      }}
      required
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "6px",
        border: "1px solid #ddd",
        fontSize: "14px",
        backgroundColor: "#fff",
      }}
    >
      <option value="Student">Students</option>
      <option value="Trainer">Trainers</option>
    </select>
  </div>
)}

{/* Individual Recipient Selection */}
{notificationType === "Individual" && (
  <div className="form-group">
    <label>Select Recipients *</label>

    {/* Search Bar */}
    <div style={{ marginBottom: "15px", width: "100%" }}>
      <input
        type="text"
        placeholder={`Search ${
          recipientType === "Student" ? "students" : "trainers"
        } by ID, name, or email...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #ddd",
          fontSize: "14px",
          backgroundColor: "#fff",
        }}
      />
    </div>

    {/* Select All Checkbox */}
    <div style={{ marginBottom: "10px", width: "100%" }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
         
          width: "100%",
          cursor: "pointer",
        }}
      >
        <div style={{ 
                display: "flex", 
                alignItems: "center", 
                width: "50px",
                justifyContent: "center"
              }}><input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAll}
          style={{ marginRight: "8px" }}
        />
        

              </div>
        
        Select All (
        {recipientType === "Student"
          ? filteredStudents.length
          : filteredTrainers.length}{" "}
        {recipientType === "Student" ? "students" : "trainers"})
      </label>
    </div>

    {/* Recipients List */}
    <div
      style={{
        maxHeight: "300px",
        overflowY: "auto",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        backgroundColor: "#fff",
        width: "100%",
      }}
    >
      {recipientType === "Student" ? (
        filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div
              key={student._id}
              style={{
                padding: "10px 15px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                width: "100%",
                backgroundColor: selectedRecipients.includes(student._id)
                  ? "#f8fafc"
                  : "transparent",
              }}
            >
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                width: "50px",
                justifyContent: "center"
              }}>
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(student._id)}
                  onChange={() => handleRecipientSelection(student._id)}
                />
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: "500", color: "#1e293b" }}>
                  {student.internId} - {student.name}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {student.email}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            No students found matching your search.
          </div>
        )
      ) : filteredTrainers.length > 0 ? (
        filteredTrainers.map((trainer) => (
          <div
            key={trainer._id}
            style={{
              padding: "10px 15px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              width: "100%",
              backgroundColor: selectedRecipients.includes(trainer._id)
                ? "#f8fafc"
                : "transparent",
            }}
          >
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              width: "50px",
              justifyContent: "center"
            }}>
              <input
                type="checkbox"
                checked={selectedRecipients.includes(trainer._id)}
                onChange={() => handleRecipientSelection(trainer._id)}
              />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontWeight: "500", color: "#1e293b" }}>
                {trainer.name}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {trainer.email}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          No trainers found matching your search.
        </div>
      )}
    </div>

    {selectedRecipients.length > 0 && (
      <div
        style={{
          marginTop: "10px",
          fontSize: "14px",
          color: "#059669",
          textAlign: "left",
        }}
      >
        {selectedRecipients.length} recipient
        {selectedRecipients.length > 1 ? "s" : ""} selected
      </div>
    )}
  </div>
)}

          {/* Subject */}
          <div className="form-group">
            <label>Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter notification subject"
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                backgroundColor: "#fff",
                transition: "border-color 0.2s ease",
              }}
            />
          </div>

          {/* Message */}
          <div className="form-group">
            <label>Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              required
              rows={5}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                resize: "vertical",
                backgroundColor: "#fff",
                transition: "border-color 0.2s ease",
              }}
            />
          </div>

          {/* File Attachment (Optional) */}
          <div className="form-group">
            <label>Attachment (Optional)</label>
            <input
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                backgroundColor: "#fff",
              }}
            />
            <small
              style={{
                color: "#64748b",
                fontSize: "12px",
                marginTop: "5px",
                display: "block",
              }}
            >
              Max size: 10MB
            </small>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              backgroundColor: loading ? "#94a3b8" : "#324158",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
              transition: "background-color 0.2s ease",
              width: "100%",
            }}
          >
            {loading ? "Sending..." : "Send Notification"}
          </button>
        </form>
      </div>

      {/* Recent Notifications */}
      <div className="card" style={{ marginTop: "20px" }}>
        <h3>Recent Notifications</h3>
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
            Notification history will be displayed here.
          </p>
        </div>
      </div>
    </>
  );
}

export default Notifications;
