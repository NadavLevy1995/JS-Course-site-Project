const express = require('express');
const connectToDB = require('../db/connection');
const Task = require('../DB/models/Task');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware – כדי שנוכל לקבל JSON מהלקוח
app.use(express.json());

// התחברות למסד הנתונים
connectToDB();

// בדיקה שהשרת עובד
app.get('/', (req, res) => {
  res.json({ message: '✅ Server is up and running!' });
});

// בקרוב: נכניס כאן route שיחזיר משימה לפי title

// התחלת השרת
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});