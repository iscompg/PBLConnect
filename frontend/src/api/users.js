// src/api/users.js
export const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  
  export const getRole = () => getCurrentUser()?.role || null;
  export const getUserId = () => getCurrentUser()?.id || null;
  