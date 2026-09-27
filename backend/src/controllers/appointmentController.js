const Appointment = require('../models/Appointment');
const Visitor = require('../models/Visitor');
const { sendAppointmentInvite, sendApprovalNotification } = require('../utils/mailer');
const { sendSMS } = require('../utils/sms');

// POST /api/appointments/invite  (Employee) - host invites a visitor
exports.inviteVisitor = async (req, res) => {
    try {
        const { name, email, phone, company, purpose, scheduledDate } = req.body;
        if (!name || !phone || !purpose || !scheduledDate) {
            return res.status(400).json({ error: 'name, phone, purpose and scheduledDate are required' });
        }

        let visitor = email ? await Visitor.findOne({ email: email.toLowerCase() }) : null;
        if (!visitor) {
            visitor = await Visitor.create({
                name, email, phone, company, registeredBy: req.user.userId
            });
        }

        const appointment = await Appointment.create({
            visitor: visitor._id,
            host: req.user.userId,
            purpose,
            scheduledDate,
            status: 'Approved', // host-initiated invites are auto-approved
            requestedBy: 'Employee',
            approvedBy: req.user.userId
        });

        if (email) {
            await sendAppointmentInvite(email, { visitorName: name, hostName: req.user.name, date: scheduledDate, purpose });
        }
        if (phone) {
            await sendSMS(phone, `You're invited to visit on ${new Date(scheduledDate).toLocaleString()}. Purpose: ${purpose}`);
        }

        res.status(201).json(await appointment.populate('visitor host'));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create invitation' });
    }
};

// POST /api/appointments/pre-register  (Visitor) - self pre-registration request
exports.preRegister = async (req, res) => {
    try {
        const { hostId, purpose, scheduledDate } = req.body;
        if (!hostId || !purpose || !scheduledDate) {
            return res.status(400).json({ error: 'hostId, purpose and scheduledDate are required' });
        }

        const visitor = await Visitor.findOne({ account: req.user.userId });
        if (!visitor) return res.status(404).json({ error: 'Complete your visitor profile first' });

        const appointment = await Appointment.create({
            visitor: visitor._id,
            host: hostId,
            purpose,
            scheduledDate,
            status: 'Pending',
            requestedBy: 'Visitor'
        });

        res.status(201).json(await appointment.populate('visitor host'));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit pre-registration' });
    }
};

// GET /api/appointments  (Admin: all, Employee: own as host, Visitor: own)
// Query: ?status=Pending
exports.getAppointments = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;

        if (req.user.role === 'Employee') {
            filter.host = req.user.userId;
        } else if (req.user.role === 'Visitor') {
            const visitor = await Visitor.findOne({ account: req.user.userId });
            filter.visitor = visitor ? visitor._id : null;
        }
        // Admin / Security see all (optionally filtered by status/date via query above)

        const appointments = await Appointment.find(filter)
            .populate('visitor', 'name email phone photoUrl company')
            .populate('host', 'name email department')
            .sort({ scheduledDate: -1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/appointments/:id/approve  (Employee - the host, or Admin)
exports.approveAppointment = async (req, res) => {
    try {
        const { decision } = req.body; // 'Approved' | 'Rejected'
        if (!['Approved', 'Rejected'].includes(decision)) {
            return res.status(400).json({ error: "decision must be 'Approved' or 'Rejected'" });
        }

        const appointment = await Appointment.findById(req.params.id).populate('visitor');
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

        if (req.user.role === 'Employee' && String(appointment.host) !== String(req.user.userId)) {
            return res.status(403).json({ error: 'You can only act on your own invitations' });
        }

        appointment.status = decision;
        appointment.approvedBy = req.user.userId;
        await appointment.save();

        if (appointment.visitor?.email) {
            await sendApprovalNotification(appointment.visitor.email, {
                visitorName: appointment.visitor.name,
                status: decision,
                date: appointment.scheduledDate
            });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
