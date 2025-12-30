import { Sidebar } from "./Sidebar";
import { useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useEffect(() => {
    document.title = "Spectropy PMS";
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      <Sidebar />
      <main className="flex-1 p-6 md:pl-72 overflow-y-auto animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
