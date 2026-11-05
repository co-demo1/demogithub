const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/auth");
const { parseSlot } = require("../utils/slot");

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// True when another of the user's todos already holds this slot
const slotTaken = async (userId, scheduledAt, exceptId) => {
  const clash = await prisma.todo.findFirst({
    where: { userId, scheduledAt, ...(exceptId && { id: { not: exceptId } }) },
  });
  return Boolean(clash);
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
        scheduledAt: true,
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

  const slot = parseSlot(req.body.scheduledAt);
  if (slot.error) {
    return res.status(400).json({ error: slot.error });
  }

  try {
    if (slot.value && (await slotTaken(req.user.id, slot.value))) {
      return res.status(409).json({ error: "That time slot is already booked" });
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        scheduledAt: slot.value,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        completed: true,
        scheduledAt: true,
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

  const slot = parseSlot(req.body.scheduledAt);
  if (slot.error) {
    return res.status(400).json({ error: slot.error });
  }

  try {
    const existing = await prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: "Todo not found" });
    }

    if (slot.value && (await slotTaken(req.user.id, slot.value, todoId))) {
      return res.status(409).json({ error: "That time slot is already booked" });
    }

    const updated = await prisma.todo.update({
      where: { id: todoId },
      data: { title, completed, scheduledAt: slot.value },
      select: {
        id: true,
        title: true,
        completed: true,
        scheduledAt: true,
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
