import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Settings,
  LogOut,
  BarChart3,
  User,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Sidebar() {
  const [location] = useLocation();
  const userRole = localStorage.getItem("userRole");
  const userName = localStorage.getItem("userName") || "User";
  const userAvatar = localStorage.getItem("userAvatar");

  const adminNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/projects", icon: FolderKanban },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const userNavItems = [
    { label: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
    { label: "My Projects", href: "/user/projects", icon: FolderKanban },
    { label: "My Tasks", href: "/user/tasks", icon: CheckSquare },
  ];

  const navItems = userRole === "Admin" ? adminNavItems : userNavItems;

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userAvatar");
    window.location.href = "/auth";
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-20 hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
          <img
            src="/favicon.png"
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <h1 className="font-display font-bold text-xl tracking-tight text-slate-900">
            Spectropy
          </h1>
          <span className="text-xs text-slate-400 font-medium tracking-wider uppercase">
            {userRole === "Admin" ? "Admin Panel" : "Workspace"}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group font-medium",
                  isActive
                    ? "bg-primary/5 text-primary"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-slate-400 group-hover:text-slate-900",
                  )}
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              data-testid="button-user-menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 text-left">
                <span className="text-sm font-medium text-slate-900 truncate max-w-[120px]">
                  {userName}
                </span>
                <span className="text-xs text-slate-400">{userRole}</span>
              </div>
              <ChevronUp className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem asChild className="cursor-pointer" data-testid="menu-item-account">
              <Link href="/account">
                <User className="w-4 h-4 mr-2" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer" data-testid="menu-item-settings">
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-red-500 focus:text-red-500"
              onClick={handleLogout}
              data-testid="menu-item-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
