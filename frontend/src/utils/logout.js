// src/utils/logout.js
export default function logout(navigate) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }
