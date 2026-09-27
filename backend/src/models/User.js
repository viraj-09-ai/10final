const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['Admin', 'Security', 'Employee', 'Visitor'],
        default: 'Visitor'
    },
    phone: { type: String, default: '' },
    department: { type: String, default: '' }, // used for Employee/host
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
