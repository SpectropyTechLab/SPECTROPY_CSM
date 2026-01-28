import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Target, Layers, ChevronRight } from "lucide-react";

const Landing = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Background Mesh - Lightened for visibility */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Sleek Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-slate-900">
            <Layers className="w-6 h-6 text-primary" />
            <span>SPECTROPY <span className="text-primary">CSM</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost" className="text-slate-600 hover:text-primary hover:bg-primary/5">
                Sign In
              </Button>
            </Link>

          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-40 pb-20 px-6">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1] text-slate-900">
              Filling The <br />
              <span className="text-primary">Learning Gap.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
              Spectropy PMS is the specialized engine for educational excellence.
              Manage content, teams, and delivery pipelines in one unified space.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-5">
              <Link href="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 h-14 rounded-full font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

            </div>
          </motion.div>
        </div>

        {/* Updated Grid - Light Theme Cards */}
        <section className="max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group p-8 rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Enterprise Security</h3>
            <p className="text-slate-600 leading-relaxed">
              Bank-grade encryption protecting your proprietary educational frameworks and student data.
            </p>
          </div>

          <div className="group p-8 rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-sm hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-400/5 transition-all duration-300">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Rapid Pipeline</h3>
            <p className="text-slate-600 leading-relaxed">
              Automated workflows designed specifically for curriculum development and content delivery.
            </p>
          </div>

          <div className="group p-8 rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-sm hover:border-emerald-400/50 hover:shadow-xl hover:shadow-emerald-400/5 transition-all duration-300">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Smart Analytics</h3>
            <p className="text-slate-600 leading-relaxed">
              Deep-dive metrics into team performance and project milestones with AI-driven insights.
            </p>
          </div>
        </section>

        {/* CTA Banner - High Contrast Light */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-6xl mx-auto mt-32 p-12 rounded-[2.5rem] bg-slate-900 text-white text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full -mr-32 -mt-32" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to empower your projects?</h2>
          <Link href="/auth">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-10 font-bold h-14 relative z-10">
              Join Future Foundation <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </main>

      <footer className="border-t border-slate-200 py-12 text-center bg-white">
        <p className="text-slate-500 text-sm font-medium">
          © 2026 SPECTROPY FUTURE FOUNDATION. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
};

export default Landing;