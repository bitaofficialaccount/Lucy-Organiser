import { useState } from "react";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay } from "date-fns";
import { useAppointments, useCreateAppointment } from "@/hooks/use-tasks";
import { Button, Card, Input, PageTransition, Modal } from "@/components/ui/modern";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon } from "lucide-react";

export default function Calendar() {
  const { data: appointments } = useAppointments();
  const createAppointment = useCreateAppointment();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [error, setError] = useState("");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const cloneDayStr = format(cloneDay, "yyyy-MM-dd");
      // dates are stored as YYYY-MM-DD strings, no timezone issues
      const dayAppointments = appointments?.filter((app) => app.date === cloneDayStr);
      const isToday = isSameDay(day, new Date());
      const inMonth = isSameMonth(day, monthStart);

      days.push(
        <button
          key={day.toString()}
          onClick={() => {
            setNewDate(cloneDayStr);
            setShowForm(true);
            setError("");
          }}
          className={`min-h-[70px] md:min-h-[85px] p-1.5 md:p-2 text-left transition-colors hover:bg-blue-50 ${
            !inMonth ? "bg-gray-50 text-gray-400" : "bg-white"
          } ${isToday ? "ring-2 ring-blue-500 ring-inset" : ""}`}
          data-testid={`day-${cloneDayStr}`}
        >
          <span
            className={`text-xs md:text-sm font-bold ${
              isToday ? "text-blue-600" : inMonth ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {format(day, "d")}
          </span>
          <div className="mt-1 space-y-0.5 md:space-y-1">
            {dayAppointments?.slice(0, 2).map((app) => (
              <div
                key={app.id}
                className="text-[10px] md:text-xs bg-blue-100 text-blue-700 rounded-md md:rounded-lg px-1 md:px-2 py-0.5 md:py-1 truncate font-semibold"
                data-testid={`event-${app.id}`}
              >
                {app.title}
              </div>
            ))}
            {dayAppointments && dayAppointments.length > 2 && (
              <div className="text-[10px] md:text-xs text-gray-500 font-semibold">+{dayAppointments.length - 2} more</div>
            )}
          </div>
        </button>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 border-b border-gray-100 last:border-b-0" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newTitle.trim() || !newDate) return;
    createAppointment.mutate(
      { title: newTitle.trim(), date: newDate },
      {
        onSuccess: () => {
          setNewTitle("");
          setShowForm(false);
        },
        onError: (err: any) => {
          setError(err?.message || "Could not save event");
        },
      }
    );
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalIcon className="text-blue-600" size={28} />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Calendar</h1>
            </div>
            <p className="text-gray-600 text-sm">Family events — tap a day to add</p>
          </div>
          <Button variant="primary" onClick={() => { setShowForm(true); setError(""); }} data-testid="button-add-event">
            <Plus size={18} />
            <span className="hidden sm:inline">Add Event</span>
          </Button>
        </div>

        <Card className="overflow-hidden !p-0">
          <div className="flex justify-between items-center p-4 bg-white border-b border-gray-100">
            <button
              onClick={() => setCurrentDate(addDays(currentDate, -30))}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              data-testid="button-prev-month"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 30))}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              data-testid="button-next-month"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="p-2 text-center text-[10px] md:text-xs font-bold text-gray-600 uppercase">
                {d}
              </div>
            ))}
          </div>
          {rows}
        </Card>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Event">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                data-testid="input-date"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What's happening?
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Birthday party"
                required
                autoFocus
                data-testid="input-event-title"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={!newTitle.trim() || createAppointment.isPending}
                data-testid="button-submit-event"
              >
                {createAppointment.isPending ? "Saving..." : "Add Event"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}
