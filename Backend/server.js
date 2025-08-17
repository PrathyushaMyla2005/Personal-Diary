const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const User = require('./models/User');
const Diary = require('./models/Diary');
require('dotenv').config();
const path = require('path');
const profileRoutes = require('./routes/profile');

const app = express();

// Serve frontend
app.use(express.static(path.join(__dirname, '../Frontend')));
app.use(cors()); // you can also restrict to your frontend URL

// Increase body size limit to handle large JSON (images in base64)
app.use(bodyParser.json({ limit: '20mb' })); // Accept JSON payload up to 20MB
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// ==================== Routes ==================== //

// Signup Route
app.post('/api/signup', async (req, res) => {
  const { name, username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const user = new User({ name, username, email, password });
    await user.save();
    res.json({ message: 'Signup successful, please login' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save a new diary entry
app.post('/api/diary', async (req, res) => {
  const { user, title, date, mood, content, lat, lng } = req.body;
  try {
    const entry = new Diary({ user, title, date, mood, content, lat, lng });
    await entry.save();
    res.json({ message: 'Diary entry saved!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save entry' });
  }
});

// Get diary entries for a user and optionally a specific date
app.get('/api/diary', async (req, res) => {
  const { user, date } = req.query;
  if (!user) return res.status(400).json({ error: 'User is required' });

  try {
    let query = { user };
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }
    const entries = await Diary.find(query).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch entries' });
  }
});

// Update a diary entry by ID
app.put('/api/diary/:id', async (req, res) => {
  const { id } = req.params;
  const { user, title, content, date, mood, lat, lng } = req.body;
  try {
    const updated = await Diary.findByIdAndUpdate(
      id,
      { user, title, content, date, mood, lat, lng },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Entry updated', entry: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update entry' });
  }
});

// Delete a diary entry by ID
app.delete('/api/diary/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Diary.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete entry' });
  }
});

// Fetch profile
app.get('/api/profile/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }, '-password'); // exclude password
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch profile' });
  }
});

// Update profile
app.put('/api/profile/:username', async (req, res) => {
  const { username } = req.params;
  const { name, email, password, profilePic } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (email !== undefined) user.email = email;
    if (profilePic !== undefined) user.profilePic = profilePic;
    if (password) user.password = password;

    await user.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

