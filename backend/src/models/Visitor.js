// Visitor profile - the physical person visiting.
// May or may not be linked to a User account (role: Visitor) via `account`.
const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true },
    company: { type: String, default: '' },
    idProofType: { type: String, default: '' },
    idProofNumber: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);
