const QRCode = require('qrcode');
const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const CheckLog = require('../models/CheckLog');
const Appointment = require('../models/Appointment');
const { generateBadgePDF } = require('../utils/pdfGenerator');
const { sendPassNotification } = require('../utils/mailer');

// POST /api/passes/issue  (Security, Admin)
// body: { visitorId, appointmentId?, purpose, validUntil }
exports.issuePass = async (req, res) => {
    try {
        const { visitorId, appointmentId, purpose, validUntil } = req.body;
        if (!visitorId || !purpose || !validUntil) {
            return res.status(400).json({ error: 'visitorId, purpose and validUntil are required' });
        }

        const visitor = await Visitor.findById(visitorId);
        if (!visitor) return res.status(404).json({ error: 'Visitor not found' });

        const pass = await Pass.create({
            visitor: visitor._id,
            appointment: appointmentId || null,
            purpose,
            validUntil,
            issuedBy: req.user.userId
        });

        // Encode the pass's unique QR token (not the Mongo _id) into the QR image
        pass.qrCodeUrl = await QRCode.toDataURL(pass.qrToken);
        await pass.save();

        // Generate the printable PDF badge (photo + QR + details)
        try {
            const populatedPass = await pass.populate('visitor');
            const filePath = await generateBadgePDF(populatedPass);
            pass.badgeUrl = `/uploads/badges/${filePath.split('/').pop()}`;
            await pass.save();
        } catch (badgeErr) {
            console.error('Badge generation failed:', badgeErr.message);
        }

        if (appointmentId) {
            await Appointment.findByIdAndUpdate(appointmentId, { status: 'Approved' });
        }

        if (visitor.email) {
            await sendPassNotification(visitor.email, `Purpose: ${purpose}. Valid until ${new Date(validUntil).toLocaleString()}.`);
        }

        res.status(201).json(pass);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to issue pass' });
    }
};

// GET /api/passes  (Security, Admin) - list, ?status=Active
exports.getPasses = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        const passes = await Pass.find(filter).populate('visitor').sort({ createdAt: -1 });
        res.json(passes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/passes/:id
exports.getPassById = async (req, res) => {
    try {
        const pass = await Pass.findById(req.params.id).populate('visitor');
        if (!pass) return res.status(404).json({ error: 'Pass not found' });

        // A Visitor may only view their own pass
        if (req.user.role === 'Visitor') {
            const visitor = await Visitor.findOne({ account: req.user.userId });
            if (!visitor || String(pass.visitor._id) !== String(visitor._id)) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        res.json(pass);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/passes/mine  (Visitor) - the visitor's own active/most recent passes
exports.getMyPasses = async (req, res) => {
    try {
        const visitor = await Visitor.findOne({ account: req.user.userId });
        if (!visitor) return res.status(404).json({ error: 'Visitor profile not found' });
        const passes = await Pass.find({ visitor: visitor._id }).sort({ createdAt: -1 });
        res.json(passes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/passes/scan  (Security, Admin)
// body: { qrToken }  -- toggles Check-In -> Check-Out on successive scans
exports.scanPass = async (req, res) => {
    try {
        const { qrToken } = req.body;
        if (!qrToken) return res.status(400).json({ error: 'qrToken is required' });

        const pass = await Pass.findOne({ qrToken }).populate('visitor');
        if (!pass) return res.status(404).json({ error: 'Invalid pass. QR code not recognized.' });

        if (pass.status === 'Expired' || new Date() > new Date(pass.validUntil)) {
            pass.status = 'Expired';
            await pass.save();
            return res.status(400).json({ error: 'This pass has expired' });
        }

        // Toggle logic: Active/CheckedOut -> Check-In, CheckedIn -> Check-Out
        const action = pass.status === 'CheckedIn' ? 'Check-Out' : 'Check-In';
        pass.status = action === 'Check-In' ? 'CheckedIn' : 'CheckedOut';
        await pass.save();

        const log = await CheckLog.create({
            pass: pass._id,
            visitor: pass.visitor._id,
            action,
            scannedBy: req.user.userId
        });

        if (pass.appointment) {
            await Appointment.findByIdAndUpdate(pass.appointment, {
                status: action === 'Check-In' ? 'CheckedIn' : 'CheckedOut'
            });
        }

        res.status(200).json({
            message: `${action} recorded successfully`,
            action,
            visitor: pass.visitor,
            log
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Scan failed' });
    }
};

// GET /api/passes/logs  (Security, Admin, Employee) - check-in/out history
// Query: ?search=&action=&from=&to=
exports.getLogs = async (req, res) => {
    try {
        const { search, action, from, to } = req.query;
        const filter = {};
        if (action) filter.action = action;
        if (from || to) {
            filter.timestamp = {};
            if (from) filter.timestamp.$gte = new Date(from);
            if (to) filter.timestamp.$lte = new Date(to);
        }

        let logs = await CheckLog.find(filter)
            .populate('visitor', 'name phone email company')
            .populate('pass', 'purpose')
            .populate('scannedBy', 'name role')
            .sort({ timestamp: -1 });

        if (search) {
            const q = search.toLowerCase();
            logs = logs.filter((log) =>
                log.visitor?.name?.toLowerCase().includes(q) ||
                log.visitor?.phone?.toLowerCase().includes(q) ||
                log.visitor?.email?.toLowerCase().includes(q)
            );
        }

        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};
