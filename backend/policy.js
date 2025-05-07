const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    default: 'basic',
    enum: ['basic', 'standard', 'premium']
  },
  premium: {
    type: Number,
    required: true
  },
  coverage: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date
});

module.exports = mongoose.model('Policy', PolicySchema);