import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAllowanceRequests, useRequestAllowance, useRespondAllowance } from "@/hooks/use-tasks";
import { useFamilyMembers, useUpdateBalance } from "@/hooks/use-family";
import { Button, Card, PageTransition, Header, Modal } from "@/components/ui/modern";
import { DollarSign, Check, X, Plus, Minus } from "lucide-react";

export default function Ledger() {
  const { user } = useAuthContext();
  const { data: requests } = useAllowanceRequests();
  const { data: members } = useFamilyMembers();

  const requestMutation = useRequestAllowance();
  const respondMutation = useRespondAllowance();
  const updateBalance = useUpdateBalance();

  const [showRequest, setShowRequest] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");
  const [showAdjust, setShowAdjust] = useState<{ kidId: number; current: number } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustMode, setAdjustMode] = useState<"add" | "subtract">("add");

  if (!user) return null;
  const isKid = user.role === "kid";

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(requestAmount) * 100);
    if (amountCents <= 0) return;
    requestMutation.mutate(
      { amount: amountCents },
      {
        onSuccess: () => {
          setRequestAmount("");
          setShowRequest(false);
        },
      }
    );
  };

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjust) return;
    const amountCents = Math.round(parseFloat(adjustAmount) * 100);
    if (amountCents <= 0) return;
    const delta = adjustMode === "add" ? amountCents : -amountCents;
    updateBalance.mutate(
      { id: showAdjust.kidId, amount: showAdjust.current + delta },
      {
        onSuccess: () => {
          setShowAdjust(null);
          setAdjustAmount("");
        },
      }
    );
  };

  const setKeypad = (digit: string, current: string, setter: (v: string) => void) => {
    if (digit === "←") {
      setter(current.slice(0, -1));
    } else if (digit === "." && current.includes(".")) {
      return;
    } else {
      setter(current + digit);
    }
  };

  const Keypad = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="grid grid-cols-3 gap-2">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "←"].map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => setKeypad(d, value, onChange)}
          className="bg-gray-100 hover:bg-gray-200 rounded-2xl py-4 text-xl font-bold text-gray-900 transition-colors"
          data-testid={`keypad-${d}`}
        >
          {d}
        </button>
      ))}
    </div>
  );

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Header title="Allowance 💰" />

        {isKid ? (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 text-center py-8">
              <p className="text-gray-600 text-sm font-semibold mb-2">Your Balance</p>
              <p className="text-5xl font-bold text-green-600" data-testid="text-balance">
                ${(user.balance / 100).toFixed(2)}
              </p>
            </Card>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setShowRequest(true)}
              data-testid="button-request-money"
            >
              💸 Ask for More Money
            </Button>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Your Requests</h3>
              <div className="space-y-2">
                {requests?.filter((r) => r.kidId === user.id).length === 0 && (
                  <Card className="text-center py-6 text-gray-500">No requests yet</Card>
                )}
                {requests?.filter((r) => r.kidId === user.id).map((req) => (
                  <Card key={req.id}>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xl text-gray-900">
                        ${(req.amount / 100).toFixed(2)}
                      </p>
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                          req.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : req.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {req.status === "approved"
                          ? "Approved ✓"
                          : req.status === "rejected"
                          ? "Rejected"
                          : "Pending..."}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Your Kids</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members?.map((kid) => (
                  <Card key={kid.id} className="border-2" style={{ borderColor: kid.color || "#0066FF" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full"
                        style={{ backgroundColor: kid.color || "#0066FF" }}
                      />
                      <p className="font-bold text-lg text-gray-900">{kid.username}</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-3">
                      ${(kid.balance / 100).toFixed(2)}
                    </p>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => setShowAdjust({ kidId: kid.id, current: kid.balance })}
                      data-testid={`button-adjust-${kid.id}`}
                    >
                      Adjust Balance
                    </Button>
                  </Card>
                ))}
              </div>
            </div>

            {requests && requests.filter((r) => r.status === "pending").length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Pending Requests</h3>
                <div className="space-y-2">
                  {requests
                    .filter((r) => r.status === "pending")
                    .map((req) => {
                      const kid = members?.find((m) => m.id === req.kidId);
                      return (
                        <Card key={req.id}>
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {kid?.username} wants
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                ${(req.amount / 100).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  respondMutation.mutate({ id: req.id, status: "approved" })
                                }
                                data-testid={`button-approve-${req.id}`}
                              >
                                <Check size={18} />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  respondMutation.mutate({ id: req.id, status: "rejected" })
                                }
                                data-testid={`button-reject-${req.id}`}
                              >
                                <X size={18} />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Kid Request Modal */}
        <Modal isOpen={showRequest} onClose={() => setShowRequest(false)}>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ask for Money</h3>
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="text-center bg-gray-50 rounded-2xl p-6">
              <p className="text-sm text-gray-600 mb-1">Amount</p>
              <p className="text-4xl font-bold text-gray-900">
                ${requestAmount || "0.00"}
              </p>
            </div>
            <Keypad value={requestAmount} onChange={setRequestAmount} />
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowRequest(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={!requestAmount || parseFloat(requestAmount) <= 0 || requestMutation.isPending}
                data-testid="button-submit-request"
              >
                Send Request
              </Button>
            </div>
          </form>
        </Modal>

        {/* Parent Adjust Modal */}
        <Modal isOpen={!!showAdjust} onClose={() => setShowAdjust(null)}>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Adjust Balance</h3>
          <div className="flex gap-2 mb-4">
            <Button
              variant={adjustMode === "add" ? "primary" : "secondary"}
              className="flex-1"
              onClick={() => setAdjustMode("add")}
            >
              <Plus size={18} /> Add
            </Button>
            <Button
              variant={adjustMode === "subtract" ? "primary" : "secondary"}
              className="flex-1"
              onClick={() => setAdjustMode("subtract")}
            >
              <Minus size={18} /> Subtract
            </Button>
          </div>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="text-center bg-gray-50 rounded-2xl p-6">
              <p className="text-sm text-gray-600 mb-1">
                {adjustMode === "add" ? "Add" : "Subtract"}
              </p>
              <p className="text-4xl font-bold text-gray-900">
                ${adjustAmount || "0.00"}
              </p>
            </div>
            <Keypad value={adjustAmount} onChange={setAdjustAmount} />
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowAdjust(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={!adjustAmount || parseFloat(adjustAmount) <= 0 || updateBalance.isPending}
                data-testid="button-submit-adjust"
              >
                Apply
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}
