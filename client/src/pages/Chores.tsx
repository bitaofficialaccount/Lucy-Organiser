import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useChores, useCreateChore, useMarkChoreDone } from "@/hooks/use-tasks";
import { useFamilyMembers } from "@/hooks/use-family";
import { Button, Card, Input, PageTransition, Header, Modal } from "@/components/ui/modern";
import { Plus, CheckCircle2, Circle } from "lucide-react";

export default function Chores() {
  const { user } = useAuthContext();
  const { data: chores, isLoading } = useChores();
  const { data: members } = useFamilyMembers();
  const createChore = useCreateChore();
  const markDone = useMarkChoreDone();

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedKid, setSelectedKid] = useState<number | "">("");

  if (!user) return null;
  const isKid = user.role === "kid";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKid) return;
    createChore.mutate(
      { title: newTitle, kidId: Number(selectedKid) },
      {
        onSuccess: () => {
          setNewTitle("");
          setSelectedKid("");
          setShowAdd(false);
        },
      }
    );
  };

  const filteredChores = isKid
    ? chores?.filter((c) => c.kidId === user.id)
    : chores;

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <Header title="Chores ✅" />
          {!isKid && (
            <Button variant="primary" onClick={() => setShowAdd(true)} data-testid="button-add-chore">
              <Plus size={18} /> Add Chore
            </Button>
          )}
        </div>

        {isLoading ? (
          <Card className="text-center py-12 text-gray-500">Loading...</Card>
        ) : !filteredChores || filteredChores.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">No chores yet!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredChores.map((chore) => {
              const assignedKid = members?.find((m) => m.id === chore.kidId);
              return (
                <Card key={chore.id} className={chore.isDone ? "opacity-60" : ""}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {chore.isDone ? (
                        <CheckCircle2 className="text-green-500 flex-shrink-0" size={28} />
                      ) : (
                        <Circle className="text-gray-300 flex-shrink-0" size={28} />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`font-semibold text-gray-900 truncate ${
                            chore.isDone ? "line-through" : ""
                          }`}
                          data-testid={`text-chore-title-${chore.id}`}
                        >
                          {chore.title}
                        </p>
                        {!isKid && assignedKid && (
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: assignedKid.color || "#9CA3AF" }}
                            />
                            <p className="text-sm text-gray-600">{assignedKid.username}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {!chore.isDone && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => markDone.mutate(chore.id)}
                        disabled={markDone.isPending}
                        data-testid={`button-done-${chore.id}`}
                      >
                        Done
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Add New Chore</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What's the chore?
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Take out trash"
                required
                autoFocus
                data-testid="input-chore-title"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assign to
              </label>
              <select
                value={selectedKid}
                onChange={(e) => setSelectedKid(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="select-kid"
              >
                <option value="">Choose a kid...</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={createChore.isPending || !newTitle.trim() || !selectedKid}
                data-testid="button-submit-chore"
              >
                Add Chore
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}
