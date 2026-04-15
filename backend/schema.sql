-- Create database
CREATE DATABASE IF NOT EXISTS mentor_scheduling;
USE mentor_scheduling;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'mentor', 'coordinator') NOT NULL,
  is_activated BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- AIML Mentors table
CREATE TABLE IF NOT EXISTS aiml_mentors (
  sno INT AUTO_INCREMENT PRIMARY KEY,
  facultyname VARCHAR(255) NOT NULL,
  specialization VARCHAR(255),
  Email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AIML Students table
CREATE TABLE IF NOT EXISTS aiml_students (
  sno INT AUTO_INCREMENT PRIMARY KEY,
  studentname VARCHAR(255) NOT NULL,
  Email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  mentor_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  objectives TEXT,
  timeline TEXT,
  resources TEXT,
  status ENUM('pending', 'approved', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  mentor_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(255),
  topic VARCHAR(255),
  notes TEXT,
  status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('progress', 'final', 'weekly', 'monthly') DEFAULT 'progress',
  file_url VARCHAR(500),
  status ENUM('pending', 'reviewed', 'approved', 'rejected') DEFAULT 'pending',
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Availability table
CREATE TABLE IF NOT EXISTS availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mentor_id INT NOT NULL,
  day ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  status ENUM('free', 'booked', 'unavailable') DEFAULT 'free',
  student_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Mentor requests table
CREATE TABLE IF NOT EXISTS mentor_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  mentor_id INT NOT NULL,
  project_id INT NULL,
  project_title VARCHAR(255),
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_student ON projects(student_id);
CREATE INDEX IF NOT EXISTS idx_projects_mentor ON projects(mentor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_student ON meetings(student_id);
CREATE INDEX IF NOT EXISTS idx_meetings_mentor ON meetings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_reports_student ON reports(student_id);
CREATE INDEX IF NOT EXISTS idx_availability_mentor ON availability(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_student ON mentor_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_mentor ON mentor_requests(mentor_id);
