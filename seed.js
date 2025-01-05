require('dotenv').config();
const mongoose = require('mongoose');
const { Task } = require('./server'); // Import Task model

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch((error) => console.error('Failed to connect to MongoDB:', error));

const seedTasks = async () => {
  try {
    await Task.deleteMany(); // Clear existing tasks

    const tasks = [
      {
        title: 'Buy groceries',
        priority: 2,
        status: 'Pending',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        totalTime: 1,
      },
      {
        title: 'Complete project',
        priority: 5,
        status: 'Finished',
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(),
        totalTime: 2,
      },
      {
        title: 'Call plumber',
        priority: 3,
        status: 'Pending',
        startTime: new Date(),
        endTime: new Date(Date.now() + 7200000),
        totalTime: 2,
      },
      {
        title: 'Plan vacation',
        priority: 4,
        status: 'Finished',
        startTime: new Date(Date.now() - 10800000),
        endTime: new Date(),
        totalTime: 3,
      },
    ];

    await Task.insertMany(tasks);
    console.log('Seeded tasks to the database');
  } catch (error) {
    console.error('Failed to seed tasks:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedTasks();
