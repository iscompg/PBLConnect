// src/api/resources.js
import http from "../utils/http";

// ------- Users base lists (for coordinator or lookups) -------
export const listStudents = () => http.get("/students");       // if you expose one
export const listMentors  = () => http.get("/mentors");         // if you expose one

// ------- Projects -------
export const listProjectsForCoordinator = () => http.get("/projects"); // coord only
export const listProjectsForMentor = (mentorId) => http.get(`/projects/mentor/${mentorId}`);
export const listProjectsForStudent = (studentId) => http.get(`/projects/student/${studentId}`);
export const createProject = (payload) => http.post("/projects", payload);
export const updateProject = (projectId, payload) => http.put(`/projects/${projectId}`, payload);
export const deleteProject = (projectId) => http.delete(`/projects/${projectId}`);

// ------- Meetings -------
export const listMeetingsForStudent = (studentId) => http.get(`/meetings/student/${studentId}`);
export const listMeetingsForMentor  = (mentorId)  => http.get(`/meetings/mentor/${mentorId}`);
export const createMeeting = (payload) => http.post("/meetings", payload);
export const updateMeeting = (id, payload) => http.put(`/meetings/${id}`, payload);
export const deleteMeeting = (id) => http.delete(`/meetings/${id}`);

// ------- Availability (mentor slots; students book via PUT) -------
export const listAvailabilityForMentor = (mentorId) => http.get(`/availability/mentor/${mentorId}`);
export const createAvailability = (payload) => http.post("/availability", payload); // mentor only
export const updateAvailability = (id, payload) => http.put(`/availability/${id}`, payload);
export const deleteAvailability = (id) => http.delete(`/availability/${id}`);

// ------- Mentor Requests (student -> mentor; mentor accepts/rejects) -------
export const listRequestsForMentor  = (mentorId)  => http.get(`/mentor-requests/mentor/${mentorId}`);
export const listRequestsForStudent = (studentId) => http.get(`/mentor-requests/student/${studentId}`);
export const createMentorRequest = (payload) => http.post("/mentor-requests", payload);
export const updateMentorRequest = (id, payload) => http.put(`/mentor-requests/${id}`, payload);
export const deleteMentorRequest = (id) => http.delete(`/mentor-requests/${id}`);

// ------- Reports (upload with multipart/form-data) -------
export const listReportsForStudent = (studentId) => http.get(`/reports/student/${studentId}`);
export const listReportsForMentor  = (mentorId)  => http.get(`/reports/mentor/${mentorId}`);
export const submitReport = (formData) =>
  http.post("/reports", formData, { headers: { "Content-Type": "multipart/form-data" }});
export const reviewReport = (id, payload) => http.put(`/reports/${id}`, payload);
export const deleteReport = (id) => http.delete(`/reports/${id}`);
