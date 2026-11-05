const test = require("node:test");
const assert = require("node:assert");
const { parseSlot } = require("./slot");

test("undefined leaves the slot unchanged, null and empty clear it", () => {
  assert.deepStrictEqual(parseSlot(undefined), { value: undefined });
  assert.deepStrictEqual(parseSlot(null), { value: null });
  assert.deepStrictEqual(parseSlot(""), { value: null });
});

test("an ISO date on the hour is accepted", () => {
  const { value } = parseSlot("2026-11-05T09:00:00.000Z");
  assert.strictEqual(value.toISOString(), "2026-11-05T09:00:00.000Z");
});

test("a half-hour UTC offset start is accepted", () => {
  assert.ok(parseSlot("2026-11-05T03:30:00.000Z").value);
});

test("garbage, numbers and off-slot times are rejected", () => {
  assert.ok(parseSlot("not a date").error);
  assert.ok(parseSlot(12345).error);
  assert.ok(parseSlot("2026-11-05T09:10:00.000Z").error);
  assert.ok(parseSlot("2026-11-05T09:00:30.000Z").error);
});
