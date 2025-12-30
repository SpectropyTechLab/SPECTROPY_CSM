import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";

const mockUserDB = [
  { email: "admin@spectropy.com", password: "admin123", role: "Admin" },
  { email: "user@spectropy.com", password: "user123", role: "User" }
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
    otp: ""
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userRole = localStorage.getItem("userRole");
    
    if (isAuthenticated && userRole) {
      setLocation(userRole === "Admin" ? "/dashboard" : "/my-projects");
    }
  }, [setLocation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleRoleChange = (value: string) => {
    setForm({ ...form, role: value });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      const user = mockUserDB.find(u => u.email === form.email && u.password === form.password);
      
      if (user) {
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("isAuthenticated", "true");
        setLocation(user.role === "Admin" ? "/dashboard" : "/my-projects");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } else {
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Button 
        variant="ghost" 
        onClick={() => setLocation("/")}
        className="mb-4 text-slate-500 hover:text-primary self-start ml-0 md:ml-[-10rem] flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Welcome
      </Button>
      <Card className="w-full max-w-md animate-fade border-slate-200 bg-white shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-primary">
            {isLogin ? "Login to Spectropy PMS" : "Register for Spectropy PMS"}
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            {isLogin ? "Enter your credentials to access your workspace" : "Create an account to get started with your projects"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                  <Input 
                    id="name"
                    name="name" 
                    placeholder="John Doe" 
                    onChange={handleChange} 
                    value={form.name}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Account Role</Label>
                  <Select onValueChange={handleRoleChange} defaultValue={form.role}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="User">Standard User</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input 
                id="email"
                name="email" 
                type="email" 
                placeholder="admin@spectropy.com" 
                required 
                onChange={handleChange} 
                value={form.email}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input 
                id="password"
                name="password" 
                type="password" 
                placeholder="••••••••"
                required 
                onChange={handleChange} 
                value={form.password}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-slate-300">Email Verification (OTP)</Label>
                <div className="flex gap-2">
                  <Input 
                    id="otp"
                    name="otp" 
                    placeholder="Enter OTP"
                    disabled
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 flex-1"
                  />
                  <Button type="button" variant="outline" disabled className="border-slate-700 text-slate-400">
                    Send OTP
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500 italic">OTP verification will be enabled in Phase 3 backend integration.</p>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-indigo-600 text-white font-semibold h-11 transition-all active:scale-95">
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }} 
              className="text-accent hover:underline font-medium transition-colors"
            >
              {isLogin ? "Register here" : "Login here"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
