import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Layout,
  PanelTop,
  GitFork,
  ScrollText,
  Users2,
  BarChart3,
  Play,
  ChevronRight
} from "lucide-react";

const FEATURES = [
  {
    title: "Projectboard that stays fast",
    desc: "Switch between Kanban and list views to track every task without the loading spinner.",
    icon: Layout,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "hover:border-blue-200"
  },
  {
    title: "Task dialog power panel",
    desc: "Update status, assign owners, attach files, and comment in one centralized modal.",
    icon: PanelTop,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "hover:border-indigo-200"
  },
  {
    title: "Client pipeline clarity",
    desc: "Move deals through custom stages with attached notes, reminders, and interaction history.",
    icon: GitFork,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "hover:border-purple-200"
  },
  {
    title: "Full activity logs",
    desc: "See who changed what and when. A searchable audit trail means zero guesswork.",
    icon: ScrollText,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "hover:border-amber-200"
  },
  {
    title: "Team-ready by default",
    desc: "Granular roles, real-time notifications, and @mentions to keep everyone aligned.",
    icon: Users2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "hover:border-emerald-200"
  },
  {
    title: "Actionable Insights",
    desc: "Visualize weekly progress, spot overdue tasks, and balance team workload instantly.",
    icon: BarChart3,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "hover:border-rose-200"
  }
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary/20 selection:text-primary font-sans">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-slate-900">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Layout className="w-5 h-5" />
            </div>
            <span>SPECTROPY <span className="text-primary">CRM</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost" className="text-slate-600 hover:text-primary font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/auth?view=register">
              <Button className="hidden sm:flex bg-slate-900 text-white hover:bg-slate-800">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20 px-6">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              v2.0 is now live for all teams
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1] text-slate-900">
              Run projects & client work <br />
              from <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">one clean workspace.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
              Spectropy‑CRM combines tasks, pipelines, and team activity so nothing slips through the cracks.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 h-14 rounded-full font-bold text-lg shadow-xl shadow-primary/20 transition-transform hover:scale-105">
                  Start Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 px-8 h-14 rounded-full font-bold text-lg">
                <Play className="mr-2 w-4 h-4 fill-slate-700" />
                View Demo
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Social Proof Strip */}
        <div className="max-w-4xl mx-auto mb-32 border-y border-slate-200 bg-white/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div className="p-6 flex items-center justify-center gap-4">
              <div className="text-4xl font-black text-slate-900">10+</div>
              <p className="text-slate-600 text-sm font-medium leading-tight">
                Projects shipped per month <br /> by average teams
              </p>
            </div>
            <div className="p-6 flex items-center justify-center gap-4">
              <div className="text-4xl font-black text-slate-900">98%</div>
              <p className="text-slate-600 text-sm font-medium leading-tight">
                Of tasks updated <br /> without email threads
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to ship</h2>
            <p className="text-slate-500 text-lg">Powerful enough for engineers, simple enough for sales.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`group p-8 rounded-3xl border border-slate-200 bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 ${feature.border}`}
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mt-32 p-12 md:p-20 rounded-[2.5rem] bg-slate-900 text-white text-center shadow-2xl relative overflow-hidden"
        >
          {/* Decorative gradients inside CTA */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 blur-[100px] rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/30 blur-[80px] rounded-full -ml-20 -mb-20" />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
              Bring your workflow <br /> together today.
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-10 h-14 font-bold text-lg">
                  Start Free
                  <ChevronRight className="ml-1 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800 hover:text-white rounded-full px-10 h-14 font-bold text-lg bg-transparent">
                Schedule a Demo
              </Button>
            </div>
            <p className="mt-8 text-slate-400 text-sm font-medium">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-slate-200 py-12 text-center bg-white">
        <div className="flex justify-center items-center gap-2 mb-4 font-bold text-slate-900">
          <Layout className="w-5 h-5 text-primary" />
          <span>SPECTROPY CRM</span>
        </div>
        <p className="text-slate-500 text-sm font-medium">
          © 2026 Spectropy Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Landing;