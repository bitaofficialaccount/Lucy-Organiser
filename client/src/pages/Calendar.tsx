import { useState } from "react";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay } from "date-fns";
import { useAppointments, useCreateAppointment } from "@/hooks/use-tasks";
import { Button, Card, Input, PageTransition, Header, Modal } from "@/components/ui/modern";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export default function Calendar() {
  const { data: appointments } = useAppointments();
  const createAppointment = useCreateAppointment();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));

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
      const dayAppointments = appointments?.filter((app) =>
        isSameDay(new Date(app.date), cloneDay)
      );
      const isToday = isSameDay(day, new Date());
      const inMonth = isSameMonth(day, monthStart);

      days.push(
        <button
          key={day.toString()}
          onClick={() => {
            setNewDate(format(cloneDay, "yyyy-MM-dd"));
            setShowForm(true);
          }}
          className={`min-h-[85px] p-2 text-left transition-colors hover:bg-gray-50 ${
            !inMonth ? "bg-gray-50 text-gray-400" : "bg-white"
          } ${isToday ? "ring-2 ring-blue-500 ring-inset" : ""}`}
          data-testid={`day-${format(day, "yyyy-MM-dd")}`}
        >
          <span
            className={`text-sm font-bold ${
              isToday ? "text-blue-600" : inMonth ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {format(day, "d")}
          </span>
          <div className="mt-1 space-y-1">
            {dayAppointments?.slice(0, 2).map((app) => (
              <div
                key={app.id}
                className="text-xs bg-blue-100 text-blue-700 rounded-lg px-2 py-1 truncate"
              >
                {app.title}
              </div>
            ))}
            {dayAppointments && dayAppointments.length > 2 && (
              <div className="text-xs text-gray-500">+{dayAppointments.length - 2} more</div>
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
    createAppointment.mutate(
      { title: newTitle, date: newDate },
      {
        onSuccess: () => {
          setNewTitle("");
          setShowForm(false);
        },
      }
    );
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <Header title="Calendar 📅" />
          <Button variant="primary" onClick={() => setShowForm(true)} data-testid="button-add-event">
            <Plus size={18} /> Add Event
          </Button>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex justify-between items-center p-4 bg-white border-b border-gray-100">
            <button
              onClick={() => setCurrentDate(addDays(currentDate, -30))}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              data-testid="button-prev-month"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900">
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
              <div key={d} className="p-2 text-center text-xs font-bold text-gray-600 uppercase">
                {d}
              </div>
            ))}
          </div>
          {rows}
        </Card>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Add Event</h3>
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
                Add Event
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}
