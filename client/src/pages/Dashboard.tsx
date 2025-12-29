import React from "react";

// 💾 Mock Data
const mockDashboardData = {
  stats: { projectCount: 12, taskCount: 48, overdueCount: 7 },
  projects: [
    { id: 101, name: "RA Portal", status: "In Progress", owner: "Kiran" },
    { id: 102, name: "SCORM Setup", status: "Planning", owner: "Neha" },
  ],
  contributors: [
    { name: "Ravi", minutes: 320 },
    { name: "Sneha", minutes: 275 },
  ],
  totalMinutesToday: 185,
  goal: 240,
  notifications: [
    { id: 1, text: "Task 'UI Fixes' assigned to Rakesh", time: "10m ago" },
    { id: 2, text: "Project 'LMS Module' marked completed", time: "2h ago" },
  ],
};

const Dashboard = () => {
  const { stats, projects, contributors, totalMinutesToday, goal, notifications } = mockDashboardData;

  return (
    <div className="min-h-screen flex bg-background text-white">
      {/* 🟦 Left Panel */}
      <aside className="w-64 bg-slate-900 p-6 border-r border-slate-700 hidden md:block">
        <h2 className="text-2xl font-bold text-primary mb-6">Spectropy PMS</h2>
        <nav className="space-y-4">
          <a href="/dashboard" className="block text-accent hover:text-white transition-colors">📊 Dashboard</a>
          <a href="/projects" className="block text-accent hover:text-white transition-colors">📁 Projects</a>
          <a href="/tasks" className="block text-accent hover:text-white transition-colors">✅ Tasks</a>
          <a href="/reports" className="block text-accent hover:text-white transition-colors">📈 Reports</a>
          <a href="/users" className="block text-accent hover:text-white transition-colors">👥 Users</a>
        </nav>
      </aside>

      {/* 🟩 Right Panel */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <h1 className="text-3xl font-bold tracking-wide text-primary animate-fade">
          📊 Dashboard Overview
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade">
          <div className="bg-slate-800 p-4 rounded-2xl shadow-xl text-center border border-slate-700">
            <h2 className="text-lg font-semibold text-accent">Projects</h2>
            <p className="text-2xl font-bold">{stats.projectCount}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-2xl shadow-xl text-center border border-slate-700">
            <h2 className="text-lg font-semibold text-accent">Tasks</h2>
            <p className="text-2xl font-bold">{stats.taskCount}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-2xl shadow-xl text-center border border-slate-700">
            <h2 className="text-lg font-semibold text-accent">Overdue</h2>
            <p className="text-2xl font-bold text-red-400">{stats.overdueCount}</p>
          </div>
        </div>

        {/* Latest Projects + Time Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700 animate-fade">
            <h3 className="text-xl font-semibold mb-2 text-primary">🗂 Latest Projects</h3>
            <ul className="space-y-2">
              {projects.map(p => (
                <li key={p.id} className="border-b border-slate-600 pb-1">
                  <span className="font-medium">{p.name}</span> — <span className="text-sm">{p.status}</span> ({p.owner})
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700 animate-fade">
            <h3 className="text-xl font-semibold mb-2 text-primary">⏱ Time Tracker</h3>
            <p className="text-lg">Today's Time: <span className="text-accent">{totalMinutesToday} min</span></p>
            <p className="text-sm text-slate-400">Goal: {goal} min</p>
            <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
              <div 
                className="bg-accent h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((totalMinutesToday / goal) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Contributors + Notifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700 animate-fade">
            <h3 className="text-xl font-semibold mb-2 text-primary">🏅 Top Contributors</h3>
            <ol className="space-y-1 list-decimal list-inside">
              {contributors.map(c => (
                <li key={c.name} className="text-slate-200">
                  <span className="font-medium text-white">{c.name}</span> – {c.minutes} min
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700 animate-fade">
            <h3 className="text-xl font-semibold mb-2 text-primary">🔔 Notifications</h3>
            <ul className="space-y-1 text-sm">
              {notifications.map(n => (
                <li key={n.id} className="text-slate-300">• {n.text} <span className="text-slate-400 italic">({n.time})</span></li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
