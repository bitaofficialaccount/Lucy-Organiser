import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { useChores, useAllowanceRequests } from "@/hooks/use-tasks";
import { LogOut, Home, CheckSquare, Wallet, Calendar, MessageCircle } from "lucide-react";
import { api } from "@shared/routes";

export function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuthContext();
  const { data: chores } = useChores();
  const { data: requests } = useAllowanceRequests();

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

  // Badge counts
  const undoneChores = isKid
    ? chores?.filter((c) => c.kidId === user.id && !c.isDone).length || 0
    : chores?.filter((c) => !c.isDone).length || 0;

  const pendingRequests = isKid
    ? requests?.filter((r) => r.kidId === user.id && r.status === "pending").length || 0
    : requests?.filter((r) => r.status === "pending").length || 0;

  const navItems = [
    { path: "/", icon: Home, label: "Home", badge: 0 },
    { path: "/chores", icon: CheckSquare, label: "Chores", badge: undoneChores },
    { path: "/ledger", icon: Wallet, label: "Money", badge: pendingRequests },
    { path: "/calendar", icon: Calendar, label: "Calendar", badge: 0 },
    { path: "/comms", icon: MessageCircle, label: "Messages", badge: 0 },
  ];

  return (
    <>
      {/* DESKTOP TOP BAR */}
      <div className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
              style={{ backgroundColor: isKid ? user.color || "#3B82F6" : "#3B82F6" }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight" data-testid="text-username">
                {user.username}
              </p>
              <p className="text-xs text-gray-500">{isKid ? "Child" : "Parent"}</p>
            </div>
            {isKid && (
              <div className="ml-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold" data-testid="badge-balance">
                💰 ${(user.balance / 100).toFixed(2)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={handleLogout}
              className="ml-2 p-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Sign Out"
              data-testid="button-logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE TOP BAR (just identity + logout) */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
              style={{ backgroundColor: isKid ? user.color || "#3B82F6" : "#3B82F6" }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight text-sm">{user.username}</p>
              <p className="text-xs text-gray-500">{isKid ? "Child" : "Parent"}</p>
            </div>
            {isKid && (
              <div className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                ${(user.balance / 100).toFixed(2)}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            data-testid="button-logout-mobile"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 px-1 transition-colors ${
                  isActive ? "text-blue-600" : "text-gray-500 active:text-gray-900"
                }`}
                data-testid={`nav-mobile-${item.label.toLowerCase()}`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>
                {item.badge > 0 && (
                  <span className="absolute top-1 right-[18%] bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
