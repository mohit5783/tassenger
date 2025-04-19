"use client";

import type React from "react";
import { createContext, useContext } from "react";
import { useAppSelector } from "../store/hooks";

interface AuthContextType {
  user: any; // Replace 'any' with the actual type of your user object
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
