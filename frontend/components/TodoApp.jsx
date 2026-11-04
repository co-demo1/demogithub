"use client";
import { fetchData, putData } from "@/lib/fetchData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

function TodoItem({ todo, onUpdate }) {
  const [dueDate, setDueDate] = useState(todo.dueDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saveDate = async (value) => {
    setSaving(true);
    setError("");
    const updated = await putData(`todos/${todo.id}`, { dueDate: value || null });
    if (updated) {
      onUpdate(updated);
      setDueDate(updated.dueDate ?? "");
    } else {
      setError("Could not save due date. Please try again.");
    }
    setSaving(false);
  };

  return (
    <li className="p-2 border rounded">
      <p className="break-words">{todo.title}</p>
      <p className="text-sm text-muted-foreground mb-2" aria-live="polite">
        {todo.dueDate ? `Due: ${todo.dueDate}` : "No due date"}
      </p>
      <form onSubmit={(event) => { event.preventDefault(); saveDate(dueDate); }}>
        <fieldset disabled={saving} aria-busy={saving} className="space-y-2 min-w-0">
          <label htmlFor={`due-date-${todo.id}`} className="text-sm font-medium">
            Due date for {todo.title}
          </label>
          <Input
            id={`due-date-${todo.id}`}
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            aria-describedby={error ? `due-error-${todo.id}` : undefined}
          />
          <div className="flex gap-2">
            <Button type="submit">{saving ? "Saving..." : "Save date"}</Button>
            <Button type="button" variant="outline" onClick={() => saveDate(null)}>
              Clear date
            </Button>
          </div>
        </fieldset>
        {error && <p id={`due-error-${todo.id}`} role="alert" className="text-sm text-destructive mt-2">{error}</p>}
      </form>
    </li>
  );
}

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTodos = async () => {
      const data = await fetchData("todos");
      if (data) setTodos(data);
      else setError("Could not load todos. Please reload to try again.");
      setLoading(false);
    };

    loadTodos();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4 w-full max-w-md">
      <h1 className="text-2xl font-semibold mb-4">Your Todos</h1>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <ul className="space-y-2">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onUpdate={(updated) => setTodos((current) => current.map((item) => item.id === updated.id ? updated : item))}
          />
        ))}
      </ul>
    </div>
  );
}
