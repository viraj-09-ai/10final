const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Visitor = require('../models/Visitor');

const signToken = (user) =>
    jwt.sign(
        { userId: user._id, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

// POST /api/auth/login  (all roles)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = signToken(user);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/auth/register  (public self-registration - always creates a Visitor account)
// Staff accounts (Admin/Security/Employee) are created by an Admin via /api/users.
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name, email: email.toLowerCase(), password: hashedPassword, phone, role: 'Visitor'
        });

        // Auto-create a linked Visitor profile so the person shows up in visitor records
        await Visitor.create({ name, email: user.email, phone: phone || '', account: user._id });

        const token = signToken(user);
        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/auth/me  (any authenticated user)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
