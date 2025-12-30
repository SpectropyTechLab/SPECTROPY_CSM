import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: "Admin" | "User";
}

export const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const [location, setLocation] = useLocation();
  const storedRole = localStorage.getItem("userRole");

  useEffect(() => {
    if (!storedRole) {
      setLocation("/auth");
    } else if (role && storedRole !== role) {
      setLocation("/auth");
    }
  }, [storedRole, role, setLocation]);

  if (!storedRole || (role && storedRole !== role)) {
    return null;
  }

  return <>{children}</>;
};
