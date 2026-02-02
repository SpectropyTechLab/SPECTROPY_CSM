import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Search, ShieldAlert, LockKeyhole, ArrowRight, ArrowLeft, Save, Check } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
  CREATE_TASK: { label: "Create Customers", description: "Can create new customers in projects" },
  UPDATE_TASK: { label: "Update Customers", description: "Can edit customer details" },
  COMPLETE_TASK: { label: "Complete Customers", description: "Can mark customers as complete" },
  DELETE_TASK: { label: "Delete Customers", description: "Can remove customers" },
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
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const selectedUser = useMemo(() =>
    users.find(u => u.id.toString() === selectedUserId),
    [users, selectedUserId]
  );

  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [users, searchQuery]
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
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          <p className="text-sm font-medium text-slate-500">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-50/30">

      {/* Page Header - Hidden on mobile if viewing details */}
      <div className={cn(
        "p-4 md:p-6 shrink-0 transition-all duration-300",
        selectedUserId ? "hidden md:block" : "block"
      )}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
        <p className="text-slate-500 text-sm">Control access, roles, and security policies.</p>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex md:grid md:grid-cols-12 gap-0 md:gap-6 px-0 md:px-6 pb-0 md:pb-6 min-h-0 overflow-hidden">

        {/* --- Left Sidebar: User List --- */}
        {/* Hidden on mobile when a user is selected */}
        <div className={cn(
          "flex-1 md:flex-none md:col-span-4 lg:col-span-3 bg-white md:rounded-2xl border-x md:border-y border-slate-200 shadow-sm flex flex-col overflow-hidden w-full",
          selectedUserId ? "hidden md:flex" : "flex"
        )}>
          {/* Search Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                className="pl-9 bg-white border-slate-200 focus-visible:ring-primary/20 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>{filteredUsers.length} members</span>
              <span className="uppercase tracking-wider font-semibold text-[10px]">Directory</span>
            </div>
          </div>

          {/* User List Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setSelectedUserId(user.id.toString());
                  setEditingPermissions(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group active:scale-[0.98]",
                  selectedUserId === user.id.toString()
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "hover:bg-slate-50 text-slate-700 bg-white md:bg-transparent border md:border-none border-transparent"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className={cn(
                    "h-10 w-10 border-2",
                    selectedUserId === user.id.toString() ? "border-slate-700" : "border-white"
                  )}>
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className={cn(
                      "text-xs font-bold",
                      selectedUserId === user.id.toString() ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                    )}>
                      {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {user.role === 'Admin' && (
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-white">
                      <Shield className="w-2 h-2 text-white fill-current" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm truncate">{user.name}</span>
                    <ArrowRight className={cn(
                      "w-3 h-3 text-slate-400 md:hidden", // Show chevron on mobile to indicate navigation
                      selectedUserId === user.id.toString() && "hidden md:block"
                    )} />
                  </div>
                  <div className={cn(
                    "text-xs truncate",
                    selectedUserId === user.id.toString() ? "text-slate-400" : "text-slate-500"
                  )}>
                    {user.email}
                  </div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-10 px-4">
                <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No users found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        {/* --- Right Content: Details --- */}
        {/* Hidden on mobile unless a user is selected */}
        <div className={cn(
          "flex-1 md:col-span-8 lg:col-span-9 bg-white md:rounded-2xl border-l md:border border-slate-200 shadow-sm flex flex-col overflow-hidden relative w-full",
          !selectedUserId ? "hidden md:flex" : "flex"
        )}>
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
              <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500">
                <ShieldAlert className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Select a User</h3>
              <p className="text-slate-500 max-w-sm">
                Choose a team member from the directory to view their profile, manage roles, and configure permissions.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">

              {/* Toolbar Header */}
              <div className="min-h-16 md:h-20 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-4 bg-white shrink-0 gap-4">

                <div className="flex items-center gap-3 md:gap-4">
                  {/* Mobile Back Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2 h-8 w-8"
                    onClick={() => setSelectedUserId(null)}
                  >
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                  </Button>

                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {selectedUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-base md:text-lg font-bold text-slate-900 leading-none">{selectedUser.name}</h2>
                    <span className="text-xs font-mono text-slate-400">ID: {selectedUser.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <div className="flex items-center gap-3 px-3 md:px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex-1 md:flex-initial justify-between md:justify-start">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Role</span>
                    <Select
                      value={selectedUser.role}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger className="h-7 w-[100px] md:w-[120px] bg-white text-xs border-slate-200 focus:ring-0 shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedUser.role !== "Admin" && (
                    <>
                      <div className="h-8 w-px bg-slate-200 hidden md:block" />
                      {editingPermissions ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="text-slate-500 hover:text-slate-900 hidden md:inline-flex"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"

                            onClick={handleSavePermissions}
                            disabled={updatePermissionsMutation.isPending}
                            className="bg-primary text-white shadow-lg shadow-primary/20"
                          >
                            <Save className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">Save</span>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleStartEdit}
                          className="border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <LockKeyhole className="w-4 h-4 md:mr-2 text-slate-400" />
                          <span className="hidden md:inline">Permissions</span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/30">
                {selectedUser.role === "Admin" ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 md:p-8 text-center max-w-lg mx-auto">
                    <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 rotate-3 transform shadow-lg shadow-amber-100">
                      <Shield className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Unrestricted Admin Access</h3>
                    <p className="text-slate-500 mb-8 leading-relaxed text-sm md:text-base">
                      This user has global administrative privileges. They bypass all granular permission checks displayed below. To restrict their capabilities, you must first demote them to a <strong>Standard User</strong>.
                    </p>
                    <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-sm font-medium text-slate-700">Full Project Control</span>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-sm font-medium text-slate-700">Billing & Subscription Management</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-sm font-medium text-slate-700">User & Security Settings</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto pb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Permission Configuration</h3>
                        <p className="text-sm text-slate-500">Granular access controls for workspace resources</p>
                      </div>
                      {/* Mobile Only Cancel/Save Buttons in content area if editing */}
                      {editingPermissions && (
                        <div className="flex gap-2 md:hidden w-full">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSavePermissions}
                            disabled={updatePermissionsMutation.isPending}
                            className="flex-1 bg-primary text-white"
                          >
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {Object.entries(PERMISSION_LABELS).map(([key, { label, description }]) => {
                        const userPermissions = editingPermissions ? editedPermissions : ((selectedUser.permissions as string[]) || []);
                        const hasPermission = userPermissions.includes(key);
                        const isInteractive = editingPermissions;

                        return (
                          <div
                            key={key}
                            onClick={() => isInteractive && handleTogglePermission(key)}
                            className={cn(
                              "relative p-4 md:p-5 rounded-xl border transition-all duration-200 flex items-start gap-3 md:gap-4",
                              isInteractive ? "cursor-pointer active:scale-[0.99]" : "",
                              hasPermission
                                ? "bg-white border-primary shadow-sm shadow-primary/5 ring-1 ring-primary/20"
                                : "bg-white border-slate-200 opacity-80 md:opacity-60 hover:opacity-100"
                            )}
                          >
                            <div className={cn(
                              "mt-0.5 w-10 h-6 rounded-full transition-colors relative flex-shrink-0",
                              hasPermission ? "bg-primary" : "bg-slate-200"
                            )}>
                              <div className={cn(
                                "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                                hasPermission ? "left-5" : "left-1"
                              )} />
                            </div>

                            <div className="flex-1">
                              <h4 className={cn("font-semibold text-sm mb-1", hasPermission ? "text-slate-900" : "text-slate-500")}>
                                {label}
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {description}
                              </p>
                            </div>

                            {isInteractive && (
                              <div className={cn(
                                "absolute top-3 right-3 w-2 h-2 rounded-full",
                                hasPermission ? "bg-primary" : "bg-slate-300"
                              )} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}