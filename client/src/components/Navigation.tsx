import { useLocation } from "wouter";
import { HardwareButton, OLEDDisplay } from "./ui/hardware";
import { useAuthContext } from "@/contexts/AuthContext";
import { LogOut, Home, CheckSquare, Wallet, Calendar, Radio } from "lucide-react";
import { api } from "@shared/routes";

export function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuthContext();

  if (!user) return null;

  const isKid = user.role === "kid";
  const userColor = user.color || "#FF4F00";

  const handleLogout = async () => {
    try {
      const res = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      });
      if (res.ok) {
        logout();
        setLocation("/auth");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="w-full bg-[#222] border-b-4 border-[#111] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <OLEDDisplay className="min-h-0 py-2 px-4 flex-1 md:flex-none">
          {user.username.toUpperCase()} | {user.role.toUpperCase()}
          {isKid && <div className="text-xs opacity-70">BAL: ${(user.balance / 100).toFixed(2)}</div>}
        </OLEDDisplay>
      </div>

      <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto justify-start md:justify-end">
        <HardwareButton
          onClick={() => setLocation("/")}
          color={location === "/" ? userColor : "#333"}
          textColor="#FFF"
          className="py-2 px-4 flex-1 md:flex-none min-w-[60px]"
        >
          <Home size={18} />
        </HardwareButton>
        <HardwareButton
          onClick={() => setLocation("/chores")}
          color={location === "/chores" ? userColor : "#333"}
          textColor="#FFF"
          className="py-2 px-4 flex-1 md:flex-none min-w-[60px]"
        >
          <CheckSquare size={18} />
        </HardwareButton>
        <HardwareButton
          onClick={() => setLocation("/ledger")}
          color={location === "/ledger" ? userColor : "#333"}
          textColor="#FFF"
          className="py-2 px-4 flex-1 md:flex-none min-w-[60px]"
        >
          <Wallet size={18} />
        </HardwareButton>
        <HardwareButton
          onClick={() => setLocation("/calendar")}
          color={location === "/calendar" ? userColor : "#333"}
          textColor="#FFF"
          className="py-2 px-4 flex-1 md:flex-none min-w-[60px]"
        >
          <Calendar size={18} />
        </HardwareButton>
        <HardwareButton
          onClick={() => setLocation("/comms")}
          color={location === "/comms" ? userColor : "#333"}
          textColor="#FFF"
          className="py-2 px-4 flex-1 md:flex-none min-w-[60px]"
        >
          <Radio size={18} />
        </HardwareButton>
        <HardwareButton
          onClick={handleLogout}
          color="#111"
          textColor="#F00"
          className="py-2 px-4 border-destructive/50 flex-1 md:flex-none min-w-[60px]"
        >
          <LogOut size={18} />
        </HardwareButton>
      </div>
    </div>
  );
}
