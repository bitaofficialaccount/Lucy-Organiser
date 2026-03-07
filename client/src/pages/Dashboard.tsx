import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useFamilyMembers, useRegisterKid } from "@/hooks/use-family";
import { HardwareButton, OLEDDisplay, TapeLabel, PageTransition } from "@/components/ui/hardware";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: user } = useAuth();
  const { data: members, isLoading: membersLoading } = useFamilyMembers();
  const registerKid = useRegisterKid();
  
  const [showAddMember, setShowAddMember] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newKidPass, setNewKidPass] = useState("");
  const [newKidColor, setNewKidColor] = useState("#00D34D");

  if (!user) return null;
  const isKid = user.role === "kid";
  const accentColor = user.color || "#FF4F00";

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    registerKid.mutate({ username: newKidName, password: newKidPass, color: newKidColor }, {
      onSuccess: () => {
        setShowAddMember(false);
        setNewKidName("");
        setNewKidPass("");
      }
    });
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 w-full">
            <TapeLabel className="mb-4 text-2xl" angle={-1}>
              {isKid ? `${user.username}'S STATION` : 'MASTER CONTROL'}
            </TapeLabel>
            
            <OLEDDisplay className="h-40 justify-center">
              <div className="text-xl opacity-50">STATUS:</div>
              <div className="text-4xl">{isKid ? 'READY' : 'ONLINE'}</div>
              {isKid && <div className="text-2xl mt-4 text-yellow-400">FUNDS: ${(user.balance / 100).toFixed(2)}</div>}
            </OLEDDisplay>
          </div>

          {!isKid && (
            <div className="bg-[#222] p-6 border-4 border-black shadow-[8px_8px_0px_#000] w-full md:w-1/3">
              <h2 className="font-display text-neutral-500 mb-4">SYSTEM_UNITS</h2>
              <div className="space-y-2">
                {membersLoading ? (
                  <div className="text-white font-mono animate-pulse">Scanning...</div>
                ) : members?.map(m => (
                  <div key={m.id} className="flex justify-between items-center bg-[#111] p-3 border border-[#333]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: m.color || '#fff' }} />
                      <span className="font-display text-white uppercase">{m.username}</span>
                    </div>
                    <span className="font-mono text-neutral-400">${(m.balance / 100).toFixed(2)}</span>
                  </div>
                ))}
                
                <HardwareButton 
                  className="w-full mt-4 py-2 text-sm" 
                  color="#333" 
                  textColor="#FFF"
                  onClick={() => setShowAddMember(!showAddMember)}
                >
                  + ADD SUB-UNIT
                </HardwareButton>
              </div>
            </div>
          )}
        </div>

        {showAddMember && !isKid && (
          <form onSubmit={handleAddMember} className="bg-[#1a1a1a] p-6 border-2 border-primary border-dashed w-full max-w-md mx-auto">
            <h3 className="font-display text-primary mb-4 uppercase">Initialize Sub-Unit</h3>
            <div className="space-y-4">
              <input 
                className="w-full bg-[#111] border-2 border-[#000] p-3 text-white font-display" 
                placeholder="Callsign (Username)" 
                value={newKidName}
                onChange={e => setNewKidName(e.target.value)}
                required
              />
              <input 
                className="w-full bg-[#111] border-2 border-[#000] p-3 text-white font-display" 
                type="password"
                placeholder="Passcode" 
                value={newKidPass}
                onChange={e => setNewKidPass(e.target.value)}
                required
              />
              <div className="flex gap-2 justify-between">
                {["#FF4F00", "#00D34D", "#007AFF", "#FFD600", "#D800FF"].map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-10 h-10 border-4 transition-all ${newKidColor === c ? 'border-white scale-110 shadow-lg' : 'border-black'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewKidColor(c)}
                  />
                ))}
              </div>
              <HardwareButton type="submit" color="#FF4F00" textColor="#FFF" className="w-full py-3" disabled={registerKid.isPending}>
                DEPLOY
              </HardwareButton>
            </div>
          </form>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <HardwareButton onClick={() => setLocation("/comms")} color={isKid ? accentColor : "#E8E8E8"} textColor={isKid ? "#000" : "#111"} className="h-32 md:h-48 text-lg md:text-2xl flex-col gap-2">
            <span className="opacity-50 text-sm">CH 01</span>
            COMMS
          </HardwareButton>
          <HardwareButton onClick={() => setLocation("/chores")} color={isKid ? accentColor : "#E8E8E8"} textColor={isKid ? "#000" : "#111"} className="h-32 md:h-48 text-lg md:text-2xl flex-col gap-2">
            <span className="opacity-50 text-sm">CH 02</span>
            CHORES
          </HardwareButton>
          <HardwareButton onClick={() => setLocation("/ledger")} color={isKid ? accentColor : "#E8E8E8"} textColor={isKid ? "#000" : "#111"} className="h-32 md:h-48 text-lg md:text-2xl flex-col gap-2">
            <span className="opacity-50 text-sm">CH 03</span>
            LEDGER
          </HardwareButton>
          <HardwareButton onClick={() => setLocation("/calendar")} color={isKid ? accentColor : "#E8E8E8"} textColor={isKid ? "#000" : "#111"} className="h-32 md:h-48 text-lg md:text-2xl flex-col gap-2">
            <span className="opacity-50 text-sm">CH 04</span>
            PLANNER
          </HardwareButton>
        </div>
      </div>
    </PageTransition>
  );
}
