const test = require("node:test");
const assert = require("node:assert");
const { parseDueDate } = require("./dueDate");

// 2026-11-05 10:00 UTC: it is still 2026-11-04 in UTC-12.
const now = new Date("2026-11-05T10:00:00Z");

test("no due date is allowed", () => {
  for (const input of [undefined, null, ""]) {
    assert.deepStrictEqual(parseDueDate(input, now), { value: null });
  }
});

test("today and future dates are stored as UTC midnight", () => {
  assert.deepStrictEqual(parseDueDate("2026-11-05", now), {
    value: new Date("2026-11-05T00:00:00Z"),
  });
  assert.ok(parseDueDate("2027-01-01", now).value);
});

test("a date still today in the earliest timezone is allowed", () => {
  assert.ok(parseDueDate("2026-11-04", now).value);
});

test("a previous date is refused", () => {
  assert.deepStrictEqual(parseDueDate("2026-11-03", now), {
    error: "Due date cannot be in the past",
  });
  assert.ok(parseDueDate("2020-01-01", now).error);
});

test("malformed or impossible dates are refused", () => {
  for (const input of [
    "2026-02-30",
    "2026-13-01",
    "05/11/2026",
    "2026-11-05T00:00",
    20261105,
    true,
  ]) {
    assert.ok(parseDueDate(input, now).error, String(input));
  }
});
