import { useState } from "react";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay } from "date-fns";
import { useAppointments, useCreateAppointment } from "@/hooks/use-tasks";
import { HardwareButton, TapeLabel, PageTransition } from "@/components/ui/hardware";

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

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const dayAppointments = appointments?.filter(app => isSameDay(new Date(app.date), cloneDay));
      
      days.push(
        <div 
          key={day.toString()} 
          className={`min-h-[100px] border border-[#222] p-2 relative transition-colors ${
            !isSameMonth(day, monthStart) ? "bg-[#111] opacity-40" : 
            isSameDay(day, new Date()) ? "bg-[#2a2a2a] border-primary" : "bg-[#1a1a1a]"
          }`}
          onClick={() => {
            setNewDate(format(cloneDay, "yyyy-MM-dd"));
            setShowForm(true);
          }}
        >
          <span className="font-display text-neutral-500 font-bold">{formattedDate}</span>
          <div className="mt-2 space-y-1">
            {dayAppointments?.map(app => (
              <TapeLabel key={app.id} className="text-[10px] py-0 px-1 w-full truncate border-none shadow-none transform-none block bg-[#D800FF] text-white">
                {app.title}
              </TapeLabel>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
    days = [];
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAppointment.mutate({ title: newTitle, date: newDate }, {
      onSuccess: () => {
        setNewTitle("");
        setShowForm(false);
      }
    });
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <TapeLabel className="text-2xl" angle={-1}>PLANNER_GRID</TapeLabel>
          <div className="flex gap-2">
            <HardwareButton color="#222" textColor="#FFF" className="py-2 px-4" onClick={() => setCurrentDate(addDays(currentDate, -30))}>{"<<"}</HardwareButton>
            <HardwareButton color="#FFF" textColor="#000" className="py-2 px-6 min-w-[150px] font-display text-center pointer-events-none">{format(currentDate, "MMMM yyyy")}</HardwareButton>
            <HardwareButton color="#222" textColor="#FFF" className="py-2 px-4" onClick={() => setCurrentDate(addDays(currentDate, 30))}>{">>"}</HardwareButton>
          </div>
        </div>

        <div className="bg-[#111] border-4 border-[#333] shadow-[8px_8px_0px_#000]">
          <div className="grid grid-cols-7 bg-[#222] border-b-4 border-[#333]">
            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
              <div key={d} className="p-2 text-center font-display text-xs text-neutral-400">{d}</div>
            ))}
          </div>
          {rows}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleCreate} className="bg-[#222] border-4 border-[#111] shadow-[16px_16px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full">
              <h3 className="font-display text-white mb-6 uppercase">LOG_EVENT</h3>
              <div className="space-y-4">
                <input 
                  type="date"
                  className="w-full bg-[#111] border-2 border-[#000] p-4 text-white font-display uppercase [color-scheme:dark]"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  required
                />
                <input 
                  className="w-full bg-[#111] border-2 border-[#000] p-4 text-white font-display placeholder:text-neutral-600"
                  placeholder="EVENT_DESIGNATION"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />
                <div className="flex gap-4 pt-4 border-t-2 border-[#111]">
                  <HardwareButton type="button" className="flex-1 py-4" color="#333" textColor="#FFF" onClick={() => setShowForm(false)}>
                    CANCEL
                  </HardwareButton>
                  <HardwareButton type="submit" className="flex-1 py-4" color="#00D34D" textColor="#000" disabled={createAppointment.isPending}>
                    STAMP
                  </HardwareButton>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
