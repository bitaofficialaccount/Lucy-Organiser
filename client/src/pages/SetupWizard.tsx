import { useState } from "react";
import { useWizardContext } from "@/contexts/WizardContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { HardwareButton, OLEDDisplay, TapeLabel, Knob, PageTransition } from "@/components/ui/hardware";
import { api } from "@shared/routes";
import { z } from "zod";

export default function SetupWizard() {
  const { currentStep, setCurrentStep, parentInfo, setParentInfo, kids, addKid, removeKid, resetWizard } = useWizardContext();
  const { login } = useAuthContext();
  
  const [kidUsername, setKidUsername] = useState("");
  const [kidPassword, setKidPassword] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FF4F00");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const colors = ["#FF4F00", "#00D34D", "#007AFF", "#FFD600", "#D800FF"];

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const input = api.auth.registerParent.input.parse({
        username: (e.target as any).username.value,
        password: (e.target as any).password.value,
      });

      const res = await fetch(api.auth.registerParent.path, {
        method: api.auth.registerParent.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Registration failed");
        return;
      }

      const user = await res.json();
      login(user);
      setParentInfo({
        username: input.username,
        password: input.password,
      });
      setCurrentStep("add_kids");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKid = () => {
    if (!kidUsername.trim() || !kidPassword.trim()) {
      setError("Username and password are required");
      return;
    }

    addKid({
      username: kidUsername,
      password: kidPassword,
      color: selectedColor,
    });

    setKidUsername("");
    setKidPassword("");
  };

  const handleFinish = async () => {
    setError("");
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

      resetWizard();
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#1a1a1a] p-4 md:p-8 flex flex-col items-center justify-center">
        {currentStep === "parent_info" && (
          <form onSubmit={handleParentSubmit} className="w-full max-w-md">
            <TapeLabel className="mb-6 block text-center text-xl">MASTER_INIT</TapeLabel>
            <div className="space-y-4 bg-[#222] p-6 border-4 border-black">
              <OLEDDisplay className="mb-4">PARENT_CONFIG</OLEDDisplay>

              <input
                type="text"
                name="username"
                placeholder="Callsign (Username)"
                className="w-full bg-[#111] border-2 border-[#000] p-3 text-white font-display focus:outline-none focus:border-primary"
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Passcode"
                className="w-full bg-[#111] border-2 border-[#000] p-3 text-white font-display focus:outline-none focus:border-primary"
                required
              />

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <HardwareButton type="submit" className="w-full py-3 mt-4" color="#FF4F00" textColor="#000" disabled={isLoading}>
                {isLoading ? "PROCESSING..." : "PROCEED"}
              </HardwareButton>
            </div>
          </form>
        )}

        {currentStep === "add_kids" && (
          <div className="w-full max-w-2xl">
            <TapeLabel className="mb-6 block text-center text-xl">SUB_UNIT_CONFIG</TapeLabel>
            
            <div className="bg-[#222] p-6 border-4 border-black mb-6">
              <OLEDDisplay className="mb-6">ADD_SUBORDINATE_UNITS</OLEDDisplay>

              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Unit Callsign"
                  value={kidUsername}
                  onChange={(e) => setKidUsername(e.target.value)}
                  className="w-full bg-[#111] border-2 border-[#000] p-3 text-white font-display focus:outline-none focus:border-primary"
                />

                <input
                  type="password"
                  placeholder="Unit Passcode"
                  value={kidPassword}
                  onChange={(e) => setKidPassword(e.target.value)}
                  className="w-full bg-[#111] border-2 border-[#000] p-3 text-white font-display focus:outline-none focus:border-primary"
                />

                <div className="flex gap-2 justify-center">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-10 h-10 border-4 transition-all ${selectedColor === c ? "border-white scale-110 shadow-lg" : "border-black"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setSelectedColor(c)}
                    />
                  ))}
                </div>

                <HardwareButton type="button" onClick={handleAddKid} className="w-full py-2" color="#00D34D" textColor="#000">
                  + ADD_UNIT
                </HardwareButton>
              </div>

              {kids.length > 0 && (
                <div className="space-y-2 mb-6 bg-[#111] p-4 border border-[#333]">
                  <div className="text-xs font-display text-neutral-500">ACTIVE_UNITS:</div>
                  {kids.map((kid, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#0a0a0a] p-2 border border-[#222]">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: kid.color }} />
                        <span className="text-white text-sm">{kid.username}</span>
                      </div>
                      <HardwareButton
                        type="button"
                        onClick={() => removeKid(idx)}
                        className="px-2 py-1 text-xs"
                        color="#FF0000"
                        textColor="#FFF"
                      >
                        X
                      </HardwareButton>
                    </div>
                  ))}
                </div>
              )}

              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

              <div className="flex gap-2">
                <HardwareButton
                  type="button"
                  onClick={handleFinish}
                  className="flex-1 py-3"
                  color="#FF4F00"
                  textColor="#000"
                  disabled={isLoading}
                >
                  {isLoading ? "FINALIZING..." : "COMPLETE_SETUP"}
                </HardwareButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
