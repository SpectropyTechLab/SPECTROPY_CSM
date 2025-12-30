import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, CheckSquare, Settings, LogOut, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/projects", icon: FolderKanban },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
  ];

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    window.location.href = "/auth";
  };

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-20 hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <Hexagon className="text-white w-6 h-6 fill-white/20" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-xl tracking-tight text-white">Spectropy</h1>
          <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">Workspace</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group font-medium",
                  isActive
                    ? "bg-primary/10 text-primary shadow-inner"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
                  )}
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border bg-black/20">
        <Link href="/settings">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white cursor-pointer transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </div>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer transition-colors mt-1"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
