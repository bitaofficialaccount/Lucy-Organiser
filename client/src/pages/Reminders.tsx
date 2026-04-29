import { useState } from "react";
import { Button, Card, Input, Modal, PageTransition } from "@/components/ui/modern";
import {
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
} from "@/hooks/use-tasks-reminders";
import { Bell, BellOff, Plus, Trash2, Volume2, Repeat } from "lucide-react";

function playPreview(kind: "bell" | "chime" | "beep") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = kind === "beep" ? "square" : "sine";
      const t0 = ctx.currentTime + start;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.25, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.start(t0);
      osc.stop(t0 + duration);
    };
    if (kind === "bell") { playNote(880, 0, 0.4); playNote(660, 0.15, 0.4); }
    else if (kind === "chime") { playNote(523, 0, 0.3); playNote(784, 0.2, 0.4); }
    else { playNote(1000, 0, 0.12); playNote(1000, 0.2, 0.12); }
  } catch {}
}

const SOUNDS: Array<{ value: "bell" | "chime" | "beep"; label: string }> = [
  { value: "bell", label: "🔔 Bell" },
  { value: "chime", label: "🎐 Chime" },
  { value: "beep", label: "📢 Beep" },
];

const REPEATS: Array<{ value: "none" | "daily" | "weekly"; label: string }> = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export default function Reminders() {
  const { data: reminders, isLoading } = useReminders();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly">("daily");
  const [sound, setSound] = useState<"bell" | "chime" | "beep">("bell");

  const handleSave = () => {
    if (!title.trim()) return;
    createReminder.mutate(
      { title: title.trim(), time, recurring, sound },
      {
        onSuccess: () => {
          setTitle("");
          setTime("09:00");
          setRecurring("daily");
          setSound("bell");
          setShowModal(false);
        },
      }
    );
  };

  const sorted = [...(reminders || [])].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="text-purple-600" size={28} />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Reminders</h1>
            </div>
            <p className="text-gray-600">Get notified at the right time, with a sound</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            data-testid="button-new-reminder"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>

        {/* Browser permission notice */}
        {"Notification" in window && Notification.permission === "denied" && (
          <Card className="mb-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠️ Browser notifications are blocked. Reminders will still trigger inside the app.
            </p>
          </Card>
        )}

        {isLoading && (
          <Card className="text-center py-8 text-gray-500">Loading...</Card>
        )}

        {!isLoading && reminders && reminders.length === 0 && (
          <Card className="text-center py-12 border-2 border-dashed">
            <Bell className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-600 font-semibold">No reminders yet</p>
            <p className="text-gray-500 text-sm mt-1">Tap "New" to create one</p>
          </Card>
        )}

        <div className="space-y-3">
          {sorted.map((r) => (
            <Card
              key={r.id}
              className={`!p-4 ${r.enabled ? "" : "opacity-60"}`}
              data-testid={`card-reminder-${r.id}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    updateReminder.mutate({ id: r.id, enabled: !r.enabled })
                  }
                  className={`p-2 rounded-xl transition-colors ${
                    r.enabled
                      ? "bg-purple-100 text-purple-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                  data-testid={`button-toggle-reminder-${r.id}`}
                >
                  {r.enabled ? <Bell size={20} /> : <BellOff size={20} />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate" data-testid={`text-reminder-title-${r.id}`}>
                    {r.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1 font-mono font-bold text-base text-gray-800">
                      {r.time}
                    </span>
                    {r.recurring !== "none" && (
                      <span className="flex items-center gap-1">
                        <Repeat size={11} /> {r.recurring}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Volume2 size={11} /> {r.sound}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteReminder.mutate(r.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  data-testid={`button-delete-reminder-${r.id}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* New Reminder Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Reminder">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">What's the reminder?</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Take medicine"
                data-testid="input-reminder-title"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                data-testid="input-reminder-time"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Repeat</label>
              <div className="grid grid-cols-3 gap-2">
                {REPEATS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRecurring(r.value)}
                    className={`py-2.5 px-3 rounded-xl font-semibold text-sm transition-colors ${
                      recurring === r.value
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    data-testid={`button-recurring-${r.value}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Sound</label>
              <div className="grid grid-cols-3 gap-2">
                {SOUNDS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      setSound(s.value);
                      playPreview(s.value);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-semibold text-sm transition-colors ${
                      sound === s.value
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    data-testid={`button-sound-${s.value}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Tap to preview the sound</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSave}
                disabled={!title.trim() || createReminder.isPending}
                data-testid="button-save-reminder"
              >
                {createReminder.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
