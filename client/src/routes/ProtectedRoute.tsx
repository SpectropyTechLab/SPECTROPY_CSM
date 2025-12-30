import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: "Admin" | "User";
}

export const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const [location, setLocation] = useLocation();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const storedRole = localStorage.getItem("userRole");

  useEffect(() => {
    if (!isAuthenticated || !storedRole) {
      setLocation("/auth");
    } else if (role && storedRole !== role) {
      setLocation("/auth");
    }
  }, [isAuthenticated, storedRole, role, setLocation]);

  if (!isAuthenticated || !storedRole || (role && storedRole !== role)) {
    return null;
  }

  return <>{children}</>;
};
