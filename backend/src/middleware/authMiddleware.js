// File path: src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const header = req.header('Authorization');
    if (!header) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const token = header.startsWith('Bearer ') ? header.replace('Bearer ', '') : header;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, role, name }
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Usage: checkRole(['Admin', 'Security'])
exports.checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Unauthorized role. Access denied.' });
        }
        next();
    };
};
