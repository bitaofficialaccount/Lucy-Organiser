import { useState } from "react";
import { useLocation } from "wouter";
import { HardwareButton, OLEDDisplay, TapeLabel, PageTransition } from "@/components/ui/hardware";
import { useAuth, useLogin, useRegisterParent } from "@/hooks/use-auth";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useAuth();
  const loginMutation = useLogin();
  const registerMutation = useRegisterParent();
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <OLEDDisplay className="max-w-md w-full text-center py-12">
          SYSTEM_BOOTING...<br/>
          <span className="animate-pulse">_</span>
        </OLEDDisplay>
      </div>
    );
  }

  if (user) {
    setLocation("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate({ username, password });
    } else {
      registerMutation.mutate({ username, password });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        
        <div className="w-full max-w-md">
          <div className="mb-8 text-center relative">
            <TapeLabel className="text-xl rotate-[-3deg] absolute -top-4 -left-4 z-10 shadow-lg">System Power</TapeLabel>
            <OLEDDisplay className="py-8">
              <div className="text-2xl font-bold text-center tracking-widest mb-2">LUCY_OS v1.0</div>
              <div className="text-center text-xs opacity-70">AWAITING_INPUT</div>
            </OLEDDisplay>
          </div>

          <form onSubmit={handleSubmit} className="bg-[#222] border-4 border-[#111] p-6 rounded-none shadow-[16px_16px_0px_rgba(0,0,0,1)]">
            <div className="flex mb-8 gap-4 border-b-2 border-[#111] pb-4">
              <button
                type="button"
                className={`font-display uppercase tracking-widest text-sm flex-1 py-2 ${isLogin ? 'text-primary' : 'text-neutral-500 hover:text-white'}`}
                onClick={() => setIsLogin(true)}
              >
                {'>'} Login
              </button>
              <button
                type="button"
                className={`font-display uppercase tracking-widest text-sm flex-1 py-2 ${!isLogin ? 'text-primary' : 'text-neutral-500 hover:text-white'}`}
                onClick={() => setIsLogin(false)}
              >
                {'>'} System Setup
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-display uppercase tracking-wider text-neutral-400 mb-2">Username_</label>
                <input 
                  className="w-full bg-[#111] border-2 border-[#000] p-4 text-white font-display focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-display uppercase tracking-wider text-neutral-400 mb-2">Password_</label>
                <input 
                  type="password"
                  className="w-full bg-[#111] border-2 border-[#000] p-4 text-white font-display focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {(loginMutation.error || registerMutation.error) && (
                <div className="bg-destructive/20 border border-destructive text-destructive p-3 font-display text-sm">
                  ERR: {(loginMutation.error || registerMutation.error)?.message}
                </div>
              )}

              <HardwareButton 
                type="submit" 
                className="w-full py-5 text-xl mt-4" 
                color="#FF4F00" 
                textColor="#FFF"
                disabled={loginMutation.isPending || registerMutation.isPending}
              >
                {isLogin ? "ENGAGE" : "INITIALIZE"}
              </HardwareButton>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
