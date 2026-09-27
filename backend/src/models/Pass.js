const mongoose = require('mongoose');
const crypto = require('crypto');

const passSchema = new mongoose.Schema({
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    purpose: { type: String, required: true },
    qrToken: { type: String, unique: true, default: () => crypto.randomBytes(16).toString('hex') },
    qrCodeUrl: { type: String }, // base64 data URL
    badgeUrl: { type: String, default: '' }, // path to generated PDF badge
    status: { type: String, enum: ['Active', 'CheckedIn', 'CheckedOut', 'Expired'], default: 'Active' },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Pass', passSchema);
