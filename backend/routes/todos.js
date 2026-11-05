const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/auth");
const { parseDueDate } = require("../utils/dueDate");

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

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
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const dueDate = parseDueDate(req.body.dueDate);
  if (dueDate.error) {
    return res.status(400).json({ error: dueDate.error });
  }

  try {
    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDate.value,
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
  const { title, completed } = req.body;
  const todoId = parseInt(id, 10);

  if (completed !== undefined && typeof completed !== "boolean") {
    return res.status(400).json({ error: "Invalid completed status" });
  }

  // Only a due date sent in this request is checked, so a task that is
  // already overdue can still be renamed or completed.
  const dueDate =
    req.body.dueDate !== undefined ? parseDueDate(req.body.dueDate) : {};
  if (dueDate.error) {
    return res.status(400).json({ error: dueDate.error });
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
      data: { title, completed, dueDate: dueDate.value },
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
