import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Chores from "./pages/Chores";
import Ledger from "./pages/Ledger";
import Calendar from "./pages/Calendar";
import Comms from "./pages/Comms";
import { Navigation } from "./components/Navigation";
import { useAuth } from "./hooks/use-auth";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="min-h-screen bg-[#1a1a1a]" />;
  if (!user) {
    setLocation("/auth");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />
      <div className="flex-1 overflow-x-hidden">
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/">{() => <ProtectedRoute component={Dashboard} />}</Route>
          <Route path="/chores">{() => <ProtectedRoute component={Chores} />}</Route>
          <Route path="/ledger">{() => <ProtectedRoute component={Ledger} />}</Route>
          <Route path="/calendar">{() => <ProtectedRoute component={Calendar} />}</Route>
          <Route path="/comms">{() => <ProtectedRoute component={Comms} />}</Route>
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
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
