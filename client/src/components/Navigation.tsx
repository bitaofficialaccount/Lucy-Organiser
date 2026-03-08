import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { LogOut, Home, CheckSquare, Wallet, Calendar, MessageCircle } from "lucide-react";
import { api } from "@shared/routes";

export function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuthContext();

  if (!user) return null;

  const isKid = user.role === "kid";

  const handleLogout = async () => {
    try {
      await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      });
      logout();
      setLocation("/auth");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/chores", icon: CheckSquare, label: "Chores" },
    { path: "/ledger", icon: Wallet, label: "Allowance" },
    { path: "/calendar", icon: Calendar, label: "Calendar" },
    { path: "/comms", icon: MessageCircle, label: "Messages" },
  ];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">👨‍👩‍👧‍👦</div>
          <div>
            <p className="font-bold text-gray-900">{user.username}</p>
            <p className="text-xs text-gray-600">{isKid ? "Child" : "Parent"}</p>
          </div>
          {isKid && (
            <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              💰 ${(user.balance / 100).toFixed(2)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`p-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title={item.label}
              >
                <Icon size={20} />
              </button>
            );
          })}

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
