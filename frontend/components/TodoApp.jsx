"use client";
import Calendar from "@/components/Calendar";
import { Button } from "@/components/ui/button";
import { fetchData } from "@/lib/fetchData";
import { useEffect, useState } from "react";

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const loadTodos = async () => {
      const data = await fetchData("todos");
      if (data) setTodos(data);
      setLoading(false);
    };

    loadTodos();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className={`p-4 w-full ${showCalendar ? "max-w-4xl" : "max-w-md"}`}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Your Todos</h1>
        <Button variant="outline" onClick={() => setShowCalendar((v) => !v)}>
          {showCalendar ? "Hide Calendar" : "View Calendar"}
        </Button>
      </div>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <li key={todo.id} className="p-2 border rounded ">
            <p>{todo.title}</p>
          </li>
        ))}
      </ul>
      {showCalendar && <Calendar />}
    </div>
  );
}
