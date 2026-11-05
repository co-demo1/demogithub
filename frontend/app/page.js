import TodoApp from "@/components/TodoApp";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-start justify-center px-4 py-10">
      <TodoApp />
    </div>
  );
}
