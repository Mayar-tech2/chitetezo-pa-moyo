const mongoose = require('mongoose'); // Add this line at the very top

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  district: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);