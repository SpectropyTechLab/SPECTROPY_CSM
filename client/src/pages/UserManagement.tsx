import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Check, X, Save, Users } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { useState, useMemo } from "react";
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<boolean>(false);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);

  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const selectedUser = useMemo(() => 
    users.find(u => u.id.toString() === selectedUserId),
    [users, selectedUserId]
  );

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: number; permissions: string[] }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/permissions`, { permissions });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingPermissions(false);
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

  const handleStartEdit = () => {
    if (selectedUser) {
      setEditingPermissions(true);
      setEditedPermissions((selectedUser.permissions as string[]) || []);
    }
  };

  const handleTogglePermission = (permission: string) => {
    setEditedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSavePermissions = () => {
    if (selectedUser) {
      updatePermissionsMutation.mutate({ userId: selectedUser.id, permissions: editedPermissions });
    }
  };

  const handleCancelEdit = () => {
    setEditingPermissions(false);
    setEditedPermissions([]);
  };

  const handleRoleChange = (role: string) => {
    if (selectedUser) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Manage user roles and permissions from a single interface</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-visible">
        <CardHeader className="border-b bg-slate-50/50 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">User Selection</CardTitle>
                <p className="text-xs text-slate-500">Choose a team member to manage</p>
              </div>
            </div>
            
            <div className="w-full md:w-80">
              <Select
                value={selectedUserId || ""}
                onValueChange={(value) => {
                  setSelectedUserId(value);
                  setEditingPermissions(false);
                }}
              >
                <SelectTrigger className="w-full h-10" data-testid="select-user">
                  <SelectValue placeholder="Select a user to manage..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                        <span className="text-xs text-slate-400">({user.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 bg-slate-50 rounded-full">
                <User className="h-10 w-10 text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">No User Selected</h3>
                <p className="text-slate-500 max-w-xs mx-auto">
                  Select a user from the dropdown above to manage their role and permissions.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* User Identity Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-5">
                  <Avatar className="h-16 w-16 border-2 border-slate-100">
                    <AvatarImage src={selectedUser.avatar || undefined} />
                    <AvatarFallback className="text-xl">
                      {selectedUser.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-slate-900">{selectedUser.name}</h2>
                      <Badge variant={selectedUser.role === "Admin" ? "default" : "secondary"} className="h-6">
                        {selectedUser.role}
                      </Badge>
                    </div>
                    <p className="text-slate-500 font-medium">{selectedUser.email}</p>
                    {selectedUser.title && <p className="text-slate-400 text-sm">{selectedUser.title}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Role</span>
                    <Select
                      value={selectedUser.role}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger className="w-40 h-10" data-testid={`select-role-${selectedUser.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-900">Permissions Management</h3>
                  </div>
                  
                  {selectedUser.role !== "Admin" && (
                    <div className="flex gap-2">
                      {editingPermissions ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            data-testid="button-cancel-permissions"
                            className="h-9"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSavePermissions}
                            disabled={updatePermissionsMutation.isPending}
                            data-testid="button-save-permissions"
                            className="h-9 gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleStartEdit}
                          data-testid="button-edit-permissions"
                          className="h-9 gap-2"
                        >
                          <Shield className="h-4 w-4" />
                          Modify Permissions
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {selectedUser.role === "Admin" ? (
                  <div className="p-6 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">Full Administrative Access</h4>
                      <p className="text-sm text-slate-600">
                        Administrators have all permissions enabled by default. Role changes are required to restrict access.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(PERMISSION_LABELS).map(([key, { label, description }]) => {
                      const userPermissions = editingPermissions ? editedPermissions : ((selectedUser.permissions as string[]) || []);
                      const hasPermission = userPermissions.includes(key);
                      
                      return (
                        <div
                          key={key}
                          className={`group relative p-4 rounded-xl border transition-all duration-200 ${
                            hasPermission
                              ? "bg-green-50/50 border-green-200 ring-1 ring-green-100"
                              : "bg-slate-50/50 border-slate-200"
                          } ${editingPermissions ? "cursor-pointer hover:border-primary hover:shadow-md active:scale-[0.98]" : ""}`}
                          onClick={() => editingPermissions && handleTogglePermission(key)}
                          data-testid={`permission-${key.toLowerCase()}`}
                        >
                          <div className="flex items-start gap-3">
                            {editingPermissions ? (
                              <Checkbox
                                checked={hasPermission}
                                onCheckedChange={() => handleTogglePermission(key)}
                                className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                              />
                            ) : (
                              <div className={`mt-1 rounded-full p-1 ${hasPermission ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-400"}`}>
                                {hasPermission ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              </div>
                            )}
                            <div className="flex-1">
                              <span className={`block font-semibold mb-1 ${hasPermission ? "text-green-900" : "text-slate-700"}`}>
                                {label}
                              </span>
                              <span className="text-xs text-slate-500 leading-relaxed">
                                {description}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
