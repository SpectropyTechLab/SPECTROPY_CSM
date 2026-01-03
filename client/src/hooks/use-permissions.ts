import { useQuery } from "@tanstack/react-query";

interface UserPermissions {
  permissions: string[];
  canCreateTask: boolean;
  canUpdateTask: boolean;
  canCompleteTask: boolean;
  canDeleteTask: boolean;
  canCreateProject: boolean;
  canUpdateProject: boolean;
  canDeleteProject: boolean;
  canManageUsers: boolean;
}

export function usePermissions() {
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");
  
  const { data: permissions, isLoading } = useQuery<UserPermissions>({
    queryKey: ["/api/users", userId, "permissions"],
    enabled: !!userId,
  });

  const isAdmin = userRole === "Admin";

  return {
    isLoading,
    isAdmin,
    permissions: permissions?.permissions || [],
    canCreateTask: isAdmin || permissions?.canCreateTask || false,
    canUpdateTask: isAdmin || permissions?.canUpdateTask || false,
    canCompleteTask: isAdmin || permissions?.canCompleteTask || false,
    canDeleteTask: isAdmin || permissions?.canDeleteTask || false,
    canCreateProject: isAdmin || permissions?.canCreateProject || false,
    canUpdateProject: isAdmin || permissions?.canUpdateProject || false,
    canDeleteProject: isAdmin || permissions?.canDeleteProject || false,
    canManageUsers: isAdmin || permissions?.canManageUsers || false,
  };
}
