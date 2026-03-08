import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWizardContext } from "@/contexts/WizardContext";
import { Button, Card, Input, PageTransition, Header } from "@/components/ui/modern";
import { api } from "@shared/routes";
import { z } from "zod";
import { Users } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Loading...</p>
        </div>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">👨‍👩‍👧‍👦</div>
            <h1 className="text-4xl font-bold text-gray-900">Lucy Organiser</h1>
            <p className="text-gray-600 mt-2">Family Connection</p>
          </div>

          <Card className="shadow-lg border-0">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => {
                  setIsLoginMode(true);
                  setError("");
                }}
                className={`flex-1 py-2 font-semibold rounded-full transition-colors ${
                  isLoginMode
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsLoginMode(false);
                  setError("");
                }}
                className={`flex-1 py-2 font-semibold rounded-full transition-colors ${
                  !isLoginMode
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting || !username.trim() || !password.trim()}
              >
                {isSubmitting ? "Loading..." : isLoginMode ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
