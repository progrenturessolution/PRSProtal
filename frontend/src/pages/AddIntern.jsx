import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function AddIntern({ onInternAdded, onBack, defaultStudentType }) {
  const [studentType, setStudentType] = useState(defaultStudentType || "Internship");
  const [formData, setFormData] = useState({
    internId: "",
    name: "",
    email: "",
    mobile: "",
    password: "",
    domain: "",
    customDomain: "",
    joiningDate: "",
    duration: "",
    collegeName: "",
    branch: "",
    yearOfStudy: "",
    suggestedDomain: "",
    currentQualification: "",
    instituteName: "",
    instituteLocation: "",
    enrolmentDate: "",
    enrolBatchMonth: "",
    totalFees: "",
    firstPaymentAmount: "",
    firstPaymentDate: "",
    secondPaymentAmount: "",
    secondPaymentDate: "",
    finalPaymentAmount: "",
    finalPaymentDate: "",
    paymentDoneBy: "",
    dateOfPayment: "",
    transactionId: "",
    paymentAmount: "",
    completedFees: "",
    pendingFees: "",
    lastPaymentDate: "",
    currentDesignation: "",
    stipendType: "Unstipend",
    stipendAmount: "",
  });
  const [welcomeFile, setWelcomeFile] = useState(null);
  const [offerFile, setOfferFile] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await adminAPI.getGroups();
        if (res.data && res.data.success) {
          setGroups(res.data.groups || []);
        }
      } catch (err) {
        console.error("Error loading groups in AddIntern:", err);
      }
    }
    loadGroups();
  }, []);

  const calculatePendingFees = (data) => {
    const total = Number(data.totalFees || 0);
    const first = Number(data.firstPaymentAmount || 0);
    const second = Number(data.secondPaymentAmount || 0);
    const final = Number(data.finalPaymentAmount || 0);
    const pending = Math.max(total - (first + second + final), 0);

    return String(pending);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const nextData = {
      ...formData,
      [name]: value,
    };

    // SMS completed fees can still be derived from payment splits.
    if (
      [
        "totalFees",
        "firstPaymentAmount",
        "secondPaymentAmount",
        "finalPaymentAmount",
      ].includes(name)
    ) {
      const first = Number(nextData.firstPaymentAmount || 0);
      const second = Number(nextData.secondPaymentAmount || 0);
      const final = Number(nextData.finalPaymentAmount || 0);
      nextData.completedFees = String(first + second + final);
      nextData.pendingFees = calculatePendingFees(nextData);
    }

    setFormData(nextData);
    setError("");
    setSuccess("");
  };

  const handleWelcomeFile = (e) => {
    setWelcomeFile(e.target.files[0] || null);
    setError("");
    setSuccess("");
  };
  const handleOfferFile = (e) => {
    setOfferFile(e.target.files[0] || null);
    setError("");
    setSuccess("");
  };
  const handlePaymentFile = (e) => {
    setPaymentFile(e.target.files[0] || null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const submitData = {
        studentType,
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
      };

      if (selectedGroupId) {
        submitData.groupId = selectedGroupId;
      }

      if (studentType === "Internship") {
        const selectedDomain =
          formData.domain === "Other" ? formData.customDomain : formData.domain;

        if (
          !formData.internId ||
          !selectedDomain ||
          !formData.joiningDate ||
          !formData.duration ||
          !formData.collegeName ||
          !formData.branch ||
          !formData.yearOfStudy
        ) {
          setError(
            "Please fill all required internship fields: PIID, Domain, Joining Date, Duration, College Name, Branch, and Year of Study",
          );
          setLoading(false);
          return;
        }

        if (formData.stipendType === 'Stipend' && (!formData.stipendAmount || Number(formData.stipendAmount) <= 0)) {
          setError('Please enter the stipend amount for stipend-based internships');
          setLoading(false);
          return;
        }

        submitData.internId = formData.internId;
        submitData.domain = selectedDomain;
        submitData.joiningDate = formData.joiningDate;
        submitData.duration = formData.duration;
        submitData.collegeName = formData.collegeName;
        submitData.branch = formData.branch;
        submitData.yearOfStudy = formData.yearOfStudy;
        submitData.stipendType = formData.stipendType || 'Unstipend';
        if (formData.stipendType === 'Stipend') submitData.stipendAmount = formData.stipendAmount || '';

        console.log("Internship data being sent:", {
          domain: submitData.domain,
          joiningDate: submitData.joiningDate,
          duration: submitData.duration,
          collegeName: submitData.collegeName,
          branch: submitData.branch,
          yearOfStudy: submitData.yearOfStudy,
        });
      } else if (studentType === "SMS Program") {
        if (
          !formData.internId ||
          !formData.suggestedDomain ||
          !formData.instituteName ||
          !formData.yearOfStudy ||
          !formData.enrolmentDate ||
          !formData.enrolBatchMonth ||
          !formData.totalFees
        ) {
          setError(
            "Please fill all required SMS fields: PSMS ID, Suggested Domain, Institute Name, Year of Study, Enrolment Date, Enrol Batch Month, and Total Fees",
          );
          setLoading(false);
          return;
        }

        submitData.internId = formData.internId;
        submitData.suggestedDomain = formData.suggestedDomain;
        submitData.currentQualification = formData.currentQualification;
        submitData.instituteName = formData.instituteName;
        submitData.instituteLocation = formData.instituteLocation;
        submitData.yearOfStudy = formData.yearOfStudy;
        submitData.enrolmentDate = formData.enrolmentDate;
        submitData.enrolBatchMonth = formData.enrolBatchMonth;
        submitData.totalFees = formData.totalFees;
        submitData.firstPaymentAmount = formData.firstPaymentAmount;
        submitData.firstPaymentDate = formData.firstPaymentDate;
        submitData.secondPaymentAmount = formData.secondPaymentAmount;
        submitData.secondPaymentDate = formData.secondPaymentDate;
        submitData.finalPaymentAmount = formData.finalPaymentAmount;
        submitData.finalPaymentDate = formData.finalPaymentDate;
        submitData.completedFees = formData.completedFees;
        submitData.pendingFees = formData.pendingFees;
        submitData.currentDesignation = formData.currentDesignation;
      }

      console.log("Submitting student data:", submitData);
      console.log("Token:", localStorage.getItem("token"));

      let response;

      // Always use FormData so files can be attached regardless of student type
      const fd = new FormData();
      Object.keys(submitData).forEach((k) => fd.append(k, submitData[k]));

      if (studentType === "SMS Program") {
        // Documents are optional for SMS Program - attach if provided
        if (welcomeFile) fd.append("smsProgramEnrollmentLetter", welcomeFile);
        if (offerFile) fd.append("offerLetter", offerFile);
        if (paymentFile) fd.append("paymentReceipt", paymentFile);
      } else if (studentType === "Internship" && offerFile) {
        // Offer letter is optional for Internship but attach if provided
        fd.append("offerLetter", offerFile);
      }

      response = await adminAPI.addIntern(fd);

      if (response.data.success) {
        const intern = response.data.intern;
        let successMsg = `Student added successfully!\n\nID: ${intern.internId}\nName: ${intern.name}\nEmail: ${intern.email}\nType: ${intern.studentType}`;

        setSuccess(successMsg);

        setFormData({
          internId: "",
          name: "",
          email: "",
          mobile: "",
          password: "",
          domain: "",
          customDomain: "",
          joiningDate: "",
          endingDate: "",
          duration: "",
          collegeName: "",
          branch: "",
          yearOfStudy: "",
          suggestedDomain: "",
          currentQualification: "",
          instituteName: "",
          instituteLocation: "",
          enrolmentDate: "",
          enrolBatchMonth: "",
          totalFees: "",
          firstPaymentAmount: "",
          firstPaymentDate: "",
          secondPaymentAmount: "",
          secondPaymentDate: "",
          finalPaymentAmount: "",
          finalPaymentDate: "",
          paymentDoneBy: "",
          dateOfPayment: "",
          transactionId: "",
          paymentAmount: "",
          completedFees: "",
          pendingFees: "",
          lastPaymentDate: "",
          currentDesignation: "",
          stipendType: "Unstipend",
          stipendAmount: "",
        });

        if (onInternAdded) {
          onInternAdded();
        }
        // clear files and group
        setWelcomeFile(null);
        setOfferFile(null);
        setPaymentFile(null);
        setSelectedGroupId("");
      }
    } catch (err) {
      console.error("Add student error:", err);
      console.error("Error response:", err.response);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to add student. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="premium-page-header">
        <div className="header-left">
          <h1>Add New Student</h1>
          <p className="header-subtitle">Register a new student to the system</p>
        </div>
        {onBack && (
          <div className="header-right">
            <button
              type="button"
              className="back-button back-button-primary"
              onClick={onBack}
            >
              Back to View All Students
            </button>
          </div>
        )}
      </div>

      <div className="premium-card">
        <div className="premium-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#344158",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg fill="none" stroke="#fff" viewBox="0 0 24 24" style={{ width: "22px", height: "22px" }}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Student Details</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>Fill in the student information</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="admin-add-student-grid">
            <div className="form-group">
              <label>Student Type *</label>
              <select
                name="studentType"
                value={studentType}
                onChange={(e) => setStudentType(e.target.value)}
              >
                <option value="Internship">Internship</option>
                <option value="SMS Program">SMS Program</option>
              </select>
            </div>

            {studentType === "SMS Program" && (
              <div className="form-group">
                <label>PSMS ID *</label>
                <input
                  type="text"
                  name="internId"
                  value={formData.internId}
                  onChange={handleChange}
                  placeholder="Enter PSMS ID"
                  required
                />
                <small>This ID will be used for SMS Student login.</small>
              </div>
            )}

            {studentType === "Internship" && (
              <div className="form-group">
                <label>PIID (required) *</label>
                <input
                  type="text"
                  name="internId"
                  value={formData.internId}
                  onChange={handleChange}
                  placeholder="Enter PIID"
                  required
                />
                <small>This ID will be used for Internship student login.</small>
              </div>
            )}

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter student's full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Mobile Number (WhatsApp preferred) *</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Assign a password"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Assign Group</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="">None / Select Group</option>
                {groups
                  .filter(g => !g.studentType || g.studentType === 'All' || g.studentType === studentType)
                  .map(g => (
                    <option key={g._id || g.id} value={g._id || g.id}>
                      {g.groupName} ({g.groupNumber}) - {g.studentType || 'All'}
                    </option>
                  ))
                }
              </select>
            </div>

            {studentType === "Internship" && (
              <>
                <div className="form-group">
                  <label>Internship Domain *</label>
                  <select
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Domain</option>
                    <option value="Web Development">Web Development</option>
                    <option value="App Development">App Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Artificial Intelligence">
                      Artificial Intelligence
                    </option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Graphic Design">Graphic Design</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Content Writing">Content Writing</option>
                    <option value="Business Development">
                      Business Development
                    </option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Full Stack Development">
                      Full Stack Development
                    </option>
                    <option value="Frontend Development">
                      Frontend Development
                    </option>
                    <option value="Backend Development">
                      Backend Development
                    </option>
                    <option value="Mobile App Development">
                      Mobile App Development
                    </option>
                    <option value="Game Development">Game Development</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Project Management">Project Management</option>
                    <option value="Business Analytics">Business Analytics</option>
                    <option value="Other">Other (Type Manually)</option>
                  </select>
                </div>

                {formData.domain === "Other" && (
                  <div
                    className="form-group"
                    style={{ animation: "slideInForm 0.3s ease-out" }}
                  >
                    <label>Enter Custom Domain *</label>
                    <input
                      type="text"
                      name="customDomain"
                      value={formData.customDomain || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, customDomain: e.target.value })
                      }
                      placeholder="Enter your custom domain"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Enrolment Date *</label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Internship Duration *</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g., 3 months, 6 months"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>College Name *</label>
                  <input
                    type="text"
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleChange}
                    placeholder="Enter college name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Branch *</label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    placeholder="Enter branch"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Year of Study *</label>
                  <input
                    type="text"
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleChange}
                    placeholder="e.g., 2nd Year, Final Year"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stipend Type</label>
                  <select name="stipendType" value={formData.stipendType} onChange={handleChange}>
                    <option value="Unstipend">Unstipend</option>
                    <option value="Stipend">Stipend</option>
                  </select>
                </div>
                {formData.stipendType === 'Stipend' && (
                  <div className="form-group">
                    <label>Stipend Amount (Rs.)</label>
                    <input
                      type="number"
                      name="stipendAmount"
                      value={formData.stipendAmount}
                      onChange={handleChange}
                      placeholder="Enter stipend amount"
                    />
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Internship Offer Letter (PDF)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleOfferFile}
                  />
                </div>
              </>
            )}

            {studentType === "SMS Program" && (
              <>
                <div className="form-group">
                  <label>Suggested Domain *</label>
                  <input
                    type="text"
                    name="suggestedDomain"
                    value={formData.suggestedDomain}
                    onChange={handleChange}
                    placeholder="Enter suggested domain"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Current Qualification</label>
                  <input
                    type="text"
                    name="currentQualification"
                    value={formData.currentQualification}
                    onChange={handleChange}
                    placeholder="Enter current qualification"
                  />
                </div>

                <div className="form-group">
                  <label>Full Name of College/Institute/School *</label>
                  <input
                    type="text"
                    name="instituteName"
                    value={formData.instituteName}
                    onChange={handleChange}
                    placeholder="Enter full institute name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Year of Study *</label>
                  <input
                    type="text"
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleChange}
                    placeholder="e.g., 1st Year, 2nd Year"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>City/Location of your College/Institute</label>
                  <input
                    type="text"
                    name="instituteLocation"
                    value={formData.instituteLocation}
                    onChange={handleChange}
                    placeholder="Enter city/location"
                  />
                </div>

                <div className="form-group">
                  <label>Enrolment date *</label>
                  <input
                    type="date"
                    name="enrolmentDate"
                    value={formData.enrolmentDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Enrol Batch Month *</label>
                  <input
                    type="month"
                    name="enrolBatchMonth"
                    value={formData.enrolBatchMonth}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Fees *</label>
                  <input
                    type="number"
                    name="totalFees"
                    value={formData.totalFees}
                    onChange={handleChange}
                    placeholder="Enter total fees"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>First Payment Amount</label>
                  <input
                    type="number"
                    name="firstPaymentAmount"
                    value={formData.firstPaymentAmount}
                    onChange={handleChange}
                    placeholder="Enter first payment amount"
                  />
                </div>

                <div className="form-group">
                  <label>First Payment Date</label>
                  <input
                    type="date"
                    name="firstPaymentDate"
                    value={formData.firstPaymentDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Second Payment Amount</label>
                  <input
                    type="number"
                    name="secondPaymentAmount"
                    value={formData.secondPaymentAmount}
                    onChange={handleChange}
                    placeholder="Enter second payment amount"
                  />
                </div>

                <div className="form-group">
                  <label>Second Payment Date</label>
                  <input
                    type="date"
                    name="secondPaymentDate"
                    value={formData.secondPaymentDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Final Payment Amount</label>
                  <input
                    type="number"
                    name="finalPaymentAmount"
                    value={formData.finalPaymentAmount}
                    onChange={handleChange}
                    placeholder="Enter final payment amount"
                  />
                </div>

                <div className="form-group">
                  <label>Final Payment Date</label>
                  <input
                    type="date"
                    name="finalPaymentDate"
                    value={formData.finalPaymentDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Pending fees</label>
                  <input
                    type="number"
                    name="pendingFees"
                    value={formData.pendingFees}
                    readOnly
                    placeholder="Auto-calculated"
                  />
                </div>

                <div className="form-group">
                  <label>Current Designation</label>
                  <input
                    type="text"
                    name="currentDesignation"
                    value={formData.currentDesignation}
                    onChange={handleChange}
                    placeholder="e.g., Student, Graduate"
                  />
                </div>

                <div className="form-group">
                  <label>SMS Program Enrollment Letter</label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleWelcomeFile}
                  />

                </div>

                <div className="form-group">
                  <label>Internship Offer Letter</label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleOfferFile}
                  />

                </div>

                <div className="form-group">
                  <label>Payment Recipt</label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handlePaymentFile}
                  />

                </div>
              </>
            )}

          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
            style={{
              marginTop: "24px",
              background: "#344158",
              borderColor: "#344158",
            }}
          >
            {loading ? (
              <LoadingSpinner text="Adding Student..." inline size="sm" />
            ) : (
              "Add Student"
            )}
          </button>
        </form>
      </div>
    </>
  );
}

export default AddIntern;
