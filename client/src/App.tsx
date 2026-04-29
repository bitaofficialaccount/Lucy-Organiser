import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { WizardProvider, useWizardContext } from "@/contexts/WizardContext";
import NotFound from "@/pages/not-found";

import AuthPage from "./pages/Auth";
import KidLogin from "./pages/KidLogin";
import SetupWizard from "./pages/SetupWizard";
import Dashboard from "./pages/Dashboard";
import Chores from "./pages/Chores";
import Ledger from "./pages/Ledger";
import Calendar from "./pages/Calendar";
import Comms from "./pages/Comms";
import { Navigation } from "./components/Navigation";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuthContext();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return <div className="min-h-screen bg-gray-50" />;
  if (!user) return null;

  return <Component />;
}

function RouterContent() {
  const { user, isLoading } = useAuthContext();
  const { isNewUser } = useWizardContext();

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  // If parent just registered, show setup wizard
  if (user && user.role === "parent" && isNewUser) {
    return <SetupWizard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Navigation />}
      <div className="flex-1 overflow-x-hidden">
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/kid-login" component={KidLogin} />
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
      <AuthProvider>
        <WizardProvider>
          <TooltipProvider>
            <Toaster />
            <RouterContent />
          </TooltipProvider>
        </WizardProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
