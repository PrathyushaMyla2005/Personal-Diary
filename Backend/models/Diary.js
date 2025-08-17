const mongoose = require('mongoose');

const DiarySchema = new mongoose.Schema({
  user: { type: String, required: true }, // username or user id
  title: { type: String, required: true },
  date: { type: Date, required: true },
  mood: { type: String },
  content: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number }
});

module.exports = mongoose.model('Diary', DiarySchema);