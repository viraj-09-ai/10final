// Seeds demo data: one Admin, one Security, one Employee, one Visitor account,
// plus a sample visitor profile, appointment and issued pass with QR + badge.
// Run with: npm run seed  (from the backend folder)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const User = require('./src/models/User');
const Visitor = require('./src/models/Visitor');
const Appointment = require('./src/models/Appointment');
const Pass = require('./src/models/Pass');
const CheckLog = require('./src/models/CheckLog');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding');

        await Promise.all([
            User.deleteMany(),
            Visitor.deleteMany(),
            Appointment.deleteMany(),
            Pass.deleteMany(),
            CheckLog.deleteMany()
        ]);

        const password = await bcrypt.hash('password123', 10);

        const [admin, security, employee, visitorUser] = await User.create([
            { name: 'Alice Admin', email: 'admin@demo.com', password, role: 'Admin' },
            { name: 'Sam Security', email: 'security@demo.com', password, role: 'Security' },
            { name: 'Eve Employee', email: 'employee@demo.com', password, role: 'Employee', department: 'Engineering' },
            { name: 'Vince Visitor', email: 'visitor@demo.com', password, role: 'Visitor' }
        ]);

        const visitorProfile = await Visitor.create({
            name: visitorUser.name,
            email: visitorUser.email,
            phone: '9990001111',
            company: 'Acme Corp',
            account: visitorUser._id,
            registeredBy: security._id
        });

        const appointment = await Appointment.create({
            visitor: visitorProfile._id,
            host: employee._id,
            purpose: 'Project discussion',
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'Approved',
            requestedBy: 'Employee',
            approvedBy: employee._id
        });

        const pass = await Pass.create({
            visitor: visitorProfile._id,
            appointment: appointment._id,
            purpose: 'Project discussion',
            validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            issuedBy: security._id
        });
        pass.qrCodeUrl = await QRCode.toDataURL(pass.qrToken);
        await pass.save();

        await CheckLog.create({
            pass: pass._id,
            visitor: visitorProfile._id,
            action: 'Check-In',
            scannedBy: security._id
        });

        console.log('\nDatabase seeded successfully!\n');
        console.log('Demo login credentials (password for all: password123)');
        console.log('  Admin:    admin@demo.com');
        console.log('  Security: security@demo.com');
        console.log('  Employee: employee@demo.com');
        console.log('  Visitor:  visitor@demo.com\n');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
