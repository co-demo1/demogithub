"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { deleteData, fetchData, postData, putData } from "@/lib/fetchData";
import { ListTodo, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

// Today's date in the user's own timezone, as "YYYY-MM-DD".
const localToday = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};

const formatDueDate = (dueDate) =>
  new Date(dueDate).toLocaleDateString(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
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
    if (dueDate && dueDate < localToday()) {
      setError("Due date cannot be in the past.");
      return;
    }
    setAdding(true);
    setError("");
    const todo = await postData("todos", {
      title: trimmed,
      dueDate: dueDate || null,
    });
    if (todo) {
      setTodos((prev) => [todo, ...prev]);
      setTitle("");
      setDueDate("");
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
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            aria-label="New task"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11"
          />
          <Input
            type="date"
            aria-label="Due date"
            min={localToday()}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-11 w-44 shrink-0"
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
          {todos.map((todo) => {
            const overdue =
              todo.dueDate &&
              !todo.completed &&
              todo.dueDate.slice(0, 10) < localToday();
            return (
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
                </label>
                {todo.dueDate && (
                  <span
                    className={`shrink-0 text-sm ${
                      overdue
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {overdue ? "Overdue · " : "Due "}
                    {formatDueDate(todo.dueDate)}
                  </span>
                )}
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
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
