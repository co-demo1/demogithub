const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Parses a "YYYY-MM-DD" due date. Returns { value } or { error }.
// "Today" is taken in the earliest time zone (UTC-12), so a client's today
// is never rejected wherever it is.
const parseDueDate = (input) => {
  if (input === null || input === "") return { value: null };
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return { error: "Invalid due date" };
  }
  const date = new Date(`${input}T00:00:00.000Z`);
  if (isNaN(date) || date.toISOString().slice(0, 10) !== input) {
    return { error: "Invalid due date" };
  }
  const earliestToday = new Date(Date.now() - 12 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  if (input < earliestToday) {
    return { error: "Due date cannot be in the past" };
  }
  return { value: date };
};

// GET /api/todos - Get all todos for logged-in user
router.get("/", async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        completed: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(todos);
  } catch (err) {
    console.error("Error fetching todos:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/todos - Create new todo
router.post("/", async (req, res) => {
  const { title, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const due = dueDate === undefined ? { value: null } : parseDueDate(dueDate);
  if (due.error) {
    return res.status(400).json({ error: due.error });
  }

  try {
    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: due.value,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        completed: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.status(201).json(todo);
  } catch (err) {
    console.error("Error creating todo:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/todos/:id - Update todo
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, completed, dueDate } = req.body;
  const todoId = parseInt(id, 10);

  if (completed !== undefined && typeof completed !== "boolean") {
    return res.status(400).json({ error: "Invalid completed status" });
  }

  const due = dueDate === undefined ? {} : parseDueDate(dueDate);
  if (due.error) {
    return res.status(400).json({ error: due.error });
  }

  try {
    const existing = await prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: "Todo not found" });
    }

    const updated = await prisma.todo.update({
      where: { id: todoId },
      data: { title, completed, dueDate: due.value },
      select: {
        id: true,
        title: true,
        completed: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Error updating todo:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/todos/:id - Delete todo
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const todoId = parseInt(id, 10);

  try {
    const existing = await prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: "Todo not found" });
    }

    await prisma.todo.delete({
      where: { id: todoId },
    });

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting todo:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
