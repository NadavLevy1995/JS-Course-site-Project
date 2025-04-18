const express = require('express');
const connectToDB = require('../db/connection');
const Task = require('../db/models/Task');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware – allows parsing JSON requests
app.use(express.json());

// Connect to the MongoDB database
connectToDB();

// Simple route to check server status
app.get('/', (req, res) => {
  res.json({ message: '✅ Server is up and running!' });
});

// Coming soon: route to fetch a task by title

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});