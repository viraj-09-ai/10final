const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema({
    pass: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    action: { type: String, enum: ['Check-In', 'Check-Out'], required: true },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CheckLog', checkLogSchema);
