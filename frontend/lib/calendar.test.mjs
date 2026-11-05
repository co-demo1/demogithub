import test from "node:test";
import assert from "node:assert";
import { bookingsOn, daySlots, formatHour, monthGrid } from "./calendar.js";

test("monthGrid starts on Monday and pads with null", () => {
  // November 2026 starts on a Sunday and has 30 days
  const weeks = monthGrid(new Date(2026, 10, 1));
  assert.ok(weeks.every((w) => w.length === 7));
  assert.deepStrictEqual(weeks[0].slice(0, 6), Array(6).fill(null));
  assert.strictEqual(weeks[0][6].getDate(), 1);
  assert.strictEqual(weeks.flat().filter(Boolean).length, 30);
});

test("daySlots lists working hours, marks booked ones, and adds out-of-hours bookings", () => {
  const day = new Date(2026, 10, 5);
  const todos = [
    { id: 1, title: "Dentist", scheduledAt: new Date(2026, 10, 5, 10).toISOString() },
    { id: 2, title: "Late call", scheduledAt: new Date(2026, 10, 5, 20).toISOString() },
    { id: 3, title: "Other day", scheduledAt: new Date(2026, 10, 6, 10).toISOString() },
    { id: 4, title: "Unscheduled", scheduledAt: null },
  ];
  const slots = daySlots(todos, day);
  assert.deepStrictEqual(slots.map((s) => s.hour), [9, 10, 11, 12, 13, 14, 15, 16, 20]);
  assert.strictEqual(slots.find((s) => s.hour === 10).todo.title, "Dentist");
  assert.strictEqual(slots.find((s) => s.hour === 20).todo.title, "Late call");
  assert.strictEqual(slots.filter((s) => s.todo === null).length, 7);
  assert.deepStrictEqual(bookingsOn(todos, day).map((t) => t.id), [1, 2]);
});

test("formatHour", () => {
  assert.strictEqual(formatHour(9), "09:00 – 10:00");
  assert.strictEqual(formatHour(23), "23:00 – 00:00");
});
