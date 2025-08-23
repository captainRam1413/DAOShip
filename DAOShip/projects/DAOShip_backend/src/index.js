require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const daoRoutes = require("./routes/dao.routes");
const daoAptosRoutes = require("./routes/dao.routes.aptos");
const proposalRoutes = require("./routes/proposal.routes");
const userRoutes = require("./routes/user.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect("mongodb+srv://vedantintiproject:Vedant1@cluster0.cndieto.mongodb.net/mydb?retryWrites=true&w=majority" || "mongodb://localhost:27017/dao-creator", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API info route
app.get('/', (req, res) => {
  res.json({
    message: 'DAOShip Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      dao: '/api/dao',
      daoV2: '/api/v2/dao',
      proposal: '/api/proposal',
      proposalV2: '/api/v2/proposal',
      user: '/api/user'
    },
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use("/api/dao", daoRoutes);
app.use("/api/v2/dao", daoAptosRoutes); // Aptos-integrated routes
app.use("/api/proposal", proposalRoutes);
app.use("/api/v2/proposal", proposalRoutes); // Use same proposal routes for v2 for now
app.use("/api/user", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
