const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: { type: String, unique: true, required: true },
  password: String,
  profilePic: String
});

module.exports = mongoose.model('User', userSchema);