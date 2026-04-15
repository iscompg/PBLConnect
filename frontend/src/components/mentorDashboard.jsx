import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import "./mentorDashboard.css";

export default function MentorDashboard() {
  const [mentor, setMentor] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [token] = useState(localStorage.getItem("token"));
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Overview tab state
  const [reports, setReports] = useState([]);
  const [availabilityForm, setAvailabilityForm] = useState({
    day: "",
    start_time: "",
    end_time: "",
    location: ""
  });

  // Projects tab state
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ studentsCount: 0, remainingSlots: 15, bookedSlots: 0 });

  // Specialty tab state
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadData();
  }, [token, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/mentors/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMentor(res.data);
      setSpecialty(res.data.specialization || "");

      // Load reports
      const reportsRes = await api.get("/reports", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(reportsRes.data);

      // Load projects
      const mentorSno = res.data.sno;
      const projectsRes = await api.get(`/projects/mentor/${mentorSno}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(projectsRes.data);

      // Load stats
      const statsRes = await api.get("/mentors/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error loading mentor data:", err);
      setError(err.response?.data?.error || "Failed to load data");
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post("/availability", availabilityForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Availability slot added successfully!");
      setAvailabilityForm({ day: "", start_time: "", end_time: "", location: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add slot");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleUpdateReport = async (reportId, status, feedback) => {
    try {
      await api.put(`/reports/${reportId}`, {
        status,
        feedback
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Report updated successfully!");
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update report");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleProjectAction = async (projectId, action) => {
    try {
      await api.put(`/projects/${projectId}`, {
        status: action === "accept" ? "active" : "rejected"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Project ${action}ed successfully!`);
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Project update full error:", err);
      console.error("Backend response:", err.response?.data);
      console.error("Status code:", err.response?.status);
    
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        `Failed to ${action} project`
      );
    
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleUpdateSpecialty = async (e) => {
    e.preventDefault();
    try {
      await api.put("/mentors/specialty", {
        specialization: specialty
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Specialty updated successfully!");
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update specialty");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading) return <div className="mentor-dashboard"><p>Loading...</p></div>;
  if (!mentor) return <div className="mentor-dashboard"><p>No mentor data found</p></div>;

  return (
    <div className="mentor-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {mentor.facultyname}</h1>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="logout-btn"
        >
          Logout
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="mentor-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={activeTab === "projects" ? "active" : ""}
          onClick={() => setActiveTab("projects")}
        >
          Projects
        </button>
        <button
          className={activeTab === "specialty" ? "active" : ""}
          onClick={() => setActiveTab("specialty")}
        >
          Specialty
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-section">
            <h2>Overview</h2>

            <div className="stats-card">
              <h3>Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Students Assigned:</span>
                  <span className="stat-value">{stats.studentsCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Booked Slots:</span>
                  <span className="stat-value">{stats.bookedSlots} / {stats.totalSlots}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Remaining Slots:</span>
                  <span className="stat-value">{stats.remainingSlots}</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Set Availability</h3>
              <form onSubmit={handleAddSlot} className="add-slot">
                <select
                  value={availabilityForm.day}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, day: e.target.value })}
                  required
                >
                  <option value="">Select Day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
                <input
                  type="time"
                  value={availabilityForm.start_time}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, start_time: e.target.value })}
                  required
                />
                <input
                  type="time"
                  value={availabilityForm.end_time}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, end_time: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={availabilityForm.location}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, location: e.target.value })}
                />
                <button type="submit">Add Slot</button>
              </form>
            </div>

            <div className="info-card">
              <h3>Reports</h3>
              {reports.length === 0 ? (
                <p className="empty">No reports submitted yet</p>
              ) : (
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.title}</td>
                        <td>{report.type}</td>
                        <td>{report.status}</td>
                        <td>{new Date(report.submitted_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleUpdateReport(report.id, "reviewed", "Reviewed")}
                            className="review-btn"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="projects-section">
            <h2>Project Requests</h2>

            <div className="stats-card">
              <h3>Current Statistics</h3>
              <p><strong>Students Assigned:</strong> {stats.studentsCount}</p>
              <p><strong>Slots Remaining:</strong> {stats.remainingSlots} out of {stats.totalSlots}</p>
            </div>

            {projects.length === 0 ? (
              <p className="empty">No project requests yet</p>
            ) : (
              <div className="projects-list">
                {projects.map((project) => (
                  <div key={project.id} className="project-card">
                    <h3>{project.title}</h3>
                    <p><strong>Status:</strong> <span className={`status-${project.status}`}>{project.status}</span></p>
                    {project.description && <p><strong>Description:</strong> {project.description}</p>}
                    {project.objectives && <p><strong>Objectives:</strong> {project.objectives}</p>}
                    {project.timeline && <p><strong>Timeline:</strong> {project.timeline}</p>}
                    {project.resources && <p><strong>Resources:</strong> {project.resources}</p>}
                    <p><strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}</p>
                    {project.status === "pending" && (
                      <div className="project-actions">
                        <button
                          onClick={() => handleProjectAction(project.id, "accept")}
                          className="accept-btn"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleProjectAction(project.id, "reject")}
                          className="reject-btn"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "specialty" && (
          <div className="specialty-section">
            <h2>Update Specialization</h2>
            <div className="info-card">
              <p><strong>Current Specialization:</strong> {mentor.specialization || "Not set"}</p>
              <form onSubmit={handleUpdateSpecialty} className="specialty-form">
                <label>
                  New Specialization:
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Enter your specialization"
                    required
                  />
                </label>
                <button type="submit" className="update-btn">Update Specialization</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
