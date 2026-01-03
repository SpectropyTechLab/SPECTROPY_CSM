import { Sidebar, MobileHeader } from "./Sidebar";
import { useEffect, useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = "Spectropy PMS";
  }, []);

  const handleOpenMobileSidebar = () => {
    setIsMobileSidebarOpen(true);
  };

  const handleCloseMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={handleCloseMobileSidebar} 
      />
      <MobileHeader onMenuClick={handleOpenMobileSidebar} />
      <main className="flex-1 pt-14 md:pt-0 p-4 md:p-6 md:pl-72 overflow-y-auto animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
