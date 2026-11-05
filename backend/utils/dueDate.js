const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// The earliest timezone (UTC-12) is the last place where a date is still
// "today", so it never refuses a user's real local today.
const EARLIEST_OFFSET_MS = 12 * 60 * 60 * 1000;

// Parses an optional "YYYY-MM-DD" due date into a UTC-midnight Date.
// Returns { value } or { error }.
function parseDueDate(input, now = new Date()) {
  if (input === undefined || input === null || input === "") {
    return { value: null };
  }

  if (typeof input !== "string" || !DATE_PATTERN.test(input)) {
    return { error: "Due date must be a date in YYYY-MM-DD format" };
  }

  const value = new Date(`${input}T00:00:00.000Z`);
  if (isNaN(value) || value.toISOString().slice(0, 10) !== input) {
    return { error: "Due date is not a valid date" };
  }

  const today = new Date(now.getTime() - EARLIEST_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
  if (input < today) {
    return { error: "Due date cannot be in the past" };
  }

  return { value };
}

module.exports = { parseDueDate };
