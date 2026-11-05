"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { deleteData, fetchData, postData, putData } from "@/lib/fetchData";
import { CalendarDays, ListTodo, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import CalendarView from "./CalendarView";

// datetime-local value -> ISO start of that local hour, or null when empty
const toSlot = (value) => {
  if (!value) return null;
  const date = new Date(value);
  date.setMinutes(0, 0, 0);
  return date.toISOString();
};

const formatSlot = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [slot, setSlot] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const closeCalendar = useCallback(() => setCalendarOpen(false), []);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [pendingIds, setPendingIds] = useState(new Set());

  useEffect(() => {
    const loadTodos = async () => {
      const data = await fetchData("todos");
      if (data) setTodos(data);
      else setLoadFailed(true);
      setLoading(false);
    };

    loadTodos();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setAdding(true);
    setError("");
    const scheduledAt = toSlot(slot);
    const taken = scheduledAt && todos.some(
      (t) => t.scheduledAt && new Date(t.scheduledAt).getTime() === new Date(scheduledAt).getTime()
    );
    if (taken) {
      setError("That time slot is already booked.");
      setAdding(false);
      return;
    }
    const todo = await postData("todos", { title: trimmed, scheduledAt });
    if (todo) {
      setTodos((prev) => [todo, ...prev]);
      setTitle("");
      setSlot("");
    } else {
      setError("Could not add the task.");
    }
    setAdding(false);
  };

  const setPending = (id, pending) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      pending ? next.add(id) : next.delete(id);
      return next;
    });

  const handleToggle = async (todo) => {
    setError("");
    setPending(todo.id, true);
    const updated = await putData(`todos/${todo.id}`, {
      completed: !todo.completed,
    });
    if (updated) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
    } else {
      setError("Could not update the task.");
    }
    setPending(todo.id, false);
  };

  const handleDelete = async (todo) => {
    setError("");
    setPending(todo.id, true);
    const ok = await deleteData(`todos/${todo.id}`);
    if (ok) {
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } else {
      setError("Could not delete the task.");
    }
    setPending(todo.id, false);
  };

  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Your Tasks</CardTitle>
        <CardDescription>
          {loading
            ? "Loading..."
            : loadFailed
            ? "Could not load your tasks."
            : `${todos.length - doneCount} open, ${doneCount} done`}
        </CardDescription>
        <CardAction>
          <Button variant="outline" onClick={() => setCalendarOpen(true)}>
            <CalendarDays className="w-4 h-4" />
            View Calendar
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
          <Input
            aria-label="New task"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 flex-1 min-w-48"
          />
          <Input
            type="datetime-local"
            step={3600}
            aria-label="Time slot (optional)"
            title="Time slot (optional)"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            className="h-11 w-auto"
          />
          <Button
            type="submit"
            disabled={adding || !title.trim()}
            className="h-11"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </form>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!loading && !loadFailed && todos.length === 0 && (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <ListTodo className="w-10 h-10 mb-2" />
            <p>No tasks yet. Add your first one above.</p>
          </div>
        )}

        <ul className="divide-y rounded-md border empty:hidden">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 px-4 py-3">
              <Checkbox
                id={`todo-${todo.id}`}
                checked={todo.completed}
                disabled={pendingIds.has(todo.id)}
                onCheckedChange={() => handleToggle(todo)}
              />
              <label
                htmlFor={`todo-${todo.id}`}
                className={`flex-1 break-words ${
                  todo.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {todo.title}
                {todo.scheduledAt && (
                  <span className="block text-xs text-muted-foreground">
                    {formatSlot(todo.scheduledAt)}
                  </span>
                )}
              </label>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${todo.title}`}
                disabled={pendingIds.has(todo.id)}
                onClick={() => handleDelete(todo)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
      {calendarOpen && <CalendarView todos={todos} onClose={closeCalendar} />}
    </Card>
  );
}
