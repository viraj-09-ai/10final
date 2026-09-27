const Visitor = require('../models/Visitor');

// POST /api/visitors  (Security, Employee, Admin) - register a visitor profile,
// optionally with a photo (multipart field name: "photo").
exports.createVisitor = async (req, res) => {
    try {
        const { name, email, phone, company, idProofType, idProofNumber } = req.body;
        if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });

        const visitor = await Visitor.create({
            name, email, phone, company, idProofType, idProofNumber,
            photoUrl: req.file ? `/uploads/${req.file.filename}` : '',
            registeredBy: req.user.userId
        });

        res.status(201).json(visitor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to register visitor' });
    }
};

// GET /api/visitors  (Security, Employee, Admin) - list + search + filter
// Query params: ?search=name/phone/email&company=&from=&to=
exports.getVisitors = async (req, res) => {
    try {
        const { search, company, from, to } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (company) filter.company = { $regex: company, $options: 'i' };
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const visitors = await Visitor.find(filter).sort({ createdAt: -1 });
        res.json(visitors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/visitors/:id
exports.getVisitorById = async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.params.id);
        if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
        res.json(visitor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/visitors/me  (Visitor role) - own visitor profile
exports.getMyVisitorProfile = async (req, res) => {
    try {
        const visitor = await Visitor.findOne({ account: req.user.userId });
        if (!visitor) return res.status(404).json({ error: 'Visitor profile not found' });
        res.json(visitor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/visitors/:id  (Security, Employee, Admin) - update details / add photo later
exports.updateVisitor = async (req, res) => {
    try {
        const update = { ...req.body };
        if (req.file) update.photoUrl = `/uploads/${req.file.filename}`;

        const visitor = await Visitor.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
        res.json(visitor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/visitors/:id  (Admin)
exports.deleteVisitor = async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndDelete(req.params.id);
        if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
        res.json({ message: 'Visitor removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
