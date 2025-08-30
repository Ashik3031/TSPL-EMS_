import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/authStore";
import { socketManager } from "@/lib/socket";
import Navigation from "@/components/Navigation";
import NotificationTakeover from "@/components/NotificationTakeover";
import Leaderboard from "@/pages/Leaderboard";
import TLDashboard from "@/pages/TLDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Switch>
      <Route path="/" component={Leaderboard} />
      <Route path="/login" component={Login} />
      
      {/* Protected routes */}
      {isAuthenticated && ['admin', 'tl'].includes(user?.role || '') && (
        <Route path="/tl" component={TLDashboard} />
      )}
      
      {isAuthenticated && user?.role === 'admin' && (
        <Route path="/admin" component={AdminDashboard} />
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Initialize WebSocket connection
    socketManager.connect();

    return () => {
      // Cleanup on app unmount
      socketManager.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main>
            <Router />
          </main>
          <NotificationTakeover />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
