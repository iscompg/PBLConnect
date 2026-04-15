import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/login.jsx";
import Register from "./components/register.jsx";
import StudentDashboard from "./components/studentDashboard.jsx";
import MentorDashboard from "./components/mentorDashboard.jsx";
import ProtectedRoute from "./utils/protectedRoute.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor-dashboard"
          element={
            <ProtectedRoute role="mentor">
              <MentorDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
