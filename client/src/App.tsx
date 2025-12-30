import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectBoard from "@/pages/ProjectBoard";
import Tasks from "@/pages/Tasks";
import Auth from "@/pages/Auth";
import MyProjects from "@/pages/MyProjects";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={Auth} />
      
      {/* Protected Admin Routes */}
      <Route path="/dashboard">
        <ProtectedRoute role="Admin">
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/projects">
        <ProtectedRoute role="Admin">
          <Layout>
            <Projects />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/projects/:id">
        <ProtectedRoute role="Admin">
          <Layout>
            <ProjectBoard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/tasks">
        <ProtectedRoute role="Admin">
          <Layout>
            <Tasks />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* Protected User Routes */}
      <Route path="/my-projects">
        <ProtectedRoute role="User">
          <Layout>
            <MyProjects />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
