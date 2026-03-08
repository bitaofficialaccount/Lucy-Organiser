import { useState } from "react";
import { useWizardContext } from "@/contexts/WizardContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button, Card, Input, PageTransition, Header } from "@/components/ui/modern";
import { api } from "@shared/routes";
import { z } from "zod";
import { generateRandomName, generateRandomUsername } from "@/lib/utils";
import { Dice6, Plus, Trash2 } from "lucide-react";

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA502", "#9D84B7"];

export default function SetupWizard() {
  const { setIsNewUser } = useWizardContext();
  const { login } = useAuthContext();
  const [step, setStep] = useState<"parent" | "kids">("parent");

  const [kidName, setKidName] = useState("");
  const [kidUsername, setKidUsername] = useState("");
  const [kidPassword, setKidPassword] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [kids, setKids] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const addKid = () => {
    if (!kidName.trim() || !kidUsername.trim() || !kidPassword.trim()) {
      setError("All fields are required");
      return;
    }
    setKids([...kids, { name: kidName, username: kidUsername, password: kidPassword, color: selectedColor }]);
    setKidName("");
    setKidUsername("");
    setKidPassword("");
    setError("");
  };

  const removeKid = (index: number) => {
    setKids(kids.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (step === "parent") {
      setStep("kids");
    } else {
      // Create all kids
      if (kids.length === 0) {
        setError("You must add at least 1 kid");
        return;
      }

      setIsLoading(true);
      try {
        for (const kid of kids) {
          const input = api.auth.registerKid.input.parse({
            username: kid.username,
            password: kid.password,
            color: kid.color,
          });

          const res = await fetch(api.auth.registerKid.path, {
            method: api.auth.registerKid.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
            credentials: "include",
          });

          if (!res.ok) {
            const data = await res.json();
            setError(`Failed to create kid account: ${data.message}`);
            return;
          }
        }

        setIsNewUser(false);
      } catch (err) {
        setError("An error occurred");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          {step === "parent" && (
            <Card className="shadow-lg">
              <Header title="Let's Set Up Your Family 👨‍👩‍👧‍👦" />
              <p className="text-gray-600 mb-6">You are now a Parent account. Next, add your kids!</p>
              <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
                Add Kids →
              </Button>
            </Card>
          )}

          {step === "kids" && (
            <Card className="shadow-lg">
              <Header title="Add Your Kids" />

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kid's Name</label>
                  <div className="flex gap-2">
                    <Input
                      value={kidName}
                      onChange={(e) => setKidName(e.target.value)}
                      placeholder="e.g., Emma"
                      disabled={isLoading}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => setKidName(generateRandomName())}
                      disabled={isLoading}
                      className="px-3"
                    >
                      <Dice6 size={18} />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <div className="flex gap-2">
                    <Input
                      value={kidUsername}
                      onChange={(e) => setKidUsername(e.target.value)}
                      placeholder="e.g., coolpanda42"
                      disabled={isLoading}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => setKidUsername(generateRandomUsername())}
                      disabled={isLoading}
                      className="px-3"
                    >
                      <Dice6 size={18} />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <Input
                    type="password"
                    value={kidPassword}
                    onChange={(e) => setKidPassword(e.target.value)}
                    placeholder="Create a password"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${
                          selectedColor === c ? "border-gray-900 scale-110" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: c }}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={addKid}
                  disabled={isLoading || !kidName.trim() || !kidUsername.trim() || !kidPassword.trim()}
                >
                  <Plus size={18} /> Add Kid
                </Button>
              </div>

              {kids.length > 0 && (
                <div className="mb-6 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Added {kids.length} kid{kids.length !== 1 ? "s" : ""}
                  </p>
                  {kids.map((kid, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: kid.color }}
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{kid.name}</p>
                          <p className="text-sm text-gray-600">@{kid.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeKid(idx)}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                        disabled={isLoading}
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setStep("parent")} disabled={isLoading}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleNext}
                  disabled={isLoading || kids.length === 0}
                >
                  {isLoading ? "Setting up..." : "Done"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
