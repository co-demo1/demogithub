const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

const select = { id: true, title: true, start: true };

// GET /api/appointments?from=ISO&to=ISO - Get appointments in a range
router.get("/", async (req, res) => {
  const where = { userId: req.user.id };
  const { from, to } = req.query;

  if (from || to) {
    const gte = from ? new Date(from) : undefined;
    const lt = to ? new Date(to) : undefined;
    if ((gte && isNaN(gte)) || (lt && isNaN(lt))) {
      return res.status(400).json({ error: "Invalid date range" });
    }
    where.start = { gte, lt };
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { start: "asc" },
      select,
    });
    res.json(appointments);
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/appointments - Book a time slot
router.post("/", async (req, res) => {
  const { title, start } = req.body;
  const startDate = new Date(start);

  if (!title || !start || isNaN(startDate)) {
    return res.status(400).json({ error: "Title and a valid start are required" });
  }

  try {
    const appointment = await prisma.appointment.create({
      data: { title, start: startDate, userId: req.user.id },
      select,
    });
    res.status(201).json(appointment);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Time slot already booked" });
    }
    console.error("Error creating appointment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/appointments/:id - Cancel an appointment
router.delete("/:id", async (req, res) => {
  const appointmentId = parseInt(req.params.id, 10);

  try {
    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    await prisma.appointment.delete({ where: { id: appointmentId } });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting appointment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
