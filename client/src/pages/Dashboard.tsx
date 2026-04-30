import { useLocation } from "wouter";
import { format } from "date-fns";
import { useAuthContext } from "@/contexts/AuthContext";
import { useFamilyMembers } from "@/hooks/use-family";
import { useChores, useAllowanceRequests, useAppointments } from "@/hooks/use-tasks";
import { usePersonalTasks, useReminders } from "@/hooks/use-tasks-reminders";
import { Button, Card, PageTransition } from "@/components/ui/modern";
import {
  CheckSquare, Wallet, Calendar, MessageCircle, Clock, Sparkles,
  ListTodo, Bell, Phone, ShieldAlert, User as UserIcon
} from "lucide-react";

// helpers for YYYY-MM-DD comparisons
function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}
function plusDaysStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return format(d, "yyyy-MM-dd");
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();
  const { data: members } = useFamilyMembers();
  const { data: chores } = useChores();
  const { data: requests } = useAllowanceRequests();
  const { data: appointments } = useAppointments();
  const { data: tasks } = usePersonalTasks();
  const { data: reminders } = useReminders();

  if (!user) return null;
  const isKid = user.role === "kid";
  const accentColor = user.color || "#3B82F6";

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const today = todayStr();
  const weekOut = plusDaysStr(7);
  const upcomingEvents = appointments
    ?.filter((a) => a.date >= today && a.date <= weekOut)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const myChores = isKid
    ? chores?.filter((c) => c.kidId === user.id && !c.isDone) || []
    : chores?.filter((c) => !c.isDone) || [];

  const pendingRequests = isKid
    ? requests?.filter((r) => r.kidId === user.id && r.status === "pending") || []
    : requests?.filter((r) => r.status === "pending") || [];

  const openTasks = tasks?.filter((t) => !t.isDone) || [];
  const enabledReminders = reminders?.filter((r) => r.enabled) || [];

  // Find the parent (for kids) to get phone number
  const parent = isKid ? members?.find((m) => m.id === user.parentId) : null;
  const parentPhone = parent?.phone;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
        {/* Greeting Hero with mini logo */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-base md:text-lg">{greeting},</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {user.username}{" "}
              <span className="inline-block animate-bounce">{isKid ? "🌟" : "👋"}</span>
            </h1>
          </div>
          <div className="text-5xl md:text-6xl">🏠</div>
        </div>

        {isKid ? (
          /* ========== KID DASHBOARD ========== */
          <div className="space-y-5">
            {/* Big balance card */}
            <Card
              className="text-white border-0 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)` }}
            >
              <p className="text-white/80 text-sm font-semibold mb-1">Your Allowance</p>
              <p className="text-5xl md:text-6xl font-bold mb-4" data-testid="text-balance">
                ${(user.balance / 100).toFixed(2)}
              </p>
              <Button
                variant="secondary"
                className="!bg-white !text-gray-900 hover:!bg-gray-100"
                onClick={() => setLocation("/ledger")}
                data-testid="button-ask-money"
              >
                💰 Ask for More
              </Button>
            </Card>

            {/* IF LOST card - shows parent's phone */}
            {parentPhone ? (
              <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-500 text-white rounded-2xl p-2 shrink-0">
                    <ShieldAlert size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-orange-900 text-lg leading-tight">If you're lost</p>
                    <p className="text-sm text-orange-800 mt-0.5">
                      Show this screen to a trusted adult and ask them to call:
                    </p>
                    <div className="mt-3 bg-white border-2 border-orange-200 rounded-2xl p-3 flex items-center gap-3">
                      <Phone className="text-orange-500 shrink-0" size={22} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-semibold uppercase">
                          Parent: {parent?.username}
                        </p>
                        <a
                          href={`tel:${parentPhone}`}
                          className="text-2xl md:text-3xl font-bold text-orange-700 tracking-wide block truncate"
                          data-testid="text-parent-phone"
                        >
                          {parentPhone}
                        </a>
                      </div>
                      <a
                        href={`tel:${parentPhone}`}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-3 shrink-0 transition-colors"
                        data-testid="button-call-parent"
                      >
                        <Phone size={20} />
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                <div className="flex items-center gap-3 text-gray-500">
                  <ShieldAlert size={20} />
                  <p className="text-sm">
                    Ask your parent to add their phone number in their Profile,
                    so it can show here if you're ever lost.
                  </p>
                </div>
              </Card>
            )}

            {/* Quick stats - 4 across */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card onClick={() => setLocation("/chores")} className="text-center !p-4">
                <CheckSquare className="mx-auto mb-1 text-blue-500" size={22} />
                <p className="text-2xl font-bold text-gray-900">{myChores.length}</p>
                <p className="text-[11px] text-gray-600 font-semibold">Chores</p>
              </Card>
              <Card onClick={() => setLocation("/tasks")} className="text-center !p-4">
                <ListTodo className="mx-auto mb-1 text-green-500" size={22} />
                <p className="text-2xl font-bold text-gray-900">{openTasks.length}</p>
                <p className="text-[11px] text-gray-600 font-semibold">My Tasks</p>
              </Card>
              <Card onClick={() => setLocation("/reminders")} className="text-center !p-4">
                <Bell className="mx-auto mb-1 text-purple-500" size={22} />
                <p className="text-2xl font-bold text-gray-900">{enabledReminders.length}</p>
                <p className="text-[11px] text-gray-600 font-semibold">Reminders</p>
              </Card>
              <Card onClick={() => setLocation("/calendar")} className="text-center !p-4">
                <Calendar className="mx-auto mb-1 text-pink-500" size={22} />
                <p className="text-2xl font-bold text-gray-900">{upcomingEvents?.length || 0}</p>
                <p className="text-[11px] text-gray-600 font-semibold">Events</p>
              </Card>
            </div>

            {/* My chores */}
            {myChores.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckSquare size={20} /> Things to do
                </h2>
                <div className="space-y-2">
                  {myChores.slice(0, 3).map((chore) => (
                    <Card key={chore.id} className="!p-4">
                      <p className="font-semibold text-gray-900" data-testid={`text-dash-chore-${chore.id}`}>
                        {chore.title}
                      </p>
                    </Card>
                  ))}
                  {myChores.length > 3 && (
                    <button
                      onClick={() => setLocation("/chores")}
                      className="text-sm text-blue-600 font-semibold hover:underline"
                    >
                      See all {myChores.length} chores →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Upcoming events */}
            {upcomingEvents && upcomingEvents.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar size={20} /> Coming up
                </h2>
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <Card key={event.id} className="!p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {format(new Date(event.date + "T12:00:00"), "EEE, MMM d")}
                          </p>
                        </div>
                        {event.date === today && (
                          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="w-full !py-4"
                onClick={() => setLocation("/comms")}
                data-testid="button-message-parents"
              >
                <MessageCircle size={18} /> Message
              </Button>
              <Button
                variant="secondary"
                className="w-full !py-4"
                onClick={() => setLocation("/reminders")}
              >
                <Bell size={18} /> Reminders
              </Button>
            </div>
          </div>
        ) : (
          /* ========== PARENT DASHBOARD ========== */
          <div className="space-y-5">
            {/* Quick stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="text-center !p-4">
                <p className="text-3xl font-bold text-blue-600">{(members?.filter(m => m.role === 'kid').length) || 0}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">Kids</p>
              </Card>
              <Card className="text-center !p-4">
                <p className="text-3xl font-bold text-orange-500">{myChores.length}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">Open chores</p>
              </Card>
              <Card className="text-center !p-4">
                <p className="text-3xl font-bold text-red-500">{pendingRequests.length}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">Money requests</p>
              </Card>
              <Card className="text-center !p-4">
                <p className="text-3xl font-bold text-purple-500">{upcomingEvents?.length || 0}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">Events soon</p>
              </Card>
            </div>

            {/* Phone reminder if not set */}
            {!user.phone && (
              <Card
                onClick={() => setLocation("/profile")}
                className="border-2 border-orange-300 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="text-orange-500 shrink-0" size={24} />
                  <div className="flex-1">
                    <p className="font-bold text-orange-900">Add your phone number</p>
                    <p className="text-sm text-orange-800">
                      Your kids' home screen will show it as an "If Lost" emergency number.
                      Tap to add it now →
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Pending allowance requests - URGENT */}
            {pendingRequests.length > 0 && (
              <Card className="border-2 border-orange-200 bg-orange-50">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="text-orange-500" size={20} />
                  <h2 className="font-bold text-gray-900">Needs your attention</h2>
                </div>
                <div className="space-y-2">
                  {pendingRequests.slice(0, 3).map((req) => {
                    const kid = members?.find((m) => m.id === req.kidId);
                    return (
                      <div
                        key={req.id}
                        className="bg-white rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: kid?.color || "#3B82F6" }}
                          >
                            {kid?.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {kid?.username} wants ${(req.amount / 100).toFixed(2)}
                          </span>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => setLocation("/ledger")}>
                          Review
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Family members */}
            {members && members.filter((m) => m.role === "kid").length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Your Kids 👨‍👩‍👧‍👦</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {members.filter((m) => m.role === "kid").map((kid) => {
                    const kidChores = chores?.filter((c) => c.kidId === kid.id && !c.isDone) || [];
                    return (
                      <Card
                        key={kid.id}
                        className="border-2 hover:shadow-md transition-shadow"
                        style={{ borderColor: kid.color || "#3B82F6" }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                            style={{ backgroundColor: kid.color || "#3B82F6" }}
                          >
                            {kid.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{kid.username}</p>
                            <p className="text-sm text-green-600 font-semibold">
                              ${(kid.balance / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 pt-3 border-t border-gray-100">
                          <span>{kidChores.length} open chores</span>
                          <button
                            onClick={() => setLocation("/ledger")}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            Manage →
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* My personal stuff */}
            <div className="grid grid-cols-2 gap-3">
              <Card onClick={() => setLocation("/tasks")} className="text-center !p-4">
                <ListTodo className="mx-auto mb-1 text-green-500" size={22} />
                <p className="text-2xl font-bold text-gray-900">{openTasks.length}</p>
                <p className="text-[11px] text-gray-600 font-semibold">My To-Dos</p>
              </Card>
              <Card onClick={() => setLocation("/reminders")} className="text-center !p-4">
                <Bell className="mx-auto mb-1 text-purple-500" size={22} />
                <p className="text-2xl font-bold text-gray-900">{enabledReminders.length}</p>
                <p className="text-[11px] text-gray-600 font-semibold">Reminders</p>
              </Card>
            </div>

            {/* Upcoming events */}
            {upcomingEvents && upcomingEvents.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock size={20} /> Coming up
                </h2>
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <Card key={event.id} className="!p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {format(new Date(event.date + "T12:00:00"), "EEEE, MMMM d")}
                          </p>
                        </div>
                        {event.date === today && (
                          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Parent tools */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/chores")}>
                  <CheckSquare size={16} /> Chores
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/ledger")}>
                  <Wallet size={16} /> Money
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/calendar")}>
                  <Calendar size={16} /> Calendar
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/profile")}>
                  <UserIcon size={16} /> Profile
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
