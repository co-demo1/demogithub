"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteData, fetchData, postData } from "@/lib/fetchData";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Bookable hourly slots: 09:00 to 16:00 starts (last slot ends at 17:00)
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

const startOfWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const slotStart = (day, hour) => {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
};

export default function Calendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loadAppointments = useCallback(async () => {
    const from = weekStart.toISOString();
    const to = addDays(weekStart, 7).toISOString();
    const data = await fetchData(`appointments?from=${from}&to=${to}`);
    if (data) setAppointments(data);
  }, [weekStart]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const findAppointment = (slot) =>
    appointments.find((a) => new Date(a.start).getTime() === slot.getTime());

  const changeWeek = (offset) => {
    setSelected(null);
    setWeekStart((w) => addDays(w, offset * 7));
  };

  const book = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title for the appointment.");
      return;
    }
    const created = await postData("appointments", {
      title: title.trim(),
      start: selected.toISOString(),
    });
    if (!created) {
      setError("Could not book this slot. It may already be taken.");
      await loadAppointments();
      return;
    }
    setSelected(null);
    setTitle("");
    setError("");
    await loadAppointments();
  };

  const cancel = async (appointment) => {
    await deleteData(`appointments/${appointment.id}`);
    await loadAppointments();
  };

  const now = new Date();

  return (
    <div className="mt-6 border rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => changeWeek(-1)}>
          <ChevronLeft />
        </Button>
        <h2 className="text-lg font-semibold">
          {days[0].toLocaleDateString()} – {days[6].toLocaleDateString()}
        </h2>
        <Button variant="outline" size="icon" aria-label="Next week" onClick={() => changeWeek(1)}>
          <ChevronRight />
        </Button>
      </div>

      {selected && (
        <form onSubmit={book} className="flex gap-2 mb-4 items-center">
          <span className="text-sm whitespace-nowrap">
            {selected.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
          <Input
            placeholder="Appointment title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit">Book</Button>
          <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
            Cancel
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="p-1"></th>
              {days.map((day) => (
                <th key={day.toISOString()} className="p-1 font-medium">
                  {day.toLocaleDateString([], { weekday: "short", day: "numeric" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="p-1 text-right whitespace-nowrap">{`${hour}:00`}</td>
                {days.map((day) => {
                  const slot = slotStart(day, hour);
                  const appointment = findAppointment(slot);
                  if (appointment) {
                    return (
                      <td key={day.toISOString()} className="p-1">
                        <div className="rounded bg-primary text-primary-foreground p-1 flex justify-between gap-1">
                          <span className="truncate" title={appointment.title}>
                            {appointment.title}
                          </span>
                          <button aria-label={`Cancel ${appointment.title}`} onClick={() => cancel(appointment)}>
                            ×
                          </button>
                        </div>
                      </td>
                    );
                  }
                  const past = slot < now;
                  return (
                    <td key={day.toISOString()} className="p-1">
                      <button
                        disabled={past}
                        onClick={() => {
                          setSelected(slot);
                          setError("");
                        }}
                        className="w-full rounded border border-dashed p-1 text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        {past ? "—" : "Available"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
