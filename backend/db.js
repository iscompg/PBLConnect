import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "mentor_scheduling",
  port: process.env.DB_PORT || 3306
});

db.connect(err => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
    console.error("Please check your database configuration in .env file");
  } else {
    console.log("✅ Connected to MySQL database");
  }
});

// Handle connection errors
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Attempting to reconnect to database...');
    db.connect();
  } else {
    throw err;
  }
});

export default db;
