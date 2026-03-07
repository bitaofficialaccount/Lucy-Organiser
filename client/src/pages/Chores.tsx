import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChores, useCreateChore, useMarkChoreDone } from "@/hooks/use-tasks";
import { useFamilyMembers } from "@/hooks/use-family";
import { HardwareButton, OLEDDisplay, TapeLabel, PageTransition } from "@/components/ui/hardware";

export default function Chores() {
  const { data: user } = useAuth();
  const { data: chores, isLoading } = useChores();
  const { data: members } = useFamilyMembers();
  const createChore = useCreateChore();
  const markDone = useMarkChoreDone();

  const [newChoreTitle, setNewChoreTitle] = useState("");
  const [selectedKid, setSelectedKid] = useState<number | "">("");

  if (!user) return null;
  const isKid = user.role === "kid";
  const accentColor = user.color || "#00D34D";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKid) return;
    createChore.mutate({ title: newChoreTitle, kidId: Number(selectedKid) }, {
      onSuccess: () => {
        setNewChoreTitle("");
        setSelectedKid("");
      }
    });
  };

  const filteredChores = isKid 
    ? chores?.filter(c => c.kidId === user.id) 
    : chores;

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <TapeLabel className="mb-8 text-xl" angle={1}>TASK_MATRIX</TapeLabel>

        <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
          <div className="space-y-4">
            {isLoading ? (
              <OLEDDisplay>LOADING_TASKS...</OLEDDisplay>
            ) : filteredChores?.length === 0 ? (
              <OLEDDisplay className="text-neutral-500">NO_ACTIVE_TASKS</OLEDDisplay>
            ) : (
              filteredChores?.map(chore => {
                const assignedKid = members?.find(m => m.id === chore.kidId);
                const kidColor = assignedKid?.color || accentColor;
                
                return (
                  <div key={chore.id} className={`flex items-center justify-between p-4 bg-[#1A1A1A] border-l-8 border-[#222] shadow-md ${chore.isDone ? 'opacity-50' : ''}`} style={{ borderLeftColor: kidColor }}>
                    <div>
                      <div className={`font-display text-lg ${chore.isDone ? 'line-through text-neutral-500' : 'text-white'}`}>
                        {chore.title}
                      </div>
                      {!isKid && <div className="text-xs text-neutral-500 mt-1 uppercase">ASSIGNED: {assignedKid?.username}</div>}
                    </div>
                    
                    {!chore.isDone && (
                      <HardwareButton 
                        color={kidColor} 
                        textColor="#000" 
                        className="py-2 px-6"
                        onClick={() => markDone.mutate(chore.id)}
                        disabled={markDone.isPending}
                      >
                        DONE
                      </HardwareButton>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {!isKid && (
            <div className="bg-[#222] p-6 border-2 border-[#111] shadow-[8px_8px_0px_#000] sticky top-8">
              <h3 className="font-display text-white mb-4 uppercase border-b-2 border-[#111] pb-2">INPUT_NEW_TASK</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <input 
                  className="w-full bg-[#111] border-2 border-[#000] p-3 text-white font-display" 
                  placeholder="Task Designation" 
                  value={newChoreTitle}
                  onChange={e => setNewChoreTitle(e.target.value)}
                  required
                />
                <select 
                  className="w-full bg-[#111] border-2 border-[#000] p-3 text-white font-display focus:outline-none"
                  value={selectedKid}
                  onChange={e => setSelectedKid(e.target.value)}
                  required
                >
                  <option value="" disabled>SELECT_TARGET</option>
                  {members?.map(m => (
                    <option key={m.id} value={m.id}>{m.username}</option>
                  ))}
                </select>
                <HardwareButton type="submit" className="w-full py-4" color="#FFD600" textColor="#000" disabled={createChore.isPending}>
                  TRANSMIT
                </HardwareButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
