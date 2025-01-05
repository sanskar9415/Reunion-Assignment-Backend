require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});


mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Failed to connect to MongoDB:', error));

const taskSchema = new mongoose.Schema({
  title: String,
  priority: Number,
  status: { type: String, enum: ['Pending', 'Finished'] },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  totalTime: Number,
});

const Task = mongoose.model('Task', taskSchema);

app.post('/api/tasks', async (req, res) => {
    try {
        const { title, priority, status, start_time, end_time } = req.body;

        if (!title || !priority || !status || !start_time || !end_time) {
            console.error('Missing fields in request:', req.body);
            return res.status(400).json({ error: 'All fields are required' });
        }

        const totalTime = (new Date(end_time).getTime() - new Date(start_time).getTime()) / 3600000;

        const newTask = new Task({
            title,
            priority,
            status,
            startTime: start_time,
            endTime: end_time,
            totalTime,
        });

        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});



// API Routes
app.get('/api/tasks/statistics', async (req, res) => {
  try {
    const tasks = await Task.find();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === 'Finished');
    const pendingTasks = tasks.filter((task) => task.status === 'Pending');

    const completedPercentage = totalTasks ? (completedTasks.length / totalTasks) * 100 : 0;
    const pendingPercentage = totalTasks ? (pendingTasks.length / totalTasks) * 100 : 0;

    const totalTimeLapsed = pendingTasks.reduce((sum, task) => {
      const now = new Date();
      const startTime = task.startTime ? new Date(task.startTime) : now;
      return sum + Math.max(0, (now - startTime) / 3600000);
    }, 0);

    const totalTimeToFinish = pendingTasks.reduce((sum, task) => {
      const endTime = task.endTime ? new Date(task.endTime) : null;
      const now = new Date();
      return sum + (endTime && endTime > now ? (endTime - now) / 3600000 : 0);
    }, 0);

    const averageCompletionTime =
      completedTasks.reduce((sum, task) => sum + (task.totalTime || 0), 0) /
      (completedTasks.length || 1);

    const priorities = [1, 2, 3, 4, 5];
    const pendingTaskSummary = priorities.map((priority) => {
      const tasksForPriority = pendingTasks.filter((task) => task.priority === priority);
      const timeLapsed = tasksForPriority.reduce((sum, task) => {
        const now = new Date();
        const startTime = task.startTime ? new Date(task.startTime) : now;
        return sum + Math.max(0, (now - startTime) / 3600000);
      }, 0);

      const timeToFinish = tasksForPriority.reduce((sum, task) => {
        const endTime = task.endTime ? new Date(task.endTime) : null;
        const now = new Date();
        return sum + (endTime && endTime > now ? (endTime - now) / 3600000 : 0);
      }, 0);

      return {
        priority,
        pendingTasks: tasksForPriority.length,
        timeLapsed,
        timeToFinish,
      };
    });

    res.json({
      totalTasks,
      completedPercentage,
      pendingPercentage,
      pendingTasks: pendingTasks.length,
      totalTimeLapsed,
      totalTimeToFinish,
      averageCompletionTime,
      pendingTaskSummary,
    });
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

app.get('/api/tasks', async (req, res) => {
    try {
      const tasks = await Task.find();
      const mappedTasks = tasks.map((task) => ({
        ...task.toObject(),
        id: task._id,
      }));
      res.json(mappedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });
  

  app.put('/api/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid task ID format' });
      }
  
      const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }
  
      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });
  
  
  app.delete('/api/tasks', async (req, res) => {
    try {
      const { ids } = req.body; // Array of task ids from frontend
      if (!ids || !ids.every((id) => mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ error: 'Invalid task IDs' });
      }
  
      await Task.deleteMany({ _id: { $in: ids } });
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting tasks:', error);
      res.status(500).json({ error: 'Failed to delete tasks' });
    }
  });
  

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
