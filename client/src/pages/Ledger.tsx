import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAllowanceRequests, useRequestAllowance, useRespondAllowance } from "@/hooks/use-tasks";
import { useFamilyMembers, useUpdateBalance } from "@/hooks/use-family";
import { HardwareButton, OLEDDisplay, TapeLabel, Knob, PageTransition } from "@/components/ui/hardware";

export default function Ledger() {
  const { data: user } = useAuth();
  const { data: requests } = useAllowanceRequests();
  const { data: members } = useFamilyMembers();
  
  const requestMutation = useRequestAllowance();
  const respondMutation = useRespondAllowance();
  const updateBalance = useUpdateBalance();

  const [requestAmount, setRequestAmount] = useState(500); // in cents
  const [knobValues, setKnobValues] = useState<Record<number, number>>({});

  if (!user) return null;
  const isKid = user.role === "kid";
  const accentColor = user.color || "#007AFF";

  const handleRequest = () => {
    requestMutation.mutate({ amount: requestAmount }, {
      onSuccess: () => setRequestAmount(500)
    });
  };

  const handleUpdateBalance = (kidId: number) => {
    const val = knobValues[kidId] || 0;
    if (val === 0) return;
    updateBalance.mutate({ id: kidId, amount: val * 100 }); // convert to cents
    setKnobValues(prev => ({...prev, [kidId]: 0})); // reset knob after transmit
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-12">
        <TapeLabel className="text-xl" angle={-2}>FINANCIAL_LEDGER</TapeLabel>

        {isKid ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <OLEDDisplay className="h-48 justify-center items-center">
                <div className="text-neutral-500 mb-2">CURRENT_BALANCE</div>
                <div className="text-5xl md:text-7xl">${(user.balance / 100).toFixed(2)}</div>
              </OLEDDisplay>
              
              <div className="bg-[#222] p-6 border-4 border-[#111]">
                <h3 className="font-display text-white mb-4">REQUEST_FUNDS</h3>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-mono text-white">${(requestAmount / 100).toFixed(2)}</span>
                  <input 
                    type="range" 
                    min="100" max="5000" step="100"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                </div>
                <HardwareButton 
                  className="w-full mt-8" 
                  color={accentColor} 
                  textColor="#000"
                  onClick={handleRequest}
                  disabled={requestMutation.isPending}
                >
                  TRANSMIT_REQUEST
                </HardwareButton>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border-l-4 border-dashed border-[#444] pl-8">
              <h3 className="font-display text-neutral-400 mb-4">REQUEST_HISTORY</h3>
              <div className="space-y-3">
                {requests?.filter(r => r.kidId === user.id).map(req => (
                  <div key={req.id} className="flex justify-between items-center bg-[#111] p-3">
                    <span className="font-mono text-white">${(req.amount / 100).toFixed(2)}</span>
                    <span className={`text-xs font-display px-2 py-1 ${req.status === 'approved' ? 'bg-green-900 text-green-300' : req.status === 'rejected' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {members?.map(kid => (
                <div key={kid.id} className="bg-[#222] border-t-8 p-6 relative shadow-lg" style={{ borderTopColor: kid.color || '#FFF' }}>
                  <div className="font-display text-xl text-white mb-1 uppercase">{kid.username}</div>
                  <div className="font-mono text-3xl text-neutral-300 mb-8">${(kid.balance / 100).toFixed(2)}</div>
                  
                  <div className="flex items-end justify-between bg-[#111] p-4 rounded-md border border-[#333]">
                    <Knob 
                      value={knobValues[kid.id] || 0} 
                      onChange={(v) => setKnobValues(prev => ({...prev, [kid.id]: v}))}
                      min={-50} max={50} label="ADJUST" 
                    />
                    <HardwareButton 
                      className="py-2 px-4 h-12"
                      color="#FF4F00" textColor="#FFF"
                      onClick={() => handleUpdateBalance(kid.id)}
                      disabled={updateBalance.isPending || (knobValues[kid.id] || 0) === 0}
                    >
                      SET
                    </HardwareButton>
                  </div>
                </div>
              ))}
            </div>

            {requests && requests.filter(r => r.status === 'pending').length > 0 && (
              <div className="bg-[#111] border-4 border-yellow-500 p-6">
                <TapeLabel className="bg-yellow-500 text-black mb-6">PENDING_REQUESTS</TapeLabel>
                <div className="space-y-4">
                  {requests.filter(r => r.status === 'pending').map(req => {
                    const kid = members?.find(m => m.id === req.kidId);
                    return (
                      <div key={req.id} className="flex flex-col md:flex-row justify-between items-center bg-[#222] p-4 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: kid?.color || '#FFF' }} />
                          <div className="font-display text-white text-lg uppercase">{kid?.username} REQUESTS ${(req.amount / 100).toFixed(2)}</div>
                        </div>
                        <div className="flex gap-2">
                          <HardwareButton color="#00D34D" textColor="#000" className="py-2 px-6" onClick={() => respondMutation.mutate({ id: req.id, status: 'approved' })}>APPROVE</HardwareButton>
                          <HardwareButton color="#FF0000" textColor="#FFF" className="py-2 px-6" onClick={() => respondMutation.mutate({ id: req.id, status: 'rejected' })}>REJECT</HardwareButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
