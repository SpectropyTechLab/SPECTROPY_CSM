import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Hexagon, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center z-10 px-4 max-w-3xl mx-auto"
      >
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3">
            <Hexagon className="text-white w-10 h-10 fill-white/20" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight">
          Spectropy <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">PMS</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          The next generation project management system. Streamline your workflow, collaborate with your team, and ship faster.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/dashboard">
            <Button className="h-14 px-8 rounded-full text-lg bg-white text-background hover:bg-gray-100 font-bold transition-all hover:scale-105">
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button variant="outline" className="h-14 px-8 rounded-full text-lg border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm transition-all">
            View Documentation
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            "Base Setup Ready",
            "Real-time Collaboration",
            "Advanced Analytics"
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm"
            >
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="font-medium text-white">{feature}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      <div className="absolute bottom-8 text-center text-sm text-muted-foreground opacity-60">
        © 2024 Spectropy Inc. All rights reserved.
      </div>
    </div>
  );
}
