// Calendar dates cross the API as YYYY-MM-DD, never as local timestamps.
function parseDueDate(value) {
  if (value === undefined || value === null) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !value.startsWith("0000")) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value) {
      return date;
    }
  }
  throw new Error("dueDate must be a valid YYYY-MM-DD date or null");
}

function serializeTodo(todo) {
  return { ...todo, dueDate: todo.dueDate?.toISOString().slice(0, 10) ?? null };
}

module.exports = { parseDueDate, serializeTodo };
