import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: "primary" | "accent" | "purple" | "orange";
}

export function StatCard({ label, value, icon: Icon, trend, trendUp, color = "primary" }: StatCardProps) {
  const colorStyles = {
    primary: "from-primary/20 to-primary/5 text-primary",
    accent: "from-accent/20 to-accent/5 text-accent",
    purple: "from-purple-500/20 to-purple-500/5 text-purple-400",
    orange: "from-orange-500/20 to-orange-500/5 text-orange-400",
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      <div className={cn(
        "absolute -right-6 -top-6 w-32 h-32 rounded-full bg-gradient-to-br opacity-50 blur-3xl transition-opacity group-hover:opacity-70",
        colorStyles[color]
      )} />
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{label}</p>
          <h3 className="text-3xl font-display font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl bg-white/5 border border-white/5", colorStyles[color].split(" ")[2])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-2 relative z-10">
          <span className={cn(
            "text-xs font-semibold px-2 py-1 rounded-md",
            trendUp ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          )}>
            {trend}
          </span>
          <span className="text-muted-foreground text-xs">vs last month</span>
        </div>
      )}
    </div>
  );
}
