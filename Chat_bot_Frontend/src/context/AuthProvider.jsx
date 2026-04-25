import React, { createContext, useContext, useState } from "react";

export const AuthContext = createContext();

// Safe parse — never throws, returns undefined on any error
const safeParseUser = () => {
  try {
    const raw = localStorage.getItem("ChatApp");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    // Must have a user object with an _id to be considered valid
    if (!parsed?.user?._id) return undefined;
    return parsed;
  } catch (_) {
    // Corrupted localStorage — clear it so the user can log in fresh
    localStorage.removeItem("ChatApp");
    return undefined;
  }
};

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(safeParseUser);

  return (
    <AuthContext.Provider value={[authUser, setAuthUser]}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
