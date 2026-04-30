import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { useChores, useAllowanceRequests } from "@/hooks/use-tasks";
import { usePersonalTasks, useReminders } from "@/hooks/use-tasks-reminders";
import {
  LogOut, Home, CheckSquare, Wallet, Calendar, MessageCircle,
  ListTodo, Bell, MoreHorizontal, User as UserIcon, X
} from "lucide-react";
import { api } from "@shared/routes";

export function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuthContext();
  const { data: chores } = useChores();
  const { data: requests } = useAllowanceRequests();
  const { data: tasks } = usePersonalTasks();
  const { data: reminders } = useReminders();
  const [showMore, setShowMore] = useState(false);

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

  const undoneChores = isKid
    ? chores?.filter((c) => c.kidId === user.id && !c.isDone).length || 0
    : chores?.filter((c) => !c.isDone).length || 0;

  const pendingRequests = isKid
    ? requests?.filter((r) => r.kidId === user.id && r.status === "pending").length || 0
    : requests?.filter((r) => r.status === "pending").length || 0;

  const openTasks = tasks?.filter((t) => !t.isDone).length || 0;
  const enabledReminders = reminders?.filter((r) => r.enabled).length || 0;

  // Primary mobile bottom tabs (5)
  const mobileNavItems = [
    { path: "/", icon: Home, label: "Home", badge: 0 },
    { path: "/chores", icon: CheckSquare, label: "Chores", badge: undoneChores },
    { path: "/tasks", icon: ListTodo, label: "Tasks", badge: openTasks },
    { path: "/reminders", icon: Bell, label: "Alerts", badge: enabledReminders },
  ];

  // Items in the "More" sheet on mobile
  const moreItems = [
    { path: "/calendar", icon: Calendar, label: "Calendar", badge: 0 },
    { path: "/ledger", icon: Wallet, label: "Money", badge: pendingRequests },
    { path: "/comms", icon: MessageCircle, label: "Messages", badge: 0 },
    { path: "/profile", icon: UserIcon, label: "Profile", badge: 0 },
  ];

  // Desktop shows everything
  const desktopNavItems = [
    { path: "/", icon: Home, label: "Home", badge: 0 },
    { path: "/chores", icon: CheckSquare, label: "Chores", badge: undoneChores },
    { path: "/tasks", icon: ListTodo, label: "Tasks", badge: openTasks },
    { path: "/reminders", icon: Bell, label: "Reminders", badge: enabledReminders },
    { path: "/calendar", icon: Calendar, label: "Calendar", badge: 0 },
    { path: "/ledger", icon: Wallet, label: "Money", badge: pendingRequests },
    { path: "/comms", icon: MessageCircle, label: "Messages", badge: 0 },
    { path: "/profile", icon: UserIcon, label: "Profile", badge: 0 },
  ];

  const goTo = (path: string) => {
    setLocation(path);
    setShowMore(false);
  };

  return (
    <>
      {/* DESKTOP TOP BAR */}
      <div className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🏠</span>
            <div className="text-left">
              <p className="font-bold text-gray-900 leading-none">
                <span className="text-yellow-500">Lucy</span>
                <span className="text-blue-600"> Organiser</span>
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Open-Source Family Organising</p>
            </div>
          </button>

          <div className="flex items-center gap-1 flex-wrap justify-end">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-colors text-sm ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="ml-2 px-2 py-1 flex items-center gap-2 border-l pl-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                style={{ backgroundColor: isKid ? user.color || "#3B82F6" : "#3B82F6" }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-gray-900 leading-tight">{user.username}</p>
                {isKid && (
                  <p className="text-[10px] text-green-600 font-bold">${(user.balance / 100).toFixed(2)}</p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Sign Out"
                data-testid="button-logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <div className="text-left">
              <p className="font-bold text-sm leading-none">
                <span className="text-yellow-500">Lucy</span>
                <span className="text-blue-600"> Organiser</span>
              </p>
              <p className="text-[9px] text-gray-500 mt-0.5">Open-Source Family Organising</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {isKid && (
              <div className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold" data-testid="badge-balance-mobile">
                ${(user.balance / 100).toFixed(2)}
              </div>
            )}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
              style={{ backgroundColor: isKid ? user.color || "#3B82F6" : "#3B82F6" }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              data-testid="button-logout-mobile"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-5">
          {mobileNavItems.map((item) => {
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
          {/* More button */}
          <button
            onClick={() => setShowMore(true)}
            className={`relative flex flex-col items-center gap-0.5 py-2.5 px-1 transition-colors ${
              moreItems.some(m => m.path === location) ? "text-blue-600" : "text-gray-500 active:text-gray-900"
            }`}
            data-testid="nav-mobile-more"
          >
            <MoreHorizontal size={22} />
            <span className="text-[10px] font-medium">More</span>
            {pendingRequests > 0 && (
              <span className="absolute top-1 right-[18%] bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                {pendingRequests}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MORE SHEET (mobile) */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 animate-in fade-in duration-200"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">More</h3>
              <button
                onClick={() => setShowMore(false)}
                className="p-2 rounded-full hover:bg-gray-100"
                data-testid="button-close-more"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => goTo(item.path)}
                    className="relative flex flex-col items-center justify-center gap-2 p-5 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors"
                    data-testid={`nav-more-${item.label.toLowerCase()}`}
                  >
                    <Icon size={28} className="text-gray-700" />
                    <span className="text-sm font-bold text-gray-900">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-gray-400 mt-5">
              <span className="text-yellow-500 font-bold">Lucy</span>{" "}
              <span className="text-blue-600 font-bold">Organiser</span>
              {" "}— Open-Source Family Organising 🐾
            </p>
          </div>
        </div>
      )}
    </>
  );
}
