import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  TrendingUp, 
  Clock, 
  Target,
  BarChart2,
  PieChart as PieChartIcon
} from "lucide-react";
import { motion } from "framer-motion";

const Dashboard = () => {
  const stats = [
    { label: "Total Projects", value: "5", icon: FolderKanban, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Total Tasks", value: "28", icon: CheckSquare, color: "text-primary", bg: "bg-primary/10" },
    { label: "Completed Tasks", value: "16", icon: Target, color: "text-accent", bg: "bg-accent/10" },
    { label: "Efficiency", value: "76%", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-primary" />
          Admin Dashboard
        </h2>
        <p className="text-muted-foreground">Welcome back. Here's a snapshot of your workspace metrics.</p>
      </div>

      {/* KPI Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div key={index} variants={item}>
            <Card className="hover-elevate bg-card/50 border-border/50 backdrop-blur-sm overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground px-2 py-1 rounded-full bg-white/5">
                    +12% this month
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <Card className="lg:col-span-2 bg-card/50 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                Project Progression
              </CardTitle>
              <p className="text-sm text-muted-foreground">Overall completion rate across all active buckets.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-accent">58%</span>
              <p className="text-xs text-muted-foreground">Aggregate Score</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300 font-medium">Task Completion</span>
                <span className="text-accent font-bold">16/28 Tasks</span>
              </div>
              <Progress value={58} className="h-3 bg-slate-800/50" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Avg. Response Time
                </div>
                <p className="text-lg font-bold text-white">4.2h</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="w-3 h-3" />
                  Milestones Hit
                </div>
                <p className="text-lg font-bold text-white">12/15</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Info */}
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-accent" />
              Resource Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-300">Design Systems</p>
                  <p className="text-xs text-muted-foreground">40% capacity</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-300">Backend API</p>
                  <p className="text-xs text-muted-foreground">35% capacity</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-300">User Testing</p>
                  <p className="text-xs text-muted-foreground">25% capacity</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
