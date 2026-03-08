import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { useFamilyMembers } from "@/hooks/use-family";
import { Button, Card, PageTransition, Header } from "@/components/ui/modern";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();
  const { data: members, isLoading } = useFamilyMembers();

  if (!user) return null;
  const isKid = user.role === "kid";

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {isKid ? (
          // KID VIEW
          <div className="space-y-6">
            <Header title={`Welcome, ${user.username}! 👋`} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
                <h3 className="text-gray-600 text-sm font-semibold mb-2">Your Allowance</h3>
                <p className="text-4xl font-bold text-blue-600">${(user.balance / 100).toFixed(2)}</p>
              </Card>

              <div className="flex gap-4">
                <Button variant="primary" className="flex-1" onClick={() => setLocation("/ledger")}>
                  💰 Request More
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setLocation("/calendar")}>
                  📅 Calendar
                </Button>
              </div>
            </div>

            <Card>
              <h3 className="font-bold text-lg text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/chores")}>
                  ✅ Chores
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/comms")}>
                  💬 Messages
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          // PARENT VIEW
          <div className="space-y-6">
            <Header title="Your Family 👨‍👩‍👧‍👦" />

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin text-4xl mb-2">🔄</div>
                <p className="text-gray-600">Loading kids...</p>
              </div>
            ) : members && members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((kid) => (
                  <Card
                    key={kid.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow border-2`}
                    style={{ borderColor: kid.color || "#0066FF" }}
                    onClick={() => setLocation(`/kid/${kid.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-12 h-12 rounded-full"
                        style={{ backgroundColor: kid.color || "#0066FF" }}
                      />
                      <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        ${(kid.balance / 100).toFixed(2)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{kid.username}</h3>
                    <p className="text-sm text-gray-600">Allowance • Calendar • Chores</p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-8">
                <p className="text-gray-600 mb-4">No kids added yet. Complete your setup to add kids!</p>
              </Card>
            )}

            <Card>
              <h3 className="font-bold text-lg text-gray-900 mb-4">Parent Tools</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/chores")}>
                  ✅ Manage Chores
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/ledger")}>
                  💰 Manage Allowance
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/calendar")}>
                  📅 Family Calendar
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setLocation("/comms")}>
                  💬 Messages
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
