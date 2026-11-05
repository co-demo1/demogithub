"use client";
import { Button } from "@/components/ui/button";
import { bookingsOn, daySlots, formatHour, monthGrid } from "@/lib/calendar";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarView({ todos, onClose }) {
  const [selected, setSelected] = useState(() => new Date());
  const [month, setMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1)
  );

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shiftMonth = (by) =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + by, 1));

  const isSelected = (day) => day.toDateString() === selected.toDateString();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Calendar"
        className="w-full max-w-2xl max-h-full overflow-y-auto rounded-xl border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Calendar</h2>
          <Button variant="ghost" size="icon" aria-label="Close calendar" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium">
                {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </span>
              <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => shiftMonth(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthGrid(month).flat().map((day, i) =>
                day ? (
                  <button
                    key={i}
                    type="button"
                    aria-label={day.toDateString()}
                    aria-pressed={isSelected(day)}
                    onClick={() => setSelected(day)}
                    className={`relative h-9 rounded-md text-sm hover:bg-accent ${
                      isSelected(day) ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                    }`}
                  >
                    {day.getDate()}
                    {bookingsOn(todos, day).length > 0 && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-current" />
                    )}
                  </button>
                ) : (
                  <span key={i} />
                )
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">
              {selected.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            <ul className="divide-y rounded-md border">
              {daySlots(todos, selected).map(({ hour, todo }) => (
                <li key={hour} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="w-28 shrink-0 tabular-nums text-muted-foreground">
                    {formatHour(hour)}
                  </span>
                  {todo ? (
                    <span className={`flex-1 break-words font-medium ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                      {todo.title}
                    </span>
                  ) : (
                    <span className="flex-1 text-green-700 dark:text-green-400">Available</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
