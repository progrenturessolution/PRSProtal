import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function JobsInternships({ onPostingCreated }) {
  const [postings, setPostings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingPosting, setEditingPosting] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });

  const [formData, setFormData] = useState({
    opportunityType: "Job",
    title: "",
    company: "",
    location: "",
    domain: "",
    eligibility: "",
    description: "",
    requirements: "",
    applicationLink: "",
    applicationInstructions: "",
    deadline: "",
    salary: "",
  });

  useEffect(() => {
    fetchPostings();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!openMenuId) return;
      if (
        e.target.closest("[data-menu]") ||
        e.target.closest("[data-menu-toggle]")
      )
        return;
      setOpenMenuId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  const toggleMenu = (id, event) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 160;
      const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setMenuPosition({
        top: openUpward ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
        left: rect.right - 160 + window.scrollX,
        openUpward,
      });
      setOpenMenuId(id);
    }
  };

  const fetchPostings = async () => {
    try {
      const response = await adminAPI.getAllJobPostings();
      if (response.data.success) {
        setPostings(response.data.jobPostings || []);
      }
    } catch (error) {
      console.error("Failed to fetch job postings:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        opportunityType: formData.opportunityType,
        company: formData.company,
        location: formData.location,
        domain: formData.domain,
        title: formData.title,
        eligibilityCriteria: formData.eligibility,
        description: formData.description,
        requirements: formData.requirements,
        applicationLink: formData.applicationLink,
        applicationInstructions: formData.applicationInstructions,
        salary: formData.salary,
        deadline: formData.deadline || undefined,
      };

      const response = editingPosting
        ? await adminAPI.updateJobPosting(editingPosting._id, payload)
        : await adminAPI.createJobPosting(payload);

      if (response.data.success) {
        setSuccess(
          editingPosting
            ? "Job/Internship posting updated successfully!"
            : "Job/Internship posting created successfully!",
        );
        resetForm();
        setShowForm(false);
        fetchPostings();
        // Notify parent component about new posting for notification badge
        if (!editingPosting && onPostingCreated) {
          onPostingCreated();
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (editingPosting
          ? "Failed to update posting. Please try again."
          : "Failed to create posting. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      opportunityType: "Job",
      title: "",
      company: "",
      location: "",
      domain: "",
      eligibility: "",
      description: "",
      requirements: "",
      applicationLink: "",
      applicationInstructions: "",
      deadline: "",
      salary: "",
    });
    setEditingPosting(null);
    setError("");
    setSuccess("");
  };

  const handleEdit = (posting) => {
    setEditingPosting(posting);
    setShowForm(true);
    setSuccess("");
    setError("");
    setFormData({
      opportunityType: posting.opportunityType || "Job",
      title: posting.title || "",
      company: posting.company || "",
      location: posting.location || "",
      domain: posting.domain || "",
      eligibility: posting.eligibilityCriteria || posting.eligibility || "",
      description: posting.description || "",
      requirements: posting.requirements || "",
      applicationLink: posting.applicationLink || "",
      applicationInstructions: posting.applicationInstructions || "",
      deadline: posting.deadline ? new Date(posting.deadline).toISOString().split("T")[0] : "",
      salary: posting.salary || "",
    });
  };

  const handleDelete = async (postingId) => {
    if (!window.confirm("Delete this posting? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await adminAPI.deleteJobPosting(postingId);
      if (response.data.success) {
        setSuccess("Job posting deleted successfully.");
        fetchPostings();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to delete posting. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRepost = async (postingId) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await adminAPI.repostJobPosting(postingId);
      if (response.data.success) {
        setSuccess("Job posting reposted successfully.");
        fetchPostings();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to repost posting. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseApplication = async (posting) => {
    if (!window.confirm("Close applications for this posting?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await adminAPI.updateJobPosting(posting._id, {
        ...posting,
        status: "closed",
      });

      if (response.data.success) {
        setSuccess("Application closed successfully.");
        setOpenMenuId(null);
        fetchPostings();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to close application. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setShowForm(false);
  };

  return (
    <>
      <div className="content-header">
        <h1>Jobs & Internship Updates</h1>
        <p>Post and manage job openings and internship opportunities</p>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => {
            if (showForm) {
              handleCancelEdit();
            } else {
              setShowForm(true);
            }
          }}
          style={{
            padding: "12px 24px",
            background: "#324158",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {showForm ? "Close Form" : "Post New Opportunity"}
        </button>
      </div>

      {/* Create Posting Form */}
      {showForm && (
        <div className="card">
          <h3>Post New Opportunity</h3>

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
            {/* Opportunity Type */}
            <div className="form-group">
              <label>Opportunity Type *</label>
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
                    name="opportunityType"
                    value="Job"
                    checked={formData.opportunityType === "Job"}
                    onChange={handleChange}
                    style={{ marginRight: "8px" }}
                  />
                  Job Opening
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
                    name="opportunityType"
                    value="Internship"
                    checked={formData.opportunityType === "Internship"}
                    onChange={handleChange}
                    style={{ marginRight: "8px" }}
                  />
                  Internship
                </label>
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label>Job/Internship Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Full Stack Developer, Data Analyst Intern"
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

            {/* Company */}
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter company name"
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

            {/* Location & Domain */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Remote, Bangalore, Hybrid"
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

              <div className="form-group">
                <label>Domain *</label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="e.g., Web Development, Data Science"
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
            </div>

            {/* Salary & Deadline */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div className="form-group">
                <label>Salary/Stipend</label>
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="e.g., ₹5,00,000 - ₹8,00,000 per annum"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div className="form-group">
                <label>Application Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            {/* Eligibility */}
            <div className="form-group">
              <label>Eligibility Criteria *</label>
              <input
                type="text"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                placeholder="e.g., B.Tech/M.Tech, 2024 Graduates"
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

            {/* Description */}
            <div className="form-group">
              <label>Job Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter detailed job/internship description"
                required
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Requirements */}
            <div className="form-group">
              <label>Requirements/Skills *</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="List required skills and qualifications (one per line)"
                required
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Application Link */}
            <div className="form-group">
              <label>Application Link</label>
              <input
                type="url"
                name="applicationLink"
                value={formData.applicationLink}
                onChange={handleChange}
                placeholder="https://company.com/apply"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Application Instructions */}
            <div className="form-group">
              <label>Application Instructions</label>
              <textarea
                name="applicationInstructions"
                value={formData.applicationInstructions}
                onChange={handleChange}
                placeholder="How to apply, contact details, etc."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 24px",
                  background: loading ? "#ccc" : "#324158",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {loading ? (
                  <LoadingSpinner
                    text={editingPosting ? "Updating..." : "Posting..."}
                    inline
                    size="sm"
                  />
                ) : (
                  editingPosting ? "Update Opportunity" : "Post Opportunity"
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); }}
                style={{
                  padding: "12px 24px",
                  background: "#324158",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Close
              </button>
              {editingPosting && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    padding: "12px 24px",
                    background: "#e5e7eb",
                    color: "#111827",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="card">
          <h3>Recent Postings</h3>
          {postings.length === 0 ? (
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
                No job postings yet. Create your first posting above!
              </p>
            </div>
          ) : (
            <div style={{ marginTop: "20px" }}>
              {postings.map((posting) => (
                <div
                  key={posting._id}
                  style={{
                    padding: "15px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    background: "white",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ minWidth: "220px", flex: 1 }}>
                      <h4 style={{ margin: 0 }}>{posting.title}</h4>
                      <p style={{ color: "#6b7280", fontSize: "14px", margin: "8px 0" }}>
                        {posting.company} • {posting.location} • {posting.domain}
                      </p>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", padding: "6px 10px", background: "#f8fafc", color: "#334155", borderRadius: "9999px", fontSize: "12px", fontWeight: 600 }}>
                          {posting.opportunityType}
                        </span>
                        <span style={{ display: "inline-flex", padding: "6px 10px", background: posting.status === "closed" ? "#fee2e2" : "#dcfce7", color: posting.status === "closed" ? "#991b1b" : "#166534", borderRadius: "9999px", fontSize: "12px", fontWeight: 600 }}>
                          {posting.status || "active"}
                        </span>
                      </div>
                    </div>
                    <div style={{ position: "relative", alignSelf: "flex-start" }}>
                      <button
                        type="button"
                        data-menu-toggle
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(posting._id, e);
                        }}
                        aria-label="Posting actions"
                        style={{
                          background: "transparent",
                          color: "#0f172a",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          width: "36px",
                          height: "36px",
                          cursor: "pointer",
                          fontSize: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ⋮
                      </button>
                      {openMenuId === posting._id &&
                        createPortal(
                          <div
                            data-menu
                            style={{
                              position: "absolute",
                              left: `${menuPosition.left}px`,
                              top: `${menuPosition.top}px`,
                              transform: menuPosition.openUpward ? "translateY(-100%)" : "none",
                              background: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                              zIndex: 11000,
                              width: "160px",
                              overflow: "hidden",
                            }}
                          >
                            {[
                              { 
                                label: "Edit", 
                                action: () => handleEdit(posting),
                                color: "#0f172a",
                                hoverBg: "#f9fafb"
                              },
                              { 
                                label: "Repost", 
                                action: () => handleRepost(posting._id),
                                color: "#0f172a",
                                hoverBg: "#f9fafb"
                              },
                              { 
                                label: "Delete", 
                                action: () => handleDelete(posting._id),
                                color: "#dc2626",
                                hoverBg: "#fef2f2"
                              },
                            ].map(({ label, action, color, hoverBg }, idx) => (
                              <button
                                key={`${posting._id}-${label}`}
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  action();
                                }}
                                style={{
                                  width: "100%",
                                  padding: "12px 16px",
                                  border: "none",
                                  background: "white",
                                  color: color,
                                  cursor: "pointer",
                                  fontWeight: "500",
                                  fontSize: "14px",
                                  textAlign: "left",
                                  borderTop: idx > 0 ? "1px solid #f3f4f6" : "none",
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = hoverBg;
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = "white";
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>,
                          document.body
                        )
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default JobsInternships;
