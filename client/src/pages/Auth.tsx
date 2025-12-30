import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
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

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (user) => {
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userId", String(user.id));
      localStorage.setItem("userName", user.name);
      localStorage.setItem("isAuthenticated", "true");
      setLocation(user.role === "Admin" ? "/dashboard" : "/my-projects");
    },
    onError: (err: Error) => {
      setError(err.message.includes("401") ? "Invalid email or password" : err.message);
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/auth/send-otp", { email });
      return res.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      setSuccess("OTP sent to your email. Check server console for the code.");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const res = await apiRequest("POST", "/api/auth/verify-otp", data);
      return res.json();
    },
    onSuccess: () => {
      setOtpVerified(true);
      setSuccess("OTP verified successfully. You can now create your account.");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; role: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: () => {
      setSuccess("Account created successfully. Please login.");
      setIsLogin(true);
      setOtpSent(false);
      setOtpVerified(false);
      setForm({ name: "", email: "", password: "", role: "User", otp: "" });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handleRoleChange = (value: string) => {
    setForm({ ...form, role: value });
    setError(null);
  };

  const handleSendOtp = () => {
    if (!form.email) {
      setError("Please enter your email first");
      return;
    }
    sendOtpMutation.mutate(form.email);
  };

  const handleVerifyOtp = () => {
    if (!form.otp) {
      setError("Please enter the OTP");
      return;
    }
    verifyOtpMutation.mutate({ email: form.email, otp: form.otp });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isLogin) {
      loginMutation.mutate({ email: form.email, password: form.password });
    } else {
      if (!otpVerified) {
        setError("Please verify your email with OTP first");
        return;
      }
      registerMutation.mutate({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
      });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Button 
        variant="ghost" 
        onClick={() => setLocation("/")}
        className="mb-4 text-slate-500 hover:text-primary self-start ml-0 md:ml-[-10rem] flex items-center gap-2"
        data-testid="button-back-to-welcome"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Welcome
      </Button>
      <Card className="w-full max-w-md animate-fade border-slate-200 bg-white shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-primary" data-testid="text-auth-title">
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
                <AlertDescription data-testid="text-error-message">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription data-testid="text-success-message">{success}</AlertDescription>
              </Alert>
            )}

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                  <Input 
                    id="name"
                    name="name" 
                    placeholder="John Doe" 
                    onChange={handleChange} 
                    value={form.name}
                    className="border-slate-300"
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Account Role</Label>
                  <Select onValueChange={handleRoleChange} defaultValue={form.role}>
                    <SelectTrigger className="border-slate-300" data-testid="select-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="User">Standard User</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
              <Input 
                id="email"
                name="email" 
                type="email" 
                placeholder="admin@spectropy.com" 
                required 
                onChange={handleChange} 
                value={form.email}
                className="border-slate-300"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <Input 
                id="password"
                name="password" 
                type="password" 
                placeholder="Enter password"
                required 
                onChange={handleChange} 
                value={form.password}
                className="border-slate-300"
                data-testid="input-password"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-slate-700">Email Verification (OTP)</Label>
                <div className="flex gap-2">
                  <Input 
                    id="otp"
                    name="otp" 
                    placeholder={otpSent ? "Enter 6-digit OTP" : "Request OTP first"}
                    value={form.otp}
                    onChange={handleChange}
                    disabled={!otpSent || otpVerified}
                    className="border-slate-300 flex-1"
                    data-testid="input-otp"
                  />
                  {!otpSent ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSendOtp}
                      disabled={sendOtpMutation.isPending}
                      className="border-slate-300"
                      data-testid="button-send-otp"
                    >
                      {sendOtpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                    </Button>
                  ) : !otpVerified ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleVerifyOtp}
                      disabled={verifyOtpMutation.isPending}
                      className="border-slate-300"
                      data-testid="button-verify-otp"
                    >
                      {verifyOtpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                    </Button>
                  ) : (
                    <div className="flex items-center px-3 text-emerald-600">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>
                {otpSent && !otpVerified && (
                  <p className="text-xs text-slate-500">Check server console for the OTP code.</p>
                )}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-indigo-600 text-white font-semibold h-11 transition-all"
              disabled={isLoading || (!isLogin && !otpVerified)}
              data-testid="button-submit"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccess(null);
                setOtpSent(false);
                setOtpVerified(false);
              }} 
              className="text-accent hover:underline font-medium transition-colors"
              data-testid="button-toggle-auth-mode"
            >
              {isLogin ? "Register here" : "Login here"}
            </button>
          </div>

          {isLogin && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                Test Credentials:<br />
                <span className="font-mono">admin@spectropy.com / admin123</span> (Admin)<br />
                <span className="font-mono">user@spectropy.com / user123</span> (User)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
