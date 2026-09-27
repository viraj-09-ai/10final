// Admin-only staff management (Security / Employee / Admin accounts).
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET /api/users  (Admin) - list all users, optional ?role= filter
exports.listUsers = async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/users/employees (Employee, Admin, Security) - list hosts for invite dropdowns
exports.listEmployees = async (req, res) => {
    try {
        const employees = await User.find({ role: 'Employee', isActive: true }).select('name email department');
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/users  (Admin) - create a staff account (Admin/Security/Employee)
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, department } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Name, email, password and role are required' });
        }
        if (!['Admin', 'Security', 'Employee'].includes(role)) {
            return res.status(400).json({ error: 'Role must be Admin, Security or Employee' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(409).json({ error: 'A user with this email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name, email: email.toLowerCase(), password: hashedPassword, role, phone, department
        });

        res.status(201).json({ message: 'Staff account created', user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/users/:id  (Admin) - update role / active status
exports.updateUser = async (req, res) => {
    try {
        const { role, isActive, department, phone, name } = req.body;
        const update = {};
        if (role) update.role = role;
        if (typeof isActive === 'boolean') update.isActive = isActive;
        if (department !== undefined) update.department = department;
        if (phone !== undefined) update.phone = phone;
        if (name !== undefined) update.name = name;

        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/users/:id  (Admin)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
