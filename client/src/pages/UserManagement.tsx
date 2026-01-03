import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Check, X, Save } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
  CREATE_TASK: { label: "Create Tasks", description: "Can create new tasks in projects" },
  UPDATE_TASK: { label: "Update Tasks", description: "Can edit task details" },
  COMPLETE_TASK: { label: "Complete Tasks", description: "Can mark tasks as complete/incomplete" },
  DELETE_TASK: { label: "Delete Tasks", description: "Can remove tasks" },
  CREATE_PROJECT: { label: "Create Projects", description: "Can create new projects" },
  UPDATE_PROJECT: { label: "Update Projects", description: "Can edit project details" },
  DELETE_PROJECT: { label: "Delete Projects", description: "Can remove projects" },
  MANAGE_USERS: { label: "Manage Users", description: "Can manage other users" },
};

export default function UserManagement() {
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);

  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: number; permissions: string[] }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/permissions`, { permissions });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({ title: "Permissions updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update permissions", description: error.message, variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Role updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    },
  });

  const handleStartEdit = (user: UserType) => {
    setEditingUser(user.id);
    setEditedPermissions((user.permissions as string[]) || []);
  };

  const handleTogglePermission = (permission: string) => {
    setEditedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSavePermissions = (userId: number) => {
    updatePermissionsMutation.mutate({ userId, permissions: editedPermissions });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditedPermissions([]);
  };

  const handleRoleChange = (userId: number, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage user roles and permissions</p>
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user) => {
          const isEditing = editingUser === user.id;
          const userPermissions = isEditing ? editedPermissions : ((user.permissions as string[]) || []);
          const isAdmin = user.role === "Admin";

          return (
            <Card key={user.id} data-testid={`card-user-${user.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>
                        {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{user.name}</h3>
                        <Badge variant={isAdmin ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      {user.title && <p className="text-sm text-slate-400">{user.title}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-32" data-testid={`select-role-${user.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                      </SelectContent>
                    </Select>

                    {!isAdmin && (
                      <>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSavePermissions(user.id)}
                              disabled={updatePermissionsMutation.isPending}
                              data-testid={`button-save-permissions-${user.id}`}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              data-testid={`button-cancel-permissions-${user.id}`}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEdit(user)}
                            data-testid={`button-edit-permissions-${user.id}`}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Edit Permissions
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {isAdmin ? (
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                    <p className="text-sm text-primary font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admins have all permissions automatically
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(PERMISSION_LABELS).map(([key, { label, description }]) => {
                      const hasPermission = userPermissions.includes(key);
                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-lg border transition-colors ${
                            hasPermission
                              ? "bg-green-50 border-green-200"
                              : "bg-slate-50 border-slate-200"
                          } ${isEditing ? "cursor-pointer hover:border-primary" : ""}`}
                          onClick={() => isEditing && handleTogglePermission(key)}
                          data-testid={`permission-${key.toLowerCase()}-${user.id}`}
                        >
                          <div className="flex items-center gap-2">
                            {isEditing && (
                              <Checkbox
                                checked={hasPermission}
                                onCheckedChange={() => handleTogglePermission(key)}
                              />
                            )}
                            {!isEditing && (
                              hasPermission ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <X className="h-4 w-4 text-slate-400" />
                              )
                            )}
                            <span className={`text-sm font-medium ${hasPermission ? "text-green-800" : "text-slate-600"}`}>
                              {label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
