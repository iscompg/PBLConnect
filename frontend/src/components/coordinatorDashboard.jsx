import React, { useEffect, useState } from "react";
import api from "../utils/api";
import "./coordinatorDashboard.css";
import { useNavigate } from "react-router-dom";

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("overview");
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");


  useEffect(() => {
    if (!token) navigate("/login");
    fetchAll();
  }, [token, navigate]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const s = await Promise.all("/coordinator/students");
      const m = await Promise.all("/coordinator/mentors");
      const p = await Promise.all("/coordinator/projects");
      setStudents(s.data);
      setMentors(m.data);
      setProjects(p.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.error || "Failed to load coordinator data");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="coord-dashboard">

      {/* Header */}
      <div className="dashboard-header">
        <h1>Coordinator Dashboard</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>

      {/* Tabs */}
      <div className="coord-tabs">
        <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
          Overview
        </button>
        <button className={activeTab === "students" ? "active" : ""} onClick={() => setActiveTab("students")}>
          Students
        </button>
        <button className={activeTab === "mentors" ? "active" : ""} onClick={() => setActiveTab("mentors")}>
          Mentors
        </button>
        <button className={activeTab === "projects" ? "active" : ""} onClick={() => setActiveTab("projects")}>
          Projects
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="overview">
          <div className="overview-card">
            <h3>Total Students</h3>
            <p>{students.length}</p>
          </div>

          <div className="overview-card">
            <h3>Total Mentors</h3>
            <p>{mentors.length}</p>
          </div>

          <div className="overview-card">
            <h3>Total Projects</h3>
            <p>{projects.length}</p>
          </div>
        </div>
      )}

      {/* Students */}
      {activeTab === "students" && (
        <div className="grid">
          {students.map((st) => (
            <div className="item-card" key={st.sno}>
              <h4>{st.studentname}</h4>
              <p><strong>Email:</strong> {st.Email}</p>
              <p><strong>Semester:</strong> {st.semester}</p>
              <p><strong>Section:</strong> {st.section}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mentors */}
      {activeTab === "mentors" && (
        <div className="grid">
          {mentors.map((m) => (
            <div className="item-card" key={m.sno}>
              <h4>{m.facultyname}</h4>
              <p><strong>Email:</strong> {m.Email}</p>
              <p><strong>Specialization:</strong> {m.specialization}</p>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {activeTab === "projects" && (
        <div className="grid">
          {projects.map((p) => (
            <div className="item-card" key={p.id}>
              <h4>{p.title}</h4>
              <p><strong>Student:</strong> {p.studentname}</p>
              <p><strong>Mentor:</strong> {p.facultyname}</p>
              <p><strong>Status:</strong> {p.status}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
