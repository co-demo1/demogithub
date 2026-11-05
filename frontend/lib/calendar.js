// Working hours shown in the calendar: one-hour slots starting 09:00 to 16:00.
export const FIRST_HOUR = 9;
export const LAST_HOUR = 17;

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Weeks (Monday first) covering the month of `month`; days outside it are null.
export function monthGrid(month) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const lead = (new Date(year, m, 1).getDay() + 6) % 7;

  const cells = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, m, d));
  while (cells.length % 7) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// Todos booked on `day`, in local time.
export function bookingsOn(todos, day) {
  return todos.filter(
    (t) => t.scheduledAt && sameDay(new Date(t.scheduledAt), day)
  );
}

// The day's slots: every working hour, plus any booked hour outside them.
// Each slot is { hour, todo } where todo is null when the slot is available.
export function daySlots(todos, day) {
  const booked = new Map();
  for (const t of bookingsOn(todos, day)) {
    booked.set(new Date(t.scheduledAt).getHours(), t);
  }

  const hours = new Set(booked.keys());
  for (let h = FIRST_HOUR; h < LAST_HOUR; h++) hours.add(h);

  return [...hours]
    .sort((a, b) => a - b)
    .map((hour) => ({ hour, todo: booked.get(hour) || null }));
}

export const formatHour = (hour) =>
  `${String(hour).padStart(2, "0")}:00 – ${String((hour + 1) % 24).padStart(2, "0")}:00`;
