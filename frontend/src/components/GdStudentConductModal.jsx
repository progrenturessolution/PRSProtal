import { useEffect, useMemo, useState } from "react";

const ratingOptions = [
  { value: "", label: "Select Rating" },
  { value: "1", label: "1 - Very Low" },
  { value: "2", label: "2 - Low" },
  { value: "3", label: "3 - Average" },
  { value: "4", label: "4 - Good" },
  { value: "5", label: "5 - Excellent" },
];

export default function GdStudentConductModal({ gd, student, onClose, onSave }) {
  const [form, setForm] = useState({
    attendanceStatus: "Present",
    participation: "",
    communication: "",
    confidence: "",
    topicUnderstanding: "",
    leadership: "",
    overallRemark: "",
    strengths: "",
    improvementAreas: "",
  });

  const gdTitle = gd?.title || gd?.details?.form?.title || "Group Discussion";
  const studentName = student?.name || student?.internId || "Student";

  const storageKey = useMemo(() => {
    return `gdStudentEvaluations:${String(gd?._id || gd?.title || "gd")}`;
  }, [gd]);

  useEffect(() => {
    if (!gd || !student) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const existing = saved.find((item) => String(item.studentId) === String(student._id || student.internId || student.id));
      if (existing?.form) {
        setForm((prev) => ({ ...prev, ...existing.form }));
      }
    } catch (error) {
      console.error("Failed to load GD student evaluation", error);
    }
  }, [gd, student, storageKey]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!form.participation || !form.communication || !form.confidence || !form.topicUnderstanding || !form.leadership) {
      alert("Please select ratings for all required fields.");
      return;
    }

    try {
      const current = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const next = current.filter((item) => String(item.studentId) !== String(student._id || student.internId || student.id));
      next.push({
        studentId: student._id || student.internId || student.id,
        studentName,
        gdId: gd?._id || gd?.title || null,
        gdTitle,
        savedAt: new Date().toISOString(),
        form,
      });
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save GD student evaluation", error);
    }

    if (onSave) onSave(form);
    if (onClose) onClose();
  };

  if (!gd || !student) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "min(920px, 100%)", maxHeight: "90vh", overflow: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 24px 60px rgba(15, 23, 42, 0.24)" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#0f766e", textTransform: "uppercase" }}>Conduct GD</div>
            <h3 style={{ margin: "6px 0 4px", fontSize: 22, color: "#0f172a" }}>{gdTitle}</h3>
            <div style={{ color: "#475569", fontSize: 14 }}>{studentName}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Date</div>
              <strong>{gd?.details?.form?.date || gd?.dateTime || "-"}</strong>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Time</div>
              <strong>{gd?.details?.form?.startTime || "-"}</strong>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>PSMS ID</div>
              <strong>{student?.internId || student?.id || "-"}</strong>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Attendance</div>
              <select value={form.attendanceStatus} onChange={(e) => handleChange("attendanceStatus", e.target.value)} style={inputStyle} required>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Participation *</label>
              <select value={form.participation} onChange={(e) => handleChange("participation", e.target.value)} style={inputStyle} required>
                {ratingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Communication *</label>
              <select value={form.communication} onChange={(e) => handleChange("communication", e.target.value)} style={inputStyle} required>
                {ratingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Confidence *</label>
              <select value={form.confidence} onChange={(e) => handleChange("confidence", e.target.value)} style={inputStyle} required>
                {ratingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Topic Understanding *</label>
              <select value={form.topicUnderstanding} onChange={(e) => handleChange("topicUnderstanding", e.target.value)} style={inputStyle} required>
                {ratingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Leadership *</label>
              <select value={form.leadership} onChange={(e) => handleChange("leadership", e.target.value)} style={inputStyle} required>
                {ratingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Strengths</label>
              <textarea value={form.strengths} onChange={(e) => handleChange("strengths", e.target.value)} rows={3} style={textareaStyle} placeholder="What did this student do well?" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Improvement Areas</label>
              <textarea value={form.improvementAreas} onChange={(e) => handleChange("improvementAreas", e.target.value)} rows={3} style={textareaStyle} placeholder="What should this student improve?" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Overall Remark</label>
              <textarea value={form.overallRemark} onChange={(e) => handleChange("overallRemark", e.target.value)} rows={4} style={textareaStyle} placeholder="Final GD feedback for the student" />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "#fff", color: "#334155", border: "1px solid #cbd5e1", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{ background: "linear-gradient(135deg, #0f766e, #14b8a6)", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, boxShadow: "0 10px 20px rgba(20, 184, 166, 0.24)" }}
            >
              Conduct GD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  fontSize: 14,
};

const textareaStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  fontSize: 14,
  resize: "vertical",
};
