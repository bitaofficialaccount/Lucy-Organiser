import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWizardContext } from "@/contexts/WizardContext";
import { HardwareButton, OLEDDisplay, TapeLabel, PageTransition } from "@/components/ui/hardware";
import { api } from "@shared/routes";
import { z } from "zod";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, login } = useAuthContext();
  const { setIsNewUser } = useWizardContext();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <OLEDDisplay className="max-w-md w-full text-center py-12">
          SYSTEM_BOOTING...<br />
          <span className="animate-pulse">_</span>
        </OLEDDisplay>
      </div>
    );
  }

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        // Login
        const input = api.auth.login.input.parse({ username, password });
        const res = await fetch(api.auth.login.path, {
          method: api.auth.login.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Login failed");
          return;
        }

        const userData = api.auth.login.responses[200].parse(data);
        login(userData);
        setLocation("/");
      } else {
        // Register as Parent
        const input = api.auth.registerParent.input.parse({ username, password });
        const res = await fetch(api.auth.registerParent.path, {
          method: api.auth.registerParent.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Registration failed");
          return;
        }

        const userData = api.auth.registerParent.responses[201].parse(data);
        login(userData);
        setIsNewUser(true);
        setLocation("/");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center relative">
            <TapeLabel className="text-xl rotate-[-3deg] absolute -top-4 -left-4 z-10 shadow-lg">
              System Power
            </TapeLabel>
            <OLEDDisplay className="py-8">
              <div className="text-2xl font-bold text-center tracking-widest mb-2">LUCY_OS v1.0</div>
              <div className="text-center text-xs opacity-70">AWAITING_INPUT</div>
            </OLEDDisplay>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-[#222] border-4 border-[#111] p-6 rounded-none shadow-[16px_16px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex mb-8 gap-4 border-b-2 border-[#111] pb-4">
              <button
                type="button"
                className={`font-display uppercase tracking-widest text-sm flex-1 py-2 ${
                  isLoginMode ? "text-primary" : "text-neutral-500 hover:text-white"
                }`}
                onClick={() => {
                  setIsLoginMode(true);
                  setError("");
                }}
              >
                {">"}Login
              </button>
              <button
                type="button"
                className={`font-display uppercase tracking-widest text-sm flex-1 py-2 ${
                  !isLoginMode ? "text-primary" : "text-neutral-500 hover:text-white"
                }`}
                onClick={() => {
                  setIsLoginMode(false);
                  setError("");
                }}
              >
                {">"}System Setup
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-display uppercase tracking-wider text-neutral-400 mb-2">
                  Username_
                </label>
                <input
                  className="w-full bg-[#111] border-2 border-[#000] p-4 text-white font-display focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-display uppercase tracking-wider text-neutral-400 mb-2">
                  Password_
                </label>
                <input
                  type="password"
                  className="w-full bg-[#111] border-2 border-[#000] p-4 text-white font-display focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="bg-destructive/20 border border-destructive text-destructive p-3 font-display text-sm">
                  ERR: {error}
                </div>
              )}

              <HardwareButton
                type="submit"
                className="w-full py-4 text-lg font-bold"
                color="#FF4F00"
                textColor="#000"
                disabled={isSubmitting || !username.trim() || !password.trim()}
              >
                {isSubmitting ? "PROCESSING..." : isLoginMode ? "ENTER_SYSTEM" : "INITIALIZE_PARENT"}
              </HardwareButton>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
