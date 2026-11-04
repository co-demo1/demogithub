const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseDueDate, serializeTodo } = require("../utils/dueDate");

test("calendar dates and absent values round trip without a timezone shift", () => {
  for (const value of ["2024-02-29", "2026-01-01", "0001-01-01", "9999-12-31"]) {
    const date = parseDueDate(value);
    assert.equal(date.toISOString(), `${value}T00:00:00.000Z`);
    assert.deepEqual(serializeTodo({ id: 1, dueDate: date }), { id: 1, dueDate: value });
  }
  assert.equal(parseDueDate(null), null);
  assert.equal(parseDueDate(undefined), undefined);
  assert.equal(serializeTodo({ dueDate: null }).dueDate, null);
});

test("invalid calendar dates and non-date input are rejected", () => {
  for (const value of ["2025-02-29", "2026-02-30", "2026-04-31", "2026-13-01", "2026-00-01", "2026-01-00", "0000-01-01", "10000-01-01", "2026-1-1", "2026-01-01T00:00:00Z", "", "nonsense", 0, true, {}, []]) {
    assert.throws(() => parseDueDate(value), /dueDate must be a valid YYYY-MM-DD date or null/);
  }
});
