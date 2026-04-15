import express from "express";
import cors from "cors";
import db from "./db.js";
import auth_routes from "./routes/auth_routes.js";
import mentor_routes from "./routes/mentor_routes.js";
import student_routes from "./routes/student_routes.js";
import availability_routes from "./routes/availability.js";
import meetings_routes from "./routes/meetings.js";
import projects_routes from "./routes/projects.js";
import reports_routes from "./routes/reports.js";
import mentor_request_routes from "./routes/mentor_request_routes.js";
import diagnostics_routes from "./routes/diagnostics.js";
import coordinator_routes from "./routes/coordinator_routes.js";

const app = express();
const PORT = 5050;

// Middleware
app.use(cors({
  origin: "http://localhost:3000", // allow frontend
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Diagnostic endpoint to check database connection
app.get("/api/health", (req, res) => {
  db.query("SELECT 1 as test", (err, result) => {
    if (err) {
      return res.status(500).json({ status: "error", message: "Database connection failed", error: err.message });
    }
    res.json({ status: "ok", message: "Database connected", test: result[0] });
  });
});

// Routes
app.use("/api/auth", auth_routes);
app.use("/api/mentors", mentor_routes);
app.use("/api/students", student_routes);
app.use("/api/availability", availability_routes);
app.use("/api/meetings", meetings_routes);
app.use("/api/projects", projects_routes);
app.use("/api/reports", reports_routes);
app.use("/api/mentor-requests", mentor_request_routes);
app.use("/api/diagnostics", diagnostics_routes);
app.use("/api/coordinator", coordinator_routes);
// Default 404 route
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Server start
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
