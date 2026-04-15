import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import "./studentDashboard.css";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const [activeTab, setActiveTab] = useState("overview");
  const [student, setStudent] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Project form state
  const [projectForm, setProjectForm] = useState({
    mentor_id: "",
    title: "",
    description: "",
    objectives: "",
    timeline: "",
    resources: ""
  });

  // Report upload state
  const [reportFile, setReportFile] = useState(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportType, setReportType] = useState("progress");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [s, m] = await Promise.all([
        api.get("/students/me", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get("/students/mentors", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setStudent(s.data);
      setMentors(m.data);
      setError("");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.error || "Failed to load data");
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilitySlots = async (mentorId) => {
    try {
      const res = await api.get(`/availability/mentor/${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailabilitySlots(res.data.filter(slot => slot.status === 'free'));
    } catch (err) {
      console.error("Error fetching availability:", err);
      setError("Failed to load availability slots");
    }
  };

  const handleMentorSelect = (mentorId) => {
    setSelectedMentor(mentorId);
    if (mentorId) {
      fetchAvailabilitySlots(mentorId);
    } else {
      setAvailabilitySlots([]);
    }
  };

  const bookSlot = async (slotId) => {
    try {
      await api.put(`/availability/${slotId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Slot booked successfully!");
      fetchAvailabilitySlots(selectedMentor);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book slot");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!projectForm.mentor_id || !projectForm.title) {
      setError("Please select a mentor and provide project title");
      return;
    }

    try {
      await api.post("/projects", projectForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Also create mentor request
      await api.post("/mentor-requests", {
        mentor_id: projectForm.mentor_id,
        project_title: projectForm.title,
        student_name: student?.studentname,
        student_email: student?.Email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess("Project submitted and request sent to mentor!");
      setProjectForm({
        mentor_id: "",
        title: "",
        description: "",
        objectives: "",
        timeline: "",
        resources: ""
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit project");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleReportUpload = async (e) => {
    e.preventDefault();
    if (!reportFile) {
      setError("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("report", reportFile);
    formData.append("title", reportTitle || reportFile.name);
    formData.append("description", reportDescription);
    formData.append("type", reportType);

    try {
      await api.post("/reports/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      setSuccess("Report uploaded successfully!");
      setReportFile(null);
      setReportTitle("");
      setReportDescription("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload report");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleMentorCardClick = (mentorId) => {
    setActiveTab("project");
    setProjectForm({ ...projectForm, mentor_id: mentorId.toString() });
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) return <div className="student-dashboard"><p>Loading...</p></div>;
  if (error && !student) return <div className="student-dashboard"><p className="error-banner">{error}</p></div>;
  if (!student) return <div className="student-dashboard"><p>No student data found</p></div>;

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="tab-container">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "mentors" ? "active" : ""}`}
          onClick={() => setActiveTab("mentors")}
        >
          Mentors
        </button>
        <button
          className={`tab ${activeTab === "project" ? "active" : ""}`}
          onClick={() => setActiveTab("project")}
        >
          Project
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <h2 className="welcome-title">Welcome, {student.studentname || student.Email}!</h2>
            
            <div className="grid-2">
              <div className="info-card">
                <h3>Book a Meeting Slot</h3>
                <select
                  value={selectedMentor}
                  onChange={(e) => handleMentorSelect(e.target.value)}
                  className="mentor-select"
                >
                  <option value="">Select a mentor</option>
                  {mentors.map(m => (
                    <option key={m.sno} value={m.sno}>{m.facultyname}</option>
                  ))}
                </select>

                {availabilitySlots.length > 0 ? (
                  <div className="slots-list">
                    <h4>Available Slots:</h4>
                    {availabilitySlots.map(slot => (
                      <div key={slot.id} className="slot-card">
                        <p><strong>Day:</strong> {slot.day}</p>
                        <p><strong>Time:</strong> {slot.start_time} - {slot.end_time}</p>
                        {slot.location && <p><strong>Location:</strong> {slot.location}</p>}
                        <button
                          onClick={() => bookSlot(slot.id)}
                          className="book-btn"
                        >
                          Book This Slot
                        </button>
                      </div>
                    ))}
                  </div>
                ) : selectedMentor ? (
                  <p className="empty">No available slots for this mentor</p>
                ) : null}
              </div>

              <div className="info-card">
                <h3>Upload Report</h3>
                <form onSubmit={handleReportUpload} className="upload-form-vertical">
                  <input
                    type="file"
                    onChange={(e) => setReportFile(e.target.files[0])}
                    accept=".pdf,.doc,.docx"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Report Title (optional)"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows="3"
                  />
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="progress">Progress Report</option>
                    <option value="weekly">Weekly Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="final">Final Report</option>
                  </select>
                  <button type="submit" className="upload-btn">Upload Report</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === "mentors" && (
          <div className="mentors-tab">
            <h2 className="section-title">Available Mentors</h2>
            {mentors.length === 0 ? (
              <p className="empty">No mentors available at the moment.</p>
            ) : (
              <div className="mentors-grid">
                {mentors.map(m => (
                  <div
                    key={m.sno}
                    className="mentor-card"
                    onClick={() => handleMentorCardClick(m.sno)}
                  >
                    <h4>{m.facultyname}</h4>
                    <p><strong>Specialization:</strong> {m.specialization || "N/A"}</p>
                    <p><strong>Email:</strong> {m.Email}</p>
                    <button className="request-btn">Request This Mentor</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "project" && (
          <div className="project-tab">
            <h2 className="section-title">Submit Project Request</h2>
            <form onSubmit={handleProjectSubmit} className="project-form">
              <label>
                Select Mentor *
                <select
                  value={projectForm.mentor_id}
                  onChange={(e) => setProjectForm({ ...projectForm, mentor_id: e.target.value })}
                  required
                >
                  <option value="">Choose a mentor</option>
                  {mentors.map(m => (
                    <option key={m.sno} value={m.sno}>{m.facultyname}</option>
                  ))}
                </select>
              </label>

              <label>
                Project Title *
                <input
                  type="text"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="Enter project title"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Describe your project"
                  rows="4"
                />
              </label>

              <label>
                Objectives
                <textarea
                  value={projectForm.objectives}
                  onChange={(e) => setProjectForm({ ...projectForm, objectives: e.target.value })}
                  placeholder="Project objectives"
                  rows="3"
                />
              </label>

              <label>
                Timeline
                <input
                  type="text"
                  value={projectForm.timeline}
                  onChange={(e) => setProjectForm({ ...projectForm, timeline: e.target.value })}
                  placeholder="Project timeline"
                />
              </label>

              <label>
                Resources
                <textarea
                  value={projectForm.resources}
                  onChange={(e) => setProjectForm({ ...projectForm, resources: e.target.value })}
                  placeholder="Required resources"
                  rows="2"
                />
              </label>

              <button type="submit" className="submit-btn">Submit Project Request</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
