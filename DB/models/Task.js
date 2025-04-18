const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true, 
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  baseCode: {
    type: String,
    required: true
  },
  referenceCode: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    default: 'tom'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
