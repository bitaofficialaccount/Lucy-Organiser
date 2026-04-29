import { useEffect, useRef, useState } from "react";
import { useReminders, useUpdateReminder } from "@/hooks/use-tasks-reminders";
import { useAuthContext } from "@/contexts/AuthContext";
import { Bell, X, Clock } from "lucide-react";
import type { Reminder } from "@shared/schema";

// Sound generator using Web Audio API (no external files needed)
function playSound(kind: "bell" | "chime" | "beep") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playNote = (freq: number, start: number, duration: number, volume = 0.3) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = kind === "beep" ? "square" : "sine";
      const t0 = ctx.currentTime + start;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.start(t0);
      osc.stop(t0 + duration);
    };
    if (kind === "bell") {
      playNote(880, 0, 0.6);
      playNote(660, 0.15, 0.5);
      playNote(880, 0.4, 0.6);
    } else if (kind === "chime") {
      playNote(523, 0, 0.4);
      playNote(659, 0.2, 0.4);
      playNote(784, 0.4, 0.6);
    } else {
      playNote(1000, 0, 0.15);
      playNote(1000, 0.25, 0.15);
      playNote(1000, 0.5, 0.15);
    }
  } catch (e) {
    console.warn("Audio play failed:", e);
  }
}

const FIRED_KEY = "lucy_fired_reminders";

function getFiredToday(): Record<number, string> {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    const today = new Date().toDateString();
    // Filter to only today's fires
    const filtered: Record<number, string> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === today) filtered[Number(k)] = v as string;
    }
    return filtered;
  } catch {
    return {};
  }
}

function markFired(id: number) {
  const data = getFiredToday();
  data[id] = new Date().toDateString();
  localStorage.setItem(FIRED_KEY, JSON.stringify(data));
}

export function ReminderNotifier() {
  const { user } = useAuthContext();
  const { data: reminders } = useReminders();
  const updateReminder = useUpdateReminder();
  const [activeAlert, setActiveAlert] = useState<Reminder | null>(null);
  const checkRef = useRef<number | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if (!user) return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);

  // Polling check every 15 seconds
  useEffect(() => {
    if (!user || !reminders) return;

    const check = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const today = now.toDateString();
      const fired = getFiredToday();

      for (const r of reminders) {
        if (!r.enabled) continue;
        if (r.time !== currentTime) continue;
        if (fired[r.id]) continue; // already fired today

        // Trigger
        markFired(r.id);
        playSound(r.sound as "bell" | "chime" | "beep");

        // Browser notification if app is in background
        if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
          new Notification("⏰ Lucy Reminder", {
            body: r.title,
            tag: `lucy-${r.id}`,
          });
        }

        // In-app full-screen alert
        setActiveAlert(r);

        // If non-recurring, disable it after firing
        if (r.recurring === "none") {
          updateReminder.mutate({ id: r.id, enabled: false });
        }
        break; // Only one alert at a time
      }
    };

    check();
    checkRef.current = window.setInterval(check, 15000);
    return () => {
      if (checkRef.current) clearInterval(checkRef.current);
    };
  }, [reminders, user, updateReminder]);

  const dismiss = () => setActiveAlert(null);

  const snooze = (mins: number) => {
    if (!activeAlert) return;
    // Recompute new time = now + mins
    const newDate = new Date(Date.now() + mins * 60_000);
    const newTime = `${String(newDate.getHours()).padStart(2, "0")}:${String(newDate.getMinutes()).padStart(2, "0")}`;
    // Clear from fired list so the new time can fire today
    const fired = getFiredToday();
    delete fired[activeAlert.id];
    localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
    updateReminder.mutate({ id: activeAlert.id, time: newTime, enabled: true });
    setActiveAlert(null);
  };

  if (!activeAlert) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300"
         style={{
           background: "linear-gradient(135deg, rgba(59,130,246,0.97) 0%, rgba(139,92,246,0.97) 100%)",
         }}
         data-testid="modal-reminder-alert">
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
          <Clock size={16} />
          {activeAlert.time}
        </div>
        <span className="text-xs uppercase tracking-wider font-bold opacity-75">
          {activeAlert.recurring !== "none" ? `Repeats ${activeAlert.recurring}` : "Reminder"}
        </span>
      </div>

      {/* Pulsing bell icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
        <div className="relative bg-white rounded-full p-8 shadow-2xl">
          <Bell size={64} className="text-purple-600" strokeWidth={2.5} />
        </div>
      </div>

      <h1 className="text-white text-4xl md:text-6xl font-bold text-center mb-4 px-4 break-words max-w-2xl"
          data-testid="text-reminder-title">
        {activeAlert.title}
      </h1>
      <p className="text-white/80 text-lg mb-12">It's time! ⏰</p>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-8">
        <button
          onClick={() => snooze(5)}
          className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-2xl backdrop-blur-sm transition-colors"
          data-testid="button-snooze-5"
        >
          +5 min
        </button>
        <button
          onClick={() => snooze(10)}
          className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-2xl backdrop-blur-sm transition-colors"
          data-testid="button-snooze-10"
        >
          +10 min
        </button>
        <button
          onClick={() => snooze(30)}
          className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-2xl backdrop-blur-sm transition-colors"
          data-testid="button-snooze-30"
        >
          +30 min
        </button>
      </div>

      {/* Big X dismiss button at bottom */}
      <button
        onClick={dismiss}
        className="bg-white text-gray-900 hover:bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
        data-testid="button-dismiss-reminder"
        aria-label="Dismiss reminder"
      >
        <X size={36} strokeWidth={3} />
      </button>
      <p className="text-white/70 text-xs mt-3 font-semibold">Tap X to dismiss</p>
    </div>
  );
}
