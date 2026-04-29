import { useLocation } from "wouter";
import { format, isSameDay, isToday, isFuture, addDays } from "date-fns";
import { useAuthContext } from "@/contexts/AuthContext";
import { useFamilyMembers } from "@/hooks/use-family";
import { useChores, useAllowanceRequests, useAppointments } from "@/hooks/use-tasks";
import { Button, Card, PageTransition } from "@/components/ui/modern";
import { CheckSquare, Wallet, Calendar, MessageCircle, TrendingUp, Clock, Sparkles } from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();
  const { data: members } = useFamilyMembers();
  const { data: chores } = useChores();
  const { data: requests } = useAllowanceRequests();
  const { data: appointments } = useAppointments();

  if (!user) return null;
  const isKid = user.role === "kid";
  const accentColor = user.color || "#3B82F6";

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const upcomingEvents = appointments
    ?.filter((app) => {
      const d = new Date(app.date);
      return isToday(d) || (isFuture(d) && d <= addDays(new Date(), 7));
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const myChores = isKid
    ? chores?.filter((c) => c.kidId === user.id && !c.isDone) || []
    : chores?.filter((c) => !c.isDone) || [];

  const pendingRequests = isKid
    ? requests?.filter((r) => r.kidId === user.id && r.status === "pending") || []
    : requests?.filter((r) => r.status === "pending") || [];

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
        {/* Greeting Hero */}
        <div className="mb-6">
          <p className="text-gray-600 text-base md:text-lg">{greeting},</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {user.username}{" "}
            <span className="inline-block animate-bounce">
              {isKid ? "🌟" : "👋"}
            </span>
          </h1>
        </div>

        {isKid ? (
          /* ========== KID DASHBOARD ========== */
          <div className="space-y-6">
            {/* Big balance card */}
            <Card
              className="text-white border-0 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
              }}
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

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card
                onClick={() => setLocation("/chores")}
                className="text-center"
              >
                <CheckSquare className="mx-auto mb-2 text-blue-500" size={24} />
                <p className="text-3xl font-bold text-gray-900">{myChores.length}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">Chores to do</p>
              </Card>
              <Card
                onClick={() => setLocation("/calendar")}
                className="text-center"
              >
                <Calendar className="mx-auto mb-2 text-purple-500" size={24} />
                <p className="text-3xl font-bold text-gray-900">{upcomingEvents?.length || 0}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">Events this week</p>
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
                            {format(new Date(event.date), "EEE, MMM d")}
                          </p>
                        </div>
                        {isToday(new Date(event.date)) && (
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
                onClick={() => setLocation("/calendar")}
              >
                <Calendar size={18} /> Calendar
              </Button>
            </div>
          </div>
        ) : (
          /* ========== PARENT DASHBOARD ========== */
          <div className="space-y-6">
            {/* Quick stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="text-center !p-4">
                <p className="text-3xl font-bold text-blue-600">{members?.length || 0}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">Kids</p>
              </Card>
              <Card className="text-center !p-4">
                <p className="text-3xl font-bold text-orange-500">{myChores.length}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">Open chores</p>
              </Card>
              <Card className="text-center !p-4">
                <p className="text-3xl font-bold text-red-500">{pendingRequests.length}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">Pending requests</p>
              </Card>
              <Card className="text-center !p-4">
                <p className="text-3xl font-bold text-purple-500">{upcomingEvents?.length || 0}</p>
                <p className="text-xs text-gray-600 font-semibold mt-1">Events soon</p>
              </Card>
            </div>

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
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setLocation("/ledger")}
                        >
                          Review
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Family members */}
            {members && members.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Your Kids 👨‍👩‍👧‍👦</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {members.map((kid) => {
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
                            {format(new Date(event.date), "EEEE, MMMM d")}
                          </p>
                        </div>
                        {isToday(new Date(event.date)) && (
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

            {/* Parent tools - desktop has more space */}
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
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/comms")}>
                  <MessageCircle size={16} /> Messages
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
