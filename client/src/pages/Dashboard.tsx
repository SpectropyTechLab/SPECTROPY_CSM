import { Sidebar } from "@/components/layout/Sidebar";
import { StatCard } from "@/components/ui/StatCard";
import { Activity, Briefcase, CheckCircle2, Clock } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tasks, isLoading: tasksLoading } = useTasks();

  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
  const pendingTasks = tasks?.filter(t => t.status === 'todo' || t.status === 'in_progress').length || 0;

  const chartData = [
    { name: 'Mon', tasks: 4 },
    { name: 'Tue', tasks: 7 },
    { name: 'Wed', tasks: 5 },
    { name: 'Thu', tasks: 12 },
    { name: 'Fri', tasks: 8 },
    { name: 'Sat', tasks: 3 },
    { name: 'Sun', tasks: 2 },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-1">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, here's what's happening today.</p>
          </div>
          <div className="flex gap-4">
             {/* Date picker or user avatar could go here */}
             <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent p-[2px]">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center font-bold text-sm">
                  JD
                </div>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatCard 
              label="Total Projects" 
              value={projectsLoading ? "..." : totalProjects} 
              icon={Briefcase} 
              trend="+12%" 
              trendUp={true}
              color="primary"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatCard 
              label="Active Tasks" 
              value={tasksLoading ? "..." : pendingTasks} 
              icon={Activity} 
              trend="-5%" 
              trendUp={false}
              color="accent"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <StatCard 
              label="Completed" 
              value={tasksLoading ? "..." : completedTasks} 
              icon={CheckCircle2} 
              trend="+24%" 
              trendUp={true}
              color="purple"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <StatCard 
              label="Efficiency" 
              value="94%" 
              icon={Clock} 
              trend="+2%" 
              trendUp={true}
              color="orange"
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
            <h3 className="text-xl font-display font-bold text-white mb-6">Weekly Activity</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  />
                  <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 4 ? '#22d3ee' : '#4f46e5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-xl font-display font-bold text-white mb-6">Recent Projects</h3>
            <div className="space-y-4">
              {projectsLoading ? (
                <div className="text-muted-foreground text-sm">Loading projects...</div>
              ) : activeProjects === 0 ? (
                <div className="text-muted-foreground text-sm">No active projects.</div>
              ) : (
                projects?.slice(0, 4).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div>
                      <h4 className="font-semibold text-white text-sm group-hover:text-primary transition-colors">{project.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]">{project.description || 'No description'}</p>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary-foreground">
                      {project.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
