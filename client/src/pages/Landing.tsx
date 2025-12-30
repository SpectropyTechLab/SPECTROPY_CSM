import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Rocket, ArrowRight, Shield, Zap, Target } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center px-6 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full text-center space-y-8 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
          <Rocket className="w-4 h-4" />
          <span>New: Spectropy v2.0 is live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          <span className="text-white">Welcome to </span>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Spectropy PMS
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-300 font-medium italic">
          "Filling The Learning Gap" – Empowering Projects. Enabling People.
        </p>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Spectropy PMS is a specialized Project Management System designed for educational excellence. 
          Manage your content, teams, and delivery pipelines with full visibility and smart analytics.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link href="/auth">
            <Button size="lg" className="bg-primary hover:bg-indigo-600 text-white px-8 rounded-xl font-bold text-lg h-12 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/auth">
            <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-black px-8 rounded-xl font-bold text-lg h-12 transition-all hover:scale-105 active:scale-95">
              Register
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in delay-500">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <Shield className="w-8 h-8 text-primary mb-3 mx-auto" />
            <h3 className="font-bold text-white">Secure</h3>
            <p className="text-sm text-slate-400">Enterprise-grade security for your data.</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <Zap className="w-8 h-8 text-accent mb-3 mx-auto" />
            <h3 className="font-bold text-white">Fast</h3>
            <p className="text-sm text-slate-400">Optimized for speed and productivity.</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <Target className="w-8 h-8 text-indigo-400 mb-3 mx-auto" />
            <h3 className="font-bold text-white">Focused</h3>
            <p className="text-sm text-slate-400">Designed for educational excellence.</p>
          </div>
        </div>

        {/* Dashboard Preview Placeholder */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 pt-8 border-t border-slate-800"
        >
          <div className="bg-slate-900/80 p-4 rounded-3xl shadow-2xl border border-slate-700/50 max-w-3xl mx-auto overflow-hidden">
             <div className="flex gap-1.5 mb-3 px-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
             </div>
             <div className="bg-slate-950 rounded-xl h-48 flex items-center justify-center border border-slate-800">
                <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Dashboard Preview</p>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Landing;
