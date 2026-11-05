const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const userRoutes = require("./routes/users");
const todoRoutes = require("./routes/todos");
const appointmentRoutes = require("./routes/appointments");

app.use("/api/users", userRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/appointments", appointmentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
