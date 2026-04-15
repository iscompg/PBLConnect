import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './coordinatorDashboard.css';

function CoordinatorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [coordinatorData, setCoordinatorData] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [allMentors, setAllMentors] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch coordinator data and all users/projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          navigate('/');
          return;
        }

        setCoordinatorData(user);

        const token = localStorage.getItem('token');

        // Fetch all students
        const studentsRes = await axios.get('http://localhost:5050/api/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllStudents(studentsRes.data);

        // Fetch all mentors
        const mentorsRes = await axios.get('http://localhost:5050/api/mentors', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllMentors(mentorsRes.data);

        // Fetch all projects
        const projectsRes = await axios.get('http://localhost:5050/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllProjects(projectsRes.data);

      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Error loading dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Real-time listeners for updates (removed Firebase listeners as functionality is phased out)
  // Data is fetched via API calls in the first useEffect

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Compute assignments: join projects with students and mentors
  const assignments = allProjects.map(project => {
    const student = allStudents.find(s => s.id === project.studentId);
    const mentor = allMentors.find(m => m.id === project.mentorId);
    return {
      ...project,
      studentName: student ? student.name : 'Unknown',
      studentEmail: student ? student.email : 'Unknown',
      mentorName: mentor ? mentor.name : 'Unassigned',
      mentorEmail: mentor ? mentor.email : 'Unassigned'
    };
  }).filter(assignment => assignment.mentorName !== 'Unassigned'); // Only assigned

  // Stats for overview
  const totalStudents = allStudents.length;
  const totalMentors = allMentors.length;
  const totalAssignments = assignments.length;
  const pendingProjects = allProjects.filter(p => p.status === 'pending').length;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="coordinator-dashboard">
      <div className="dashboard-header">
        <h1>Coordinator Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'students' ? 'active' : ''}
          onClick={() => setActiveTab('students')}
        >
          Students ({totalStudents})
        </button>
        <button 
          className={activeTab === 'mentors' ? 'active' : ''}
          onClick={() => setActiveTab('mentors')}
        >
          Mentors ({totalMentors})
        </button>
        <button 
          className={activeTab === 'assignments' ? 'active' : ''}
          onClick={() => setActiveTab('assignments')}
        >
          Assignments ({totalAssignments})
        </button>
      </div>

      <div className="main-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Welcome, {coordinatorData?.name}</h2>
            <div className="stats">
              <div className="stat-card">
                <h3>Total Students</h3>
                <p>{totalStudents}</p>
              </div>
              <div className="stat-card">
                <h3>Total Mentors</h3>
                <p>{totalMentors}</p>
              </div>
              <div className="stat-card">
                <h3>Active Assignments</h3>
                <p>{totalAssignments}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Projects</h3>
                <p>{pendingProjects}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-section">
            <h2>All Students</h2>
            {allStudents.length === 0 ? (
              <p>No students found.</p>
            ) : (
              <div className="user-cards">
                {allStudents.map(student => {
                  const studentProject = allProjects.find(p => p.studentId === student.id);
                  const assignedMentor = allMentors.find(m => m.id === studentProject?.mentorId);
                  return (
                    <div className="user-card" key={student.id}>
                      <h3>{student.name}</h3>
                      <p><strong>Email:</strong> {student.email}</p>
                      <p><strong>Project:</strong> {studentProject ? studentProject.title : 'No project'}</p>
                      <p><strong>Status:</strong> {studentProject ? studentProject.status : 'No project'}</p>
                      <p><strong>Assigned Mentor:</strong> {assignedMentor ? assignedMentor.name : 'Unassigned'}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'mentors' && (
          <div className="mentors-section">
            <h2>All Mentors</h2>
            {allMentors.length === 0 ? (
              <p>No mentors found.</p>
            ) : (
              <div className="user-cards">
                {allMentors.map(mentor => (
                  <div className="user-card" key={mentor.id}>
                    <h3>{mentor.name}</h3>
                    <p><strong>Email:</strong> {mentor.email}</p>
                    <p><strong>Institution:</strong> {mentor.institution}</p>
                    <p><strong>Assigned Students:</strong> {mentor.assignedStudents ? mentor.assignedStudents.length : 0}</p>
                    <p><strong>Available Slots:</strong> {mentor.availableSlots || 0}</p>
                    {mentor.specialties && (
                      <div className="mentor-specialties">
                        <strong>Specialties:</strong>
                        <div className="specialties-list">
                          {mentor.specialties.map((specialty, index) => (
                            <span key={index} className="specialty-tag">{specialty}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="assignments-section">
            <h2>Student-Mentor Assignments</h2>
            {assignments.length === 0 ? (
              <p>No assignments found.</p>
            ) : (
              <div className="assignments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Project Title</th>
                      <th>Mentor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(assignment => (
                      <tr key={assignment.id}>
                        <td>{assignment.studentName} ({assignment.studentEmail})</td>
                        <td>{assignment.title}</td>
                        <td>{assignment.mentorName} ({assignment.mentorEmail})</td>
                        <td className={`status-badge ${assignment.status}`}>{assignment.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CoordinatorDashboard;
