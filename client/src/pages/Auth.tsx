import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWizardContext } from "@/contexts/WizardContext";
import { Button, Card, Input, PageTransition } from "@/components/ui/modern";
import { api } from "@shared/routes";
import { z } from "zod";
import { User, Baby } from "lucide-react";
import logoPath from "@assets/LUCY_ORG._LOGO1_1777455425900.png";

type Mode = "choose" | "parent_signin" | "parent_signup";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, login } = useAuthContext();
  const { setIsNewUser } = useWizardContext();

  const [mode, setMode] = useState<Mode>("choose");
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
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "parent_signin") {
        const input = api.auth.login.input.parse({ username, password });
        const res = await fetch(api.auth.login.path, {
          method: api.auth.login.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Sign in failed");
          return;
        }

        login(data);
        setLocation("/");
      } else if (mode === "parent_signup") {
        const input = api.auth.registerParent.input.parse({ username, password });
        const res = await fetch(api.auth.registerParent.path, {
          method: api.auth.registerParent.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Could not create account");
          return;
        }

        login(data);
        setIsNewUser(true);
        setLocation("/");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <img
              src={logoPath}
              alt="Lucy Organiser"
              className="w-44 h-44 md:w-52 md:h-52 mx-auto -mb-2 object-contain"
              data-testid="img-logo"
            />
            <p className="text-gray-700 mt-1 font-semibold text-sm md:text-base">
              Open-Source Family Organising
            </p>
          </motion.div>

          {mode === "choose" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full !rounded-2xl py-5"
                onClick={() => setMode("parent_signin")}
                data-testid="button-parent-signin"
              >
                <User size={20} /> Parent Sign In
              </Button>

              <Button
                variant="secondary"
                size="lg"
                className="w-full !rounded-2xl py-5 !bg-yellow-400 hover:!bg-yellow-500 !text-gray-900"
                onClick={() => setLocation("/kid-login")}
                data-testid="button-kid-signin"
              >
                <Baby size={20} /> Sign In with Kid ID
              </Button>

              <div className="text-center pt-4">
                <button
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => setMode("parent_signup")}
                  data-testid="button-create-account"
                >
                  New family? Create an account
                </button>
              </div>
            </motion.div>
          )}

          {(mode === "parent_signin" || mode === "parent_signup") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="shadow-lg">
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setMode("choose");
                      setError("");
                      setUsername("");
                      setPassword("");
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Back
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {mode === "parent_signin" ? "Parent Sign In" : "Create Family"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username
                    </label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      disabled={isSubmitting}
                      required
                      autoFocus
                      data-testid="input-username"
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
                      placeholder="Enter your password"
                      disabled={isSubmitting}
                      required
                      data-testid="input-password"
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
                    data-testid="button-submit"
                  >
                    {isSubmitting
                      ? "Loading..."
                      : mode === "parent_signin"
                      ? "Sign In"
                      : "Create Account"}
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-8 text-center">
          🐾 Open-Source. Family-Friendly. Always Yours.
        </p>
      </div>
    </PageTransition>
  );
}
