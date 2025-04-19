const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  baseCode: { type: String, required: true },
  referenceCode: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.model("Room", roomSchema, "tasks");

module.exports = Room;
