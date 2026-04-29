import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button, Input } from "@/components/ui/modern";
import { api } from "@shared/routes";
import { ArrowLeft } from "lucide-react";

type Step = "username" | "password";

export default function KidLogin() {
  const [, setLocation] = useLocation();
  const { user, isLoading, login } = useAuthContext();

  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [kidColor, setKidColor] = useState("#FFD600"); // start yellow
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/auth/lookup/${encodeURIComponent(username)}`, {
        credentials: "include",
      });

      if (!res.ok) {
        setError("No kid found with that username");
        return;
      }

      const data = await res.json();
      if (data.role !== "kid") {
        setError("That's a parent account. Use Parent Sign In instead.");
        return;
      }

      // Animate to kid's color
      setKidColor(data.color || "#FF6B6B");
      setStep("password");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Wrong password");
        return;
      }

      login(data);
      setLocation("/");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      animate={{ backgroundColor: kidColor }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <button
          onClick={() => setLocation("/auth")}
          className="mb-6 flex items-center gap-2 text-gray-900 hover:opacity-70 transition-opacity font-semibold"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-7xl mb-3">👋</div>
          <h1 className="text-4xl font-bold text-gray-900">Hey Kiddo!</h1>
          <p className="text-gray-900 opacity-80 mt-2">
            {step === "username" ? "What's your username?" : "Now your password!"}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "username" && (
            <motion.form
              key="username"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleUsernameSubmit}
              className="bg-white rounded-3xl p-6 shadow-xl space-y-4"
            >
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                disabled={isSubmitting}
                required
                autoFocus
                className="text-lg py-3"
                data-testid="input-kid-username"
              />

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
                disabled={isSubmitting || !username.trim()}
                data-testid="button-next"
              >
                {isSubmitting ? "Looking..." : "Next →"}
              </Button>
            </motion.form>
          )}

          {step === "password" && (
            <motion.form
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handlePasswordSubmit}
              className="bg-white rounded-3xl p-6 shadow-xl space-y-4"
            >
              <div className="text-center mb-2">
                <p className="text-gray-600">Welcome back,</p>
                <p className="font-bold text-xl text-gray-900">@{username}</p>
              </div>

              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                disabled={isSubmitting}
                required
                autoFocus
                className="text-lg py-3"
                data-testid="input-kid-password"
              />

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
                disabled={isSubmitting || !password.trim()}
                data-testid="button-signin"
              >
                {isSubmitting ? "Signing in..." : "Let me in! 🚀"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("username");
                  setPassword("");
                  setError("");
                  setKidColor("#FFD600");
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-900 mt-2"
              >
                Wrong username? Go back
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
