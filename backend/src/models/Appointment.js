// An invitation / pre-registration linking a Visitor to a host Employee.
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Employee
    purpose: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'CheckedIn', 'CheckedOut', 'Cancelled'],
        default: 'Pending'
    },
    requestedBy: { type: String, enum: ['Visitor', 'Employee'], default: 'Employee' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
